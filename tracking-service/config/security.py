import jwt
import os
from fastapi import Header, HTTPException

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# تأكدي أن المسار كيوصل لـ keys/publicKey.pem بضبط
KEY_PATH = os.path.join(BASE_DIR, "keys", "publicKey.pem")

def get_public_key():
    try:
        with open(KEY_PATH, "r") as f:
            key_content = f.read()
            if not key_content.strip():
                print("❌ Warning: publicKey.pem is empty!")
            return key_content
    except Exception as e:
        print(f"❌ Erreur lecture key: {e}")
        return None

PUBLIC_KEY = get_public_key()

def verify_token(authorization: str = Header(...)):
    if not PUBLIC_KEY:
        raise HTTPException(status_code=500, detail="Public Key missing on server")

    try:
        # استخراج التوكن (Bearer <token>)
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise ValueError("Invalid authentication scheme")

        # فك التشفير - زيدي هاد الـ try لداخل باش تشوفي الخطأ ف Terminal
        payload = jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"])

        # تشييك الـ Roles
        roles = payload.get("authorities") or payload.get("roles", [])
        roles_str = str(roles).upper()

        if "ROLE_LIVREUR" not in roles_str and "ROLE_ADMIN" not in roles_str:
            print(f"🚫 Forbidden: User {payload.get('sub')} has no delivery role")
            raise HTTPException(status_code=403, detail="Rôle insuffisant")

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except Exception as e:
        # هاد السطر هو اللي غايفك لينا اللغز ف Terminal
        print(f"❌ JWT DECODE ERROR: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid Token: {str(e)}")