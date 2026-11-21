import cv2
import numpy as np
import os
from typing import List, Dict, Any, Tuple

class FaceTracker:
    def __init__(self):
        # OpenCV built-in frontal face Haar Cascade
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        if os.path.exists(cascade_path):
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
        else:
            self.face_cascade = None

    def detect_faces_in_frame(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Returns list of (x, y, w, h) bounding boxes."""
        if self.face_cascade is None:
            # Fallback: estimate center
            h, w = frame.shape[:2]
            return [(int(w * 0.35), int(h * 0.2), int(w * 0.3), int(h * 0.4))]

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.15,
            minNeighbors=5,
            minSize=(80, 80)
        )
        return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]

    def compute_smoothed_camera_tracks(
        self,
        video_path: str,
        start_time: float,
        end_time: float,
        sample_fps: float = 4.0,
        smoothing_factor: float = 0.15
    ) -> List[Dict[str, Any]]:
        """
        Samples frames at sample_fps, detects active faces, and applies
        exponential moving average smoothing for silky camera motion.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return [{"time": start_time, "camera_offset_x": 0.0, "zoom": 1.0}]

        orig_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1920)
        frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080)
        
        step_frames = int(orig_fps / sample_fps)
        cur_frame_idx = int(start_time * orig_fps)
        end_frame_idx = int(end_time * orig_fps)
        
        cap.set(cv2.CAP_PROP_POS_FRAMES, cur_frame_idx)
        
        keyframes = []
        smoothed_x = 0.0  # -1.0 to 1.0 normalized offset from center

        while cur_frame_idx <= end_frame_idx:
            ret, frame = cap.read()
            if not ret:
                break
                
            cur_time = cur_frame_idx / orig_fps
            faces = self.detect_faces_in_frame(frame)
            
            if faces:
                # Pick primary/active face (e.g. largest face or most central)
                faces.sort(key=lambda b: b[2] * b[3], reverse=True)
                fx, fy, fw, fh = faces[0]
                face_center_x = fx + (fw / 2.0)
                # Normalize -1.0 (far left) to 1.0 (far right)
                target_x = (face_center_x - (frame_w / 2.0)) / (frame_w / 2.0)
                target_x = max(-0.9, min(0.9, target_x))
            else:
                target_x = smoothed_x
                
            # Exponential smoothing
            smoothed_x = smoothed_x + smoothing_factor * (target_x - smoothed_x)
            
            keyframes.append({
                "time": round(cur_time, 2),
                "camera_offset_x": round(float(smoothed_x), 3),
                "zoom": 1.05
            })
            
            cur_frame_idx += step_frames
            cap.set(cv2.CAP_PROP_POS_FRAMES, cur_frame_idx)
            
        cap.release()
        return keyframes if keyframes else [{"time": start_time, "camera_offset_x": 0.0, "zoom": 1.0}]

face_tracker = FaceTracker()
