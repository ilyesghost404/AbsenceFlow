import requests
import base64

# Create a small dummy image using cv2
import cv2
import numpy as np

img = np.zeros((480, 640, 3), dtype=np.uint8)
# draw a white circle (dummy face)
cv2.circle(img, (320, 240), 100, (255, 255, 255), -1)
# Add some variance for liveness
cv2.randn(img, 128, 50)

_, encoded = cv2.imencode('.jpg', img)
b64 = base64.b64encode(encoded).decode('utf-8')

res = requests.post("http://127.0.0.1:5001/api/ai/embed", json={"image": b64})
print(res.status_code, res.json())
