from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


_PLACEHOLDER_SECRETS = {
    "replace-with-a-long-random-secret",
    "change-me",
    "secret",
    "your-secret-key",
}


class Settings(BaseSettings):
    app_name: str = "Morocco Livestock Platform API"
    environment: Literal["development", "test", "staging", "production"] = Field(
        default="development",
        validation_alias=AliasChoices("APP_ENV", "ENVIRONMENT"),
    )
    debug: bool = Field(default=False, validation_alias="DEBUG")
    enable_docs: bool = Field(default=True, validation_alias="ENABLE_DOCS")
    database_url: str = Field(validation_alias="DATABASE_URL")
    jwt_secret_key: SecretStr = Field(validation_alias=AliasChoices("SECRET_KEY", "JWT_SECRET_KEY"))
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(
        default=30,
        gt=0,
        validation_alias=AliasChoices("ACCESS_TOKEN_EXPIRE_MINUTES", "JWT_ACCESS_TOKEN_EXPIRE_MINUTES"),
    )
    cors_origins: list[str] = Field(default_factory=list, validation_alias="CORS_ORIGINS")
    trusted_hosts: list[str] = Field(default_factory=list, validation_alias="TRUSTED_HOSTS")
    rate_limit_enabled: bool = Field(default=True, validation_alias="RATE_LIMIT_ENABLED")
    rate_limit_window_seconds: int = Field(default=60, gt=0, validation_alias="RATE_LIMIT_WINDOW_SECONDS")
    rate_limit_auth_requests: int = Field(default=10, gt=0, validation_alias="RATE_LIMIT_AUTH_REQUESTS")
    rate_limit_upload_requests: int = Field(default=10, gt=0, validation_alias="RATE_LIMIT_UPLOAD_REQUESTS")
    rate_limit_mutation_requests: int = Field(default=30, gt=0, validation_alias="RATE_LIMIT_MUTATION_REQUESTS")
    local_upload_dir: str = Field(default="uploads", validation_alias="LOCAL_UPLOAD_DIR")
    vet_document_upload_dir: str = Field(default="private_uploads/vet-documents", validation_alias="VET_DOCUMENT_UPLOAD_DIR")
    vet_document_max_upload_bytes: int = Field(default=10_485_760, gt=0, validation_alias="VET_DOCUMENT_MAX_UPLOAD_BYTES")
    max_animal_photo_upload_bytes: int = Field(default=10_485_760, gt=0, validation_alias="MAX_ANIMAL_PHOTO_UPLOAD_BYTES")
    animal_photo_max_dimension: int = Field(default=2048, gt=0, validation_alias="ANIMAL_PHOTO_MAX_DIMENSION")
    animal_photo_jpeg_quality: int = Field(default=82, ge=1, le=95, validation_alias="ANIMAL_PHOTO_JPEG_QUALITY")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore", enable_decoding=False)

    @field_validator("cors_origins", "trusted_hosts", mode="before")
    @classmethod
    def parse_csv(cls, value: object) -> list[str] | object:
        if value is None or value == "":
            return []
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @model_validator(mode="after")
    def validate_security_configuration(self) -> "Settings":
        secret = self.jwt_secret_key.get_secret_value().strip()
        if self.environment == "production":
            if secret.lower() in _PLACEHOLDER_SECRETS or len(secret) < 32:
                raise ValueError("Production SECRET_KEY must be a non-placeholder value of at least 32 characters")
            if self.debug:
                raise ValueError("DEBUG must be false in production")
        if "*" in self.cors_origins:
            raise ValueError("Wildcard CORS_ORIGINS is unsafe when credentials are enabled")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
