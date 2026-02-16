from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    REDIS_URL: str = "redis://localhost:6379/0"
    DATABASE_URL: str = "sqlite:///./data/app.db"
    FAISS_INDEX_PATH: str = "./data/faiss.index"
    FAISS_MAPPING_PATH: str = "./data/faiss_mapping.json"
    PP2_SIM_THRESHOLD: float = 0.85

    class Config:
        env_file = ".env"

settings = Settings()
