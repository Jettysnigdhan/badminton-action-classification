import json
import numpy as np
import sys

try:
    import requests
except Exception:
    requests = None
    import urllib.request

url = "http://127.0.0.1:8000/v1/predict/keypoints"
# deterministic keypoints: 24 frames, 17 joints, (x,y,confidence)
T=24
kp = np.zeros((T,17,3), dtype=float)
# simple synthetic motion: x increases over time, y constant, confidence 0.9
for t in range(T):
    for j in range(17):
        kp[t,j,0] = 0.4 + 0.01 * t + 0.001 * j
        kp[t,j,1] = 0.3 + 0.001 * j
        kp[t,j,2] = 0.9

payload = {"keypoints": kp.tolist()}
js = json.dumps(payload)

if requests:
    r = requests.post(url, json=payload, timeout=10)
    print(r.status_code)
    print(r.text)
else:
    req = urllib.request.Request(url, data=js.encode('utf-8'), headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        print(resp.status)
        print(resp.read().decode())
