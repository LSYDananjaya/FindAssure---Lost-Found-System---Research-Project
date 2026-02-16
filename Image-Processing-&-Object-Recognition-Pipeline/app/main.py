from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import shutil
import os
import uuid

from app.core.lifespan import lifespan
from app.services.unified_pipeline import UnifiedPipeline
from app.routers import pp2_router

app = FastAPI(title="Vision Core Backend", lifespan=lifespan)

app.include_router(pp2_router.router, prefix="/pp2", tags=["Phase 2"])

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize the pipeline
pipeline = UnifiedPipeline()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Vision Core Backend is running."}

@app.post("/pp1/analyze")
async def analyze_pp1(files: List[UploadFile] = File(...)):
    """
    Phase 1 Analysis: Single Image -> YOLO -> Florence -> Gemini
    """
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="PP1 requires exactly one image.")
    
    file = files[0]
    # Basic extension check/sanitization
    filename = file.filename or "image.jpg"
    file_ext = filename.split(".")[-1] if "." in filename else "jpg"
    temp_filename = f"{uuid.uuid4()}.{file_ext}"
    temp_path = os.path.join(UPLOAD_DIR, temp_filename)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Call the new pipeline
        result = pipeline.process_pp1(temp_path)
        return result
        
    finally:
        # Cleanup
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@app.post("/analyze")
async def analyze_legacy(files: List[UploadFile] = File(...)):
    """
    Legacy endpoint. Deprecated.
    """
    raise HTTPException(
        status_code=400, 
        detail="This endpoint is deprecated. Please use POST /pp1/analyze for single-image analysis."
    )
