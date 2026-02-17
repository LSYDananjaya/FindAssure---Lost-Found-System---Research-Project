from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    REDIS_URL: str = "redis://localhost:6379/0"
    DATABASE_URL: str = "sqlite:///./data/app.db"
    FAISS_INDEX_PATH: str = "./data/faiss.index"
    FAISS_MAPPING_PATH: str = "./data/faiss_mapping.json"
    PP2_SIM_THRESHOLD: float = 0.85
    GOOGLE_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    PERF_PROFILE: str = "fast"
    PP1_MAX_DETECTIONS: int = 1
    PP1_GEMINI_INCLUDE_IMAGE: bool = False
    FLORENCE_FAST_MAX_NEW_TOKENS: int = 96
    FLORENCE_FAST_NUM_BEAMS: int = 1
    FLORENCE_LITE_TIMEOUT_MS: int = 3000

    class Config:
        env_file = ".env"

settings = Settings()
