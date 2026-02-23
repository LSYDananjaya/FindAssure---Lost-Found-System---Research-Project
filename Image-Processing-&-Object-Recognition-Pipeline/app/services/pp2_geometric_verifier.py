import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Union

class GeometricVerifier:
    # Thresholds
    MIN_GOOD_MATCHES = 30
    MIN_INLIERS = 15
    MIN_INLIER_RATIO = 0.15

    def _ensure_numpy(self, img: Union[np.ndarray, Image.Image]) -> np.ndarray:
        if isinstance(img, Image.Image):
            return np.array(img)
        return img

    def verify_pair(self, img_a: Union[np.ndarray, Image.Image], img_b: Union[np.ndarray, Image.Image]) -> Dict[str, Union[float, int, bool]]:
        """
        Verifies geometric consistency between two images using ORB + RANSAC.
        """
        img_a = self._ensure_numpy(img_a)
        img_b = self._ensure_numpy(img_b)

        # 1. Convert to Grayscale
        if len(img_a.shape) == 3:
            gray_a = cv2.cvtColor(img_a, cv2.COLOR_RGB2GRAY)
        else:
            gray_a = img_a
            
        if len(img_b.shape) == 3:
            gray_b = cv2.cvtColor(img_b, cv2.COLOR_RGB2GRAY)
        else:
            gray_b = img_b

        # 2. Detect ORB Features
        orb = cv2.ORB_create(nfeatures=2000)
        kp_a, des_a = orb.detectAndCompute(gray_a, None)
        kp_b, des_b = orb.detectAndCompute(gray_b, None)

        if des_a is None or des_b is None or len(kp_a) < 2 or len(kp_b) < 2:
             return {
                "num_keypoints_a": len(kp_a) if kp_a else 0,
                "num_keypoints_b": len(kp_b) if kp_b else 0,
                "num_matches": 0,
                "num_good_matches": 0,
                "num_inliers": 0,
                "inlier_ratio": 0.0,
                "passed": False
            }

        # 3. Match Descriptors (BFMatcher with Hamming distance)
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        matches = bf.knnMatch(des_a, des_b, k=2)

        # 4. Filter Matches (Lowe's Ratio Test)
        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)

        num_good = len(good_matches)
        
        # 5. Estimate Homography (RANSAC)
        num_inliers = 0
        inlier_ratio = 0.0

        if num_good >= 4:
            src_pts = np.float32([kp_a[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp_b[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

            M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            
            if mask is not None:
                matchesMask = mask.ravel().tolist()
                num_inliers = sum(matchesMask)
                inlier_ratio = num_inliers / max(1, num_good)
        
        # 6. Check Pass Condition
        passed = (
            num_good >= self.MIN_GOOD_MATCHES and
            num_inliers >= self.MIN_INLIERS and
            inlier_ratio >= self.MIN_INLIER_RATIO
        )

        return {
            "num_keypoints_a": len(kp_a),
            "num_keypoints_b": len(kp_b),
            "num_matches": len(matches),
            "num_good_matches": num_good,
            "num_inliers": num_inliers,
            "inlier_ratio": inlier_ratio,
            "passed": passed
        }

    def verify_triplet(self, crops: List[Union[np.ndarray, Image.Image]]) -> Dict[str, Dict]:
        """
        Runs geometric verification for all pairwise combinations of up to 3 images.
        """
        results = {}
        pairs = [(0, 1), (0, 2), (1, 2)]
        
        for idx_a, idx_b in pairs:
            if idx_a < len(crops) and idx_b < len(crops):
                key = f"{idx_a}-{idx_b}"
                results[key] = self.verify_pair(crops[idx_a], crops[idx_b])
                
        return results
