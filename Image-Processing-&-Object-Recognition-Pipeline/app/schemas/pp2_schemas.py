from typing import List, Dict, Optional, Tuple, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict

class PP2PerViewDetection(BaseModel):
    bbox: Tuple[float, float, float, float] = Field(
        ..., 
        description="Bounding box coordinates (x1, y1, x2, y2)"
    )
    cls_name: str
    confidence: float

class PP2PerViewExtraction(BaseModel):
    caption: str
    ocr_text: str
    grounded_features: Dict[str, Any]
    extraction_confidence: Optional[float] = None

class PP2PerViewEmbedding(BaseModel):
    dim: int
    vector_preview: List[float] = Field(
        ..., 
        max_length=8,
        description="First 8 floats of the embedding vector"
    )
    vector_id: str

class PP2PerViewResult(BaseModel):
    view_index: int
    filename: str
    detection: PP2PerViewDetection
    extraction: PP2PerViewExtraction
    embedding: PP2PerViewEmbedding
    quality_score: float

class PP2VerificationResult(BaseModel):
    cosine_sim_matrix: List[List[float]] = Field(
        ..., 
        min_length=3, 
        max_length=3,
        description="3x3 matrix of cosine similarities"
    )
    faiss_sim_matrix: List[List[float]] = Field(
        ..., 
        min_length=3, 
        max_length=3,
        description="3x3 matrix of FAISS similarities"
    )
    geometric_scores: Dict[str, Any] = Field(
        ..., 
        description="Pairwise geometric consistency scores (e.g., '0-1': {...})"
    )
    passed: bool
    failure_reasons: List[str]

class PP2FusedProfile(BaseModel):
    category: str
    brand: Optional[str] = None
    color: Optional[str] = None
    caption: Optional[str] = None
    merged_ocr_tokens: List[str]
    attributes: Dict[str, Any]
    defects: List[str]
    best_view_index: int
    fused_embedding_id: str

class PP2Response(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    item_id: str = Field(..., description="Unique identifier for the item (UUID string)")
    per_view: List[PP2PerViewResult] = Field(..., description="Results for exactly 3 input views")
    verification: PP2VerificationResult
    fused: Optional[PP2FusedProfile] = None
    stored: bool
    cache_key: Optional[str] = None

    @field_validator('per_view')
    @classmethod
    def validate_view_count(cls, v: List[PP2PerViewResult]) -> List[PP2PerViewResult]:
        if len(v) != 3:
            raise ValueError(f"Expected exactly 3 views in response, got {len(v)}")
        return v

class PP2VerifyPairResponse(BaseModel):
    cosine_like_score_faiss: float
    geometric: Dict[str, Any]
    passed: bool
    threshold: float

