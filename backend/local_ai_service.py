# pyright: reportMissingImports=warning
import os
import sys
import base64
import json
import logging
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
import cv2

load_dotenv()
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('local_ai_service')

# Try loading InsightFace
try:
    import insightface
    from insightface.app import FaceAnalysis
    # Initialize InsightFace model
    app_insight = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    app_insight.prepare(ctx_id=0, det_size=(640, 640))
    INSIGHT_FACE_AVAILABLE = True
    logger.info("InsightFace initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize InsightFace: {e}")
    INSIGHT_FACE_AVAILABLE = False

# Setup Silent-Face-Anti-Spoofing
sys.path.append(os.path.join(os.path.dirname(__file__), 'Silent-Face-Anti-Spoofing'))
try:
    from src.anti_spoof_predict import AntiSpoofPredict
    from src.generate_patches import CropImage
    from src.utility import parse_model_name

    anti_spoof_model_dir = os.path.join(os.path.dirname(__file__), 'Silent-Face-Anti-Spoofing', 'resources', 'anti_spoof_models')
    
    # Check if GPU is available, otherwise fallback to CPU (0 is typically device_id 0, AntiSpoofPredict handles fallback)
    import torch
    device_id = 0 if torch.cuda.is_available() else 0
    anti_spoof_predict = AntiSpoofPredict(device_id)
    image_cropper = CropImage()
    ANTI_SPOOF_AVAILABLE = True
    logger.info("Silent-Face-Anti-Spoofing initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Silent-Face-Anti-Spoofing: {e}")
    ANTI_SPOOF_AVAILABLE = False


def decode_image(base64_string):
    """Decodes a base64 string to a cv2 BGR image."""
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        # Add padding if necessary
        missing_padding = len(base64_string) % 4
        if missing_padding:
            base64_string += '=' * (4 - missing_padding)
            
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.error(f"Image decode error: {e}")
        return None

def compute_cosine_similarity(emb1, emb2):
    # Ensure they are numpy arrays
    emb1 = np.array(emb1).flatten()
    emb2 = np.array(emb2).flatten()
    
    # Cosine similarity formula: dot(a, b) / (norm(a) * norm(b))
    dot = np.dot(emb1, emb2)
    norm1 = np.linalg.norm(emb1)
    norm2 = np.linalg.norm(emb2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
        
    return float(dot / (norm1 * norm2))

def check_liveness(img, image_bbox):
    """
    Wrapper for Silent-Face-Anti-Spoofing.
    Passes the cropped face to the MiniFASNet model.
    """
    if not ANTI_SPOOF_AVAILABLE:
        return False, "Anti-Spoofing model not available."
        
    try:
        if image_bbox[2] <= 0 or image_bbox[3] <= 0:
            return False, "Invalid face bounding box."
            
        prediction = np.zeros((1, 3))
        
        # We use a single model from the directory for speed, or ensemble them. 
        # test.py ensembles all models in the folder.
        models = [m for m in os.listdir(anti_spoof_model_dir) if m.endswith('.pth')]
        if not models:
            return False, "No anti-spoofing weights found."
            
        for model_name in models:
            h_input, w_input, model_type, scale = parse_model_name(model_name)
            param = {
                "org_img": img,
                "bbox": image_bbox,
                "scale": scale,
                "out_w": w_input,
                "out_h": h_input,
                "crop": True,
            }
            if scale is None:
                param["crop"] = False
            cropped_img = image_cropper.crop(**param)
            prediction += anti_spoof_predict.predict(cropped_img, os.path.join(anti_spoof_model_dir, model_name))
            
        label = np.argmax(prediction)
        value = prediction[0][label] / len(models) # average prediction
        
        if label == 1:
            return True, f"RealFace Score: {value:.2f}"
        else:
            return False, f"FakeFace Score: {value:.2f}"
            
    except Exception as e:
        logger.error(f"Liveness check error: {e}")
        return False, f"Liveness error: {str(e)}"

@app.route('/api/ai/embed', methods=['POST'])
def embed():
    if not INSIGHT_FACE_AVAILABLE:
        return jsonify({"success": False, "reason": "AI models are initializing or failed to load."}), 500
        
    data = request.json
    base64_img = data.get('image')
    
    if not base64_img:
        return jsonify({"success": False, "reason": "Image is required"}), 400
        
    img = decode_image(base64_img)
    if img is None:
        return jsonify({"success": False, "reason": "Invalid image format"}), 400

    # 1. Face Detection & Extraction
    faces = app_insight.get(img)
    
    if len(faces) == 0:
        return jsonify({"success": False, "reason": "FACE_NOT_DETECTED"}), 400
    
    if len(faces) > 1:
        return jsonify({"success": False, "reason": "MULTIPLE_FACES"}), 400
        
    face = faces[0]
    bbox = face.bbox
    image_bbox = [int(bbox[0]), int(bbox[1]), int(bbox[2]-bbox[0]), int(bbox[3]-bbox[1])]

    # 2. Liveness / Anti-spoofing check
    is_live, liveness_msg = check_liveness(img, image_bbox)
    if not is_live:
        return jsonify({"success": False, "reason": "LIVENESS_FAILED", "message": liveness_msg}), 400

    # Extract ArcFace embedding
    embedding = face.embedding.tolist()
    
    return jsonify({
        "success": True,
        "liveness": True,
        "embedding": embedding
    })

@app.route('/api/ai/verify', methods=['POST'])
def verify():
    if not INSIGHT_FACE_AVAILABLE:
        return jsonify({"success": False, "reason": "AI models are initializing or failed to load."}), 500
        
    data = request.json
    base64_img = data.get('image')
    stored_embedding = data.get('embedding')
    
    if not base64_img or not stored_embedding:
        return jsonify({"success": False, "reason": "Image and stored embedding required"}), 400
        
    img = decode_image(base64_img)
    if img is None:
        return jsonify({"success": False, "reason": "Invalid image format"}), 400

    # 1. Face Detection
    faces = app_insight.get(img)
    
    if len(faces) == 0:
        return jsonify({"success": False, "reason": "FACE_NOT_DETECTED"}), 400
    
    if len(faces) > 1:
        return jsonify({"success": False, "reason": "MULTIPLE_FACES"}), 400
        
    face = faces[0]
    bbox = face.bbox
    image_bbox = [int(bbox[0]), int(bbox[1]), int(bbox[2]-bbox[0]), int(bbox[3]-bbox[1])]

    # 2. Liveness / Anti-spoofing check
    is_live, liveness_msg = check_liveness(img, image_bbox)
    if not is_live:
        return jsonify({"success": False, "reason": "LIVENESS_FAILED", "message": liveness_msg}), 400
        
    # 3. Match
    face = faces[0]
    current_embedding = face.embedding.tolist()
    
    similarity = compute_cosine_similarity(current_embedding, stored_embedding)
    
    # Threshold for ArcFace is typically around 0.4 - 0.6 for cosine similarity depending on the model variation.
    # User requested configurable threshold:
    threshold = float(os.environ.get('FACE_SIMILARITY_THRESHOLD', 0.60))
    
    is_match = similarity >= threshold
    
    # We map 0-1 similarity to a 0-100% confidence for the frontend
    confidence = (similarity + 1) / 2 * 100 # Adjust cosine range [-1, 1] to [0, 100]
    
    return jsonify({
        "success": True,
        "liveness": True,
        "match": bool(is_match),
        "confidence": float(confidence),
        "similarity": float(similarity)
    })

if __name__ == '__main__':
    port = int(os.environ.get('AI_PORT', 5001))
    logger.info(f"Local AI Face Service starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
