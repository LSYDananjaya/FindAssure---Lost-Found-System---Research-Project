from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="forbid")

    REDIS_URL: str = "redis://localhost:6379/0"
    PRE_ANALYSIS_JOB_TTL_S: int = 900
    PRE_ANALYSIS_RETRY_AFTER_MS: int = 1000
    DATABASE_URL: str = "sqlite:///./data/app.db"
    FAISS_INDEX_PATH: str = "./data/faiss.index"
    FAISS_MAPPING_PATH: str = "./data/faiss_mapping.json"
    PP2_SIM_THRESHOLD: float = 0.85
    EMBEDDING_THRESHOLD_3VIEW: float | None = None
    EMBEDDING_THRESHOLD_2VIEW: float | None = None
    FAISS_THRESHOLD_3VIEW: float | None = None
    FAISS_THRESHOLD_2VIEW: float | None = None
    GOOGLE_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    PERF_PROFILE: str = "balanced"
    PP1_MAX_DETECTIONS: int = 1
    PP1_GEMINI_INCLUDE_IMAGE: bool = False
    PP1_GEMINI_MODEL: str = "models/gemini-3.1-flash-lite-preview"
    PP1_GEMINI_FALLBACK_MODEL: str = "gemini-2.5-flash"
    PP1_GEMINI_TEMPERATURE: float = 0.1
    PP1_GEMINI_MAX_OUTPUT_TOKENS: int = 320
    PP1_GEMINI_THINKING_LEVEL: str = "low"
    PP1_DINO_TIMEOUT_S: int = 10
    FLORENCE_FAST_MAX_NEW_TOKENS: int = 96
    FLORENCE_FAST_NUM_BEAMS: int = 1
    FLORENCE_TIMEOUT_MS: int = 120000
    FLORENCE_OCR_TIMEOUT_MS: int = 60000
    FLORENCE_OCR_RECOVERY_MAX_SIDE: int = 384
    FLORENCE_OCR_MAX_SIDE: int = 768
    FLORENCE_CAPTION_MAX_SIDE: int = 768

    FLORENCE_ENABLE_AMP: bool = True
    FLORENCE_USE_FP16: bool = True
    PP2_USE_FLORENCE_LITE: bool = False
    PP2_FORCE_GROUNDING: bool = False
    PP2_DISABLE_MULTIVIEW_VERIFICATION: bool = False
    PP2_OCR_FIRST_TINY_BBOX_AREA_RATIO: float = 0.05
    PP2_ENABLE_REASONER: bool = False
    PP2_REASONER_MODE: str = "per_view_and_phase2"
    PP2_REASONER_MODEL: str = "models/gemini-3.1-flash-lite-preview"
    PP2_REASONER_FALLBACK_MODEL: str = "gemini-2.5-flash"
    PP2_REASONER_THINKING_BUDGET: int = 256
    PP2_REASONER_THINKING_LEVEL: str = "medium"
    PP2_REASONER_MAX_OUTPUT_TOKENS: int = 320
    PP2_REASONER_TEMPERATURE: float = 0.2
    PP2_REASONER_ALWAYS_ENRICH: bool = True
    PP2_REASONER_INCLUDE_IMAGES: bool = True
    PP2_REASONER_MIN_WORDS: int = 24
    PP2_REASONER_ON_NEAR_MISS: bool = True
    PP2_REASONER_TIMEOUT_S: int = 4
    PP2_PHASE2_TIMEOUT_S: int = 4
    DINO_MODEL_PATH: str | None = None
    DINO_INPUT_SIZE: int = 224
    DINO_ENABLE_AMP: bool = True
    DINO_USE_FP16: bool = True
    FLORENCE_LITE_TIMEOUT_MS: int = 60000
    FLORENCE_LITE_RETRY_COUNT: int = 0
    FLORENCE_LITE_PAD_RATIO: float = 0.20
    FLORENCE_LITE_REQUIRE_NONEMPTY: bool = True
    FLORENCE_LITE_MAX_SIDE: int = 512
    FLORENCE_LITE_JPEG_QUALITY: int = 70
    FLORENCE_LITE_TINY_BBOX_AREA_RATIO: float = 0.05
    FLORENCE_LITE_SUCCESS_CONFIDENCE: float = 0.7

    # Florence OD Fallback
    FLORENCE_OD_FALLBACK_ENABLED: bool = True
    FLORENCE_OD_FALLBACK_MAX_DETECTIONS: int = 5
    FLORENCE_OD_DEFAULT_CONF: float = 0.5

    # Gemini circuit breaker
    GEMINI_CB_FAILURE_THRESHOLD: int = 5
    GEMINI_CB_RECOVERY_TIMEOUT_S: int = 60

    # PP1 label reranking thresholds
    LABEL_RERANK_MIN_WINNER_SCORE: int = 3
    LABEL_RERANK_MIN_MARGIN: int = 2

    # PP2 verifier thresholds (override MODE_GROUP_DEFAULTS)
    PP2_VERIFIER_TWO_VIEW_ANGLE_HARD: float | None = None
    PP2_VERIFIER_TWO_VIEW_TEXTURE_RICH: float | None = None
    PP2_VERIFIER_TWO_VIEW_SMALL_AMBIGUOUS: float | None = None
    PP2_VERIFIER_THREE_VIEW_ANGLE_HARD: float | None = None
    PP2_VERIFIER_THREE_VIEW_TEXTURE_RICH: float | None = None
    PP2_VERIFIER_THREE_VIEW_SMALL_AMBIGUOUS: float | None = None
    PP2_VERIFIER_ANGLE_HARD_BRAND_RESCUE_FLOOR: float | None = None  # override MultiViewVerifier.ANGLE_HARD_BRAND_RESCUE_FLOOR (default 0.38)
    PP2_VERIFIER_SMART_PHONE_FRONT_BACK_RESCUE_FLOOR: float = 0.18

settings = Settings()
