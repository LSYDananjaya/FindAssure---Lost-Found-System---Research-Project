from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import os
import time
import uuid
import logging
from PIL import Image

# Internal
from app.schemas.pp2_schemas import PP2Response, PP2VerifyPairResponse
from app.services.storage_service import StorageService
from app.core.db import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/verify_pair", response_model=PP2VerifyPairResponse)
async def verify_pair(
    request: Request,
    files: List[UploadFile] = File(...),
):
    """
    Verify similarity between exactly 2 images.
    Returns cosine similarity and geometric verification results.
    """
    if len(files) != 2:
        raise HTTPException(
            status_code=400,
            detail=f"Exactly 2 images are required for pair verification. Got {len(files)}."
        )

    try:
        pipeline = request.app.state.multiview_pipeline
        if not pipeline:
             raise HTTPException(status_code=500, detail="MultiViewPipeline not initialized.")

        # Threshold from env, default 0.85
        threshold = float(os.getenv("VERIFY_THRESHOLD", 0.85))

        # Helper to process image (Load -> Detect -> Crop)
        def process_image(upload_file: UploadFile) -> Image.Image:
            content = upload_file.file.read()
            upload_file.file.seek(0)
            img = Image.open(io.BytesIO(content)).convert("RGB")
            
            # Detect
            detections = pipeline.yolo.detect_objects(img)
            
            if detections:
                # Get best detection
                best = max(detections, key=lambda x: x.confidence)
                x1, y1, x2, y2 = best.bbox
                
                # Bounds check
                w, h = img.size
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(w, x2)
                y2 = min(h, y2)
                
                return img.crop((x1, y1, x2, y2))
            
            # Fallback to full image
            return img

        # Run processing
        # Note: In a real high-load async scenarios, CPU bound tasks like detection/cropping 
        # should ideally be offloaded to a threadpool, but for this implementation we run inline 
        # as per existing patterns in this codebase.
        crop1 = process_image(files[0])
        crop2 = process_image(files[1])

        # Embeddings
        vec1 = pipeline.dino.embed_128(crop1)
        vec2 = pipeline.dino.embed_128(crop2)

        # Similarity
        sim_score = pipeline.faiss.pair_similarity(vec1, vec2)

        # Geometric Verification
        geo_result = pipeline.verifier.geometric_service.verify_pair(crop1, crop2)

        # Decision
        passed = (sim_score >= threshold)

        return {
            "cosine_like_score_faiss": sim_score,
            "geometric": geo_result,
            "passed": passed,
            "threshold": threshold
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze_multiview", response_model=PP2Response)
async def analyze_multiview(
    request: Request,
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    """
    Phase 2: Multi-View Analysis Endpoint.
    Requires 2 or 3 images.
    """
    normalized_files = files or []
    file_count = len(normalized_files)
    if file_count < 2 or file_count > 3:
        raise HTTPException(
            status_code=400, 
            detail=f"PP2 multi-view analysis requires 2 or 3 images. Got {file_count}."
        )
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    req_start = time.perf_counter()
    logger.info("PP2_REQ_START request_id=%s file_count=%d", request_id, file_count)

    try:
        # Retrieve Pipeline from App State
        pipeline = request.app.state.multiview_pipeline
        if not pipeline:
            raise HTTPException(status_code=500, detail="MultiViewPipeline not initialized.")

        # Initialize scoped StorageService with DB access
        storage = StorageService(db)

        # Call pipeline (files are passed directly)
        result = await pipeline.analyze(normalized_files, storage=storage, request_id=request_id)
        logger.info(
            "PP2_REQ_END request_id=%s item_id=%s stored=%s total_ms=%.2f",
            request_id,
            getattr(result, "item_id", None),
            bool(getattr(result, "stored", False)),
            (time.perf_counter() - req_start) * 1000.0,
        )
        return result

    except ValueError as ve:
        logger.warning(
            "PP2_REQ_END request_id=%s status=400 error=%s total_ms=%.2f",
            request_id,
            str(ve),
            (time.perf_counter() - req_start) * 1000.0,
        )
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Log error in production
        logger.exception(
            "PP2_REQ_END request_id=%s status=500 total_ms=%.2f",
            request_id,
            (time.perf_counter() - req_start) * 1000.0,
        )
        raise HTTPException(status_code=500, detail=str(e))
