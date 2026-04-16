from passlib.context import CryptContext
import sys

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "password123!"
new_hash = pwd_context.hash(password)

print(f"Generated Hash: {new_hash}")

# Verify immediately
is_match = pwd_context.verify(password, new_hash)
print(f"Verified Match: {is_match}")
