# Importing all the necessary libraries and their specific portions using import keyword
import os
import uuid
import json
import base64
import jwt
import time
from fastapi import Depends, FastAPI, File, UploadFile, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2AuthorizationCodeBearer, OAuth2PasswordBearer
from dotenv import load_dotenv
import asyncpg
from groq import Groq
from jwt import PyJWKClient
from fastapi.responses import JSONResponse
import httpx
from starlette import status as status_module

# Load the backend-local .env even when the app is started from the repo root
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BACKEND_DIR, '.env'))
# The Line below is used to Initialize the FastApi app with the Title that is given
app = FastAPI(title="Cura AI: A Prescription Scanner and Risk Analyzer")

# This is the Main code that will help in connecting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://cura-ai-iota.vercel.app", "http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# 1. Initialize OAuth2 Password Bearer scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# Now we will create clients, and we will set the API Key from .getenv() method
DATABASE_URL = os.getenv("DATABASE_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
try:
    # Adding the Authentication layer using the neon auth
    NEON_AUTH_URL = os.getenv("NEON_AUTH_URL")
    NEON_JWKS_URL = f"{NEON_AUTH_URL.rstrip('/')}/.well-known/jwks.json" if NEON_AUTH_URL else None
    neon_jwks_client = PyJWKClient(NEON_JWKS_URL) if NEON_JWKS_URL else None
except Exception as e:
    print("The Error is:", e)
    raise e

# print("NEON_AUTH_URL:", os.getenv("NEON_AUTH_URL"))
print("JWKS Client Initialized:", neon_jwks_client is not None)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Now we will verify the JWT received from the Neon Auth
    if not neon_jwks_client or not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication Token Missing or Auth not Configured yet"
        )
    try:
        # Fetch the Correct public key from Neon's JWKS endpoint and decide the token
        signing_key = neon_jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=[signing_key.algorithm_name],
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid Token Payload")
        return user_id
    except Exception as e:
        print(f"Auth Error is {e}")
        raise HTTPException(
            status_code=status_module.HTTP_401_UNAUTHORIZED,
            detail="Could not Validate the Credentials"
        )

print("DATABASE_URL:", bool(DATABASE_URL))
print("GROQ configured:", bool(GROQ_API_KEY))

groq_client = None
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)

def image_to_base64(file_bytes: bytes) -> str:
    return base64.b64encode(file_bytes).decode('utf-8')

@app.get("/")
async def home(user_id: str = Depends(get_current_user)):
    return {
        "status": "Backend Running Perfectly",
        "docs": "docs are accessible at /docs",
    }


@app.post("/api/v1/analyze-prescription")
async def analyze_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    try:
        file_bytes = await file.read()
        base64_image = image_to_base64(file_bytes)
        mime_type = file.content_type or "image/jpeg"
        # Now we will make the completion variable and then we will use the groq
        completion = groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
            {
                "role": "system",
                "content": (
                    "You are a prescription OCR and analysis system. "
                    "Return ONLY valid JSON. "
                    "Do not use markdown. "
                    "Do not add explanations outside the JSON."
                )
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Analyze the prescription image.
                                    Rules:
                                    1. Extract only text that is visibly readable.
                                    2. Never guess or invent medicine names.
                                    3. Include only medicines that can actually be read.
                                    4. If something cannot be read, omit it.
                                    5. risk_score must be an integer from 0 to 100.
                                    6. risks must be an array of strings.
                                    7. recommendations must be an array of strings.
                                    8. Return ONLY the JSON object.
                                    Use exactly this structure:
                                    {
                                        "ocr_text": "string",
                                        "medicines_detected": ["string"],
                                        "risk_score": 0,
                                        "risks": ["string"],
                                        "recommendations": ["string"]
                                    }   
                                """
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}"
                                }
                        }
                ]
            }
        ],
        response_format={"type": "json_object"},
        temperature=0,
        max_tokens=1200,
        reasoning_effort="none"
    )
        raw_content = completion.choices[0].message.content
        print("MODEL OUTPUT:", repr(raw_content))
        result = json.loads(raw_content)
        doc_id = str(uuid.uuid4())
        final_data = {
            "id": doc_id,
            "file_name": file.filename or "unknown",
            "ocr_text": result["ocr_text"],
            "medicines_detected": result["medicines_detected"],
            "risk_score": result["risk_score"],
            "risks": result["risks"],
            "recommendations": result["recommendations"],
            "user_id": user_id
        }
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            await conn.execute("""
                INSERT INTO prescriptions (id, file_name, ocr_text, medicines_detected, risk_score, risks, recommendations, user_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            final_data["id"],
            final_data["file_name"],
            final_data["ocr_text"],
            final_data["medicines_detected"],
            final_data["risk_score"],
            final_data["risks"],
            final_data["recommendations"],
            user_id
            )
        except Exception as e:
            print("The Problem is:", e)
            raise e
        finally:
            await conn.close()
        return final_data
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )