from cryptography.fernet import Fernet
from app.config import settings


def _get_fernet() -> Fernet:
    key = settings.ENCRYPTION_KEY
    if isinstance(key, str):
        key = key.encode()
    # Fernet will raise ValueError here if the key is not valid base64-urlsafe 32 bytes,
    # which surfaces at startup rather than silently generating a throwaway key.
    return Fernet(key)


def encrypt(value: str) -> str:
    if not value:
        return value
    return _get_fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    if not value:
        return value
    return _get_fernet().decrypt(value.encode()).decode()
