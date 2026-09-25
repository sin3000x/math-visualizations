"""从真实 React/KaTeX 的 2x 截图提取有色轮廓；不参与运行时渲染。依赖 numpy、opencv-python-headless。"""
import json
import os
import sys
from pathlib import Path
import cv2
import numpy as np

source, destination = map(Path, sys.argv[1:])
# 项目语义色，以及水果叶、茎；暗底不参与轮廓变形。
colors = ['#62d2c3', '#ed6a5a', '#f4c95d', '#f6f2e7', '#78b779', '#8b6338']
colors += json.loads(os.environ.get('MORPH_EXTRA_COLORS', '[]'))
palette = np.array([[int(c[i:i+2], 16) for i in (1, 3, 5)] for c in colors])

def trace(item):
    rgb = cv2.cvtColor(cv2.imread(str(source / item['file'])), cv2.COLOR_BGR2RGB).astype(float)
    distance = ((rgb[:, :, None, :] - palette[None, None, :, :]) ** 2).sum(axis=3)
    labels = distance.argmin(axis=2)
    foreground = rgb.max(axis=2) > 72
    shapes = []
    for index, color in enumerate(colors):
        mask = ((labels == index) & foreground).astype('uint8') * 255
        contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
        if hierarchy is None:
            continue
        for n, contour in enumerate(contours):
            if hierarchy[0, n, 3] != -1 or cv2.contourArea(contour) < 5:
                continue
            rings = [contour]
            child = hierarchy[0, n, 2]
            while child != -1:
                if cv2.contourArea(contours[child]) >= 3:
                    rings.append(contours[child])
                child = hierarchy[0, child, 0]
            points = []
            for ring in rings:
                simplified = cv2.approxPolyDP(ring, .55, True).reshape(-1, 2) / 2
                simplified += np.array(item['offset'])
                points.append(np.round(simplified, 3).tolist())
            component = np.zeros(mask.shape, dtype='uint8')
            cv2.drawContours(component, [contour], -1, 255, cv2.FILLED)
            values, counts = np.unique(rgb[(component > 0) & (mask > 0)].astype('uint8'), axis=0, return_counts=True)
            dominant = values[counts.argmax()]
            actual_color = '#' + ''.join(f'{channel:02x}' for channel in dominant)
            shapes.append({'color': actual_color, 'rings': points})
    return {'width': item['width'], 'height': item['height'], 'shapes': shapes}

items = json.loads((source / 'manifest.json').read_text())
result = {item['selector']: {side: trace(item[side]) for side in ['from', 'to']} for item in items}
destination.write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(f'已生成 {len(result)} 组真实轮廓：{destination}')
