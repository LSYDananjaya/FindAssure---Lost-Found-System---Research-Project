import unittest
import numpy as np
import cv2
from PIL import Image, ImageDraw
from app.services.pp2_geometric_verifier import GeometricVerifier

def create_synthetic_image(shape_type, size=(200, 200)):
    """Helper to create synth image with shapes."""
    img = Image.new("RGB", size, "white")
    draw = ImageDraw.Draw(img)
    
    if shape_type == "rect":
        draw.rectangle([50, 50, 150, 150], fill="blue", outline="black")
    elif shape_type == "circle":
        draw.ellipse([50, 50, 150, 150], fill="red", outline="black")
    
    # Add random noise/texture to ensure features are detected by ORB
    # Convert to numpy to add noise
    arr = np.array(img)
    noise = np.random.randint(0, 255, arr.shape, dtype=np.uint8)
    # Blend image with noise (e.g., 80% image, 20% noise)
    blended = cv2.addWeighted(arr, 0.8, noise, 0.2, 0)
    
    return Image.fromarray(blended)

class TestGeometricVerifier(unittest.TestCase):
    
    def setUp(self):
        self.verifier = GeometricVerifier()

    def test_verify_pair_pass(self):
        # Generate an image
        img = create_synthetic_image("rect")
        
        # Verify img against itself (perfect match)
        # Note: In reality, there might be slight differences due to noise, but identical image should pass
        result = self.verifier.verify_pair(img, img)
        
        self.assertTrue(result["passed"])
        self.assertGreater(result["inlier_ratio"], 0)
        self.assertGreater(result["num_good_matches"], 0)

    def test_verify_pair_fail(self):
        # Generate clean image
        img = create_synthetic_image("rect")
        
        # Generate random noise image
        noise_arr = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)
        noise_img = Image.fromarray(noise_arr)
        
        # Verify should fail
        result = self.verifier.verify_pair(img, noise_img)
        
        self.assertFalse(result["passed"])
        # Expect very low inliers/matches
        self.assertLess(result["inlier_ratio"], 0.15)
