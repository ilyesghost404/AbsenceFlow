import base64
import numpy as np
import cv2

with open('/tmp/face.b64', 'r') as f:
    b64 = f.read().strip()

b64_full = "data:image/jpeg;base64," + b64

base64_string = b64_full
if "," in base64_string:
    base64_string = base64_string.split(",")[1]

missing_padding = len(base64_string) % 4
if missing_padding:
    base64_string += '=' * (4 - missing_padding)

img_data = base64.b64decode(base64_string)
nparr = np.frombuffer(img_data, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

print("Image decoded successfully:" if img is not None else "FAILED to decode image")
