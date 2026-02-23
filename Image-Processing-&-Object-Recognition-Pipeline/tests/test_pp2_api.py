import sys
from unittest.mock import MagicMock

# --- PATCH IMPORTS BEFORE app.main IS IMPORTED ---
# We mock the heavy services modules so that app.main (and unified_pipeline) 
# don't trigger "ultralytics" or model loading during import.

mock_yolo_module = MagicMock()
mock_florence_module = MagicMock()
mock_dino_module = MagicMock()
mock_unified_pipeline_module = MagicMock()

# We need to ensure that when 'from app.services.yolo_service import YoloService' happens, 
# it succeeds.
mock_yolo_service_cls = MagicMock()
mock_yolo_module.YoloService = mock_yolo_service_cls

mock_florence_service_cls = MagicMock()
mock_florence_module.FlorenceService = mock_florence_service_cls

mock_dino_service_cls = MagicMock()
mock_dino_module.DINOEmbedder = mock_dino_service_cls

mock_unified_pipeline_cls = MagicMock()
mock_unified_pipeline_module.UnifiedPipeline = mock_unified_pipeline_cls

# Apply patches to sys.modules
sys.modules["app.services.yolo_service"] = mock_yolo_module
sys.modules["app.services.florence_service"] = mock_florence_module
sys.modules["app.services.dino_embedder"] = mock_dino_module
# Note: We might also need to patch unified_pipeline if we rely on its import in main
# But app.main line 7 says: from app.services.unified_pipeline import UnifiedPipeline
# If we don't patch unified_pipeline.py itself, it will try to import yolo_service, 
# which is now patched, so it should be fine. 
# However, safe bet is to let unified_pipeline load BUT with mocked services. 
# Since we patched app.services.yolo_service, unified_pipeline.py should import the mock successfully.

# --- END PATCH ---

import unittest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from contextlib import asynccontextmanager

# Now we can safely import app.main
from app.main import app
from app.core.db import get_db
from app.schemas.pp2_schemas import PP2Response, PP2VerificationResult, PP2PerViewResult, PP2PerViewDetection, PP2PerViewExtraction, PP2PerViewEmbedding

# 1. Mock DB Dependency
def mock_get_db():
    return MagicMock()

app.dependency_overrides[get_db] = mock_get_db

# 2. Mock Lifespan to prevent model loading
@asynccontextmanager
async def mock_lifespan(app):
    # Setup mock pipeline in app.state
    pipeline_mock = MagicMock()
    
    # Configure mock analyze return value
    dummy_response = PP2Response(
        item_id="test-uuid",
        per_view=[
            PP2PerViewResult(
                view_index=i,
                filename=f"img{i}.jpg",
                detection=PP2PerViewDetection(bbox=(0,0,10,10), cls_name="item", confidence=0.9),
                extraction=PP2PerViewExtraction(caption="", ocr_text="", grounded_features={}),
                embedding=PP2PerViewEmbedding(dim=128, vector_preview=[0.1]*8, vector_id=f"v{i}"),
                quality_score=0.9
            ) for i in range(3)
        ],
        verification=PP2VerificationResult(
            cosine_sim_matrix=[[1.0]*3]*3,
            faiss_sim_matrix=[[1.0]*3]*3,
            geometric_scores={},
            passed=True,
            failure_reasons=[]
        ),
        stored=True
    )
    
    # Async mock for analyze
    pipeline_mock.analyze = AsyncMock(return_value=dummy_response)
    
    app.state.multiview_pipeline = pipeline_mock
    yield
    app.state.multiview_pipeline = None

# Override app's lifespan context
app.router.lifespan_context = mock_lifespan

class TestPP2Api(unittest.TestCase):
    
    def test_analyze_multiview(self):
        with TestClient(app) as client:
            # Create dummy image bytes
            files = [
                ("files", ("view1.jpg", b"fakeimagebytes", "image/jpeg")),
                ("files", ("view2.jpg", b"fakeimagebytes", "image/jpeg")),
                ("files", ("view3.jpg", b"fakeimagebytes", "image/jpeg"))
            ]
            
            response = client.post("/pp2/analyze_multiview", files=files)
            
            if response.status_code != 200:
                print(f"API Error Response: {response.text}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["item_id"], "test-uuid")
            self.assertTrue(data["stored"])
