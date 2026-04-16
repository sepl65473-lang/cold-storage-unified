from passlib.context import CryptContext
import sys

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Error during verify: {e}")
        return False

static_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36RQoeG6L4vzYGvS8ZLyOsq"
test_password = "password123!"

print(f"Testing password: {test_password}")
print(f"Testing hash: {static_hash}")
result = verify_password(test_password, static_hash)
print(f"Result: {result}")

# Test with long password to see if it triggers the same error
long_password = "a" * 80
print(f"Testing long password: {long_password[:10]}...")
result = verify_password(long_password, static_hash)
print(f"Result: {result}")
