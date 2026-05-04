"""Video sampling helpers for BiFI feature extraction.

Module overview:
- Opens a video with OpenCV and samples evenly spaced frames.
- Keeps frame count bounded so face scoring remains fast for API requests.
"""

import cv2

def extract_frames(video_path, max_frames=8):
    """Return up to max_frames evenly spaced frames from the video."""
    cap = cv2.VideoCapture(video_path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    frames = []
    if total <= 0:
        cap.release()
        return frames

    step = max(1, total // max_frames)

    i = 0
    while len(frames) < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        if i % step == 0:
            frames.append(frame)
        i += 1

    cap.release()
    return frames
