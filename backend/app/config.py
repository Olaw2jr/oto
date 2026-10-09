from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://oto:oto@localhost:5432/oto"
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "change-me"
    jwt_secret: str = ""
    oauth_google_client_id: str = ""
    oauth_google_client_secret: str = ""
    oauth_redirect_uri: str = "http://localhost:8000/v1/auth/google/callback"
    mobile_redirect_uri: str = "oto://auth"
    environment: str = "development"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
