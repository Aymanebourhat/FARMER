from functools import lru_cache

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Morocco Livestock Platform API"
    environment: str = Field(default="development", validation_alias="ENVIRONMENT")
    database_url: str = Field(validation_alias="DATABASE_URL")
    jwt_secret_key: SecretStr = Field(validation_alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(
        default=30,
        validation_alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    cors_origins: list[str] = Field(default_factory=list, validation_alias="CORS_ORIGINS")
    local_upload_dir: str = Field(default="uploads", validation_alias="LOCAL_UPLOAD_DIR")
    max_animal_photo_upload_bytes: int = Field(
        default=10_485_760,
        gt=0,
        validation_alias="MAX_ANIMAL_PHOTO_UPLOAD_BYTES",
    )
    animal_photo_max_dimension: int = Field(
        default=2048,
        gt=0,
        validation_alias="ANIMAL_PHOTO_MAX_DIMENSION",
    )
    animal_photo_jpeg_quality: int = Field(
        default=82,
        ge=1,
        le=95,
        validation_alias="ANIMAL_PHOTO_JPEG_QUALITY",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str] | object:
        if value is None or value == "":
            return []
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
