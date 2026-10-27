# Cura AI

Cura AI is an AI-assisted prescription reader. A signed-in user can submit a prescription image and receive extracted text, detected medicines, a risk score, potential risks, and recommendations.

> **Important:** Cura AI is a prototype and is not a medical device or a substitute for advice from a qualified healthcare professional. AI may misread handwriting or produce incomplete or incorrect analysis. Always verify prescription details with a pharmacist or prescriber, and do not change medication based on this application alone.

## Current status

The current application includes email/password and Google sign-in, authenticated prescription-image analysis, and PostgreSQL persistence of analysis results. A user-facing prescription history and Razorpay payment integration are planned; neither is implemented yet.

## Features

- Neon Auth signup, sign-in, session restoration, and Google OAuth.
- Authenticated image uploads through file selection, drag and drop, or a device camera.
- Image analysis through Groq using a vision-capable Qwen model.
- Structured results containing OCR text, detected medicines, a risk score, risks, and recommendations.
- Neon PostgreSQL persistence of extracted results associated with the authenticated user.
- Responsive React interface for upload, processing, and results.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript |
| Authentication | Neon Auth (`@neondatabase/auth`) |
| Backend API | Python, FastAPI, Uvicorn |
| AI inference | Groq API with `qwen/qwen3.8-27b` |
| Database | PostgreSQL, accessed with `asyncpg` |
| API authentication | Neon Auth JWTs verified against Neon’s JWKS with PyJWT |

## How it works

1. The frontend restores or creates a user session with Neon Auth.
2. The signed-in user selects, drops, or captures a prescription image.
3. The frontend sends the image as multipart form data to the FastAPI endpoint with a Neon Auth bearer token.
4. The backend verifies the token against the configured Neon Auth JWKS, sends the image to Groq for analysis, and parses the structured response.
5. The backend inserts the analysis fields into PostgreSQL and returns the result to the frontend.

The application does not insert the raw image into its PostgreSQL table. The image is sent to Groq for inference; the database stores the filename and extracted analysis fields, including OCR text, medicines, risk score, risks, recommendations, and user ID.

## Repository layout

```text
.
├── Backend/
│   └── main.py             # FastAPI app and prescription analysis endpoint
├── UI/
│   ├── components/         # Login, upload, processing, and result UI
│   ├── App.jsx             # Frontend flow and API integration
│   ├── package.json
│   └── vite.config.js
├── requirements.txt        # Python dependencies
└── README.md
```

## Prerequisites

- Python 3.10 or later
- Node.js and npm compatible with the Vite version in `UI/package.json`
- A Neon PostgreSQL database and Neon Auth project
- A Groq API key with access to the configured vision model

## Local development

### 1. Configure the backend

Create `Backend/.env`:

```dotenv
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
GROQ_API_KEY=<your-groq-api-key>
NEON_AUTH_URL=https://<your-neon-auth-host>/<project>/auth
```

Install the Python dependencies from the repository root:

```bash
python -m venv .venv
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
source .venv/bin/activate
```

Then install dependencies and start the API from the `Backend` directory:

```bash
pip install -r requirements.txt
cd Backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend loads `Backend/.env` relative to `main.py`, so it works regardless of the shell’s starting directory.

### 2. Configure and start the frontend

Create `UI/.env.local`:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_NEON_AUTH_URL=https://<your-neon-auth-host>/<project>/auth
```

Use the same Neon Auth project for the frontend and backend. Install frontend dependencies and start Vite:

```bash
cd UI
npm install
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5173`).

For a production frontend, set `VITE_API_URL` to the deployed API base URL and `VITE_NEON_AUTH_URL` to the Neon Auth URL before building:

```bash
npm run build
```

## API

### `POST /api/v1/analyze-prescription`

Requires a valid Neon Auth JWT in the `Authorization: Bearer <token>` header and a multipart form field named `file` containing the image.

Example response:

```json
{
  "id": "generated-uuid",
  "file_name": "prescription.jpg",
  "ocr_text": "Text read from the image",
  "medicines_detected": ["Medicine name"],
  "risk_score": 0,
  "risks": [],
  "recommendations": [],
  "user_id": "authenticated-user-id"
}
```

The backend also exposes FastAPI’s interactive API documentation at `/docs` while it is running.

## Database setup

The backend expects a PostgreSQL table named `prescriptions` with columns compatible with the insert in `Backend/main.py`:

`id`, `file_name`, `ocr_text`, `medicines_detected`, `risk_score`, `risks`, `recommendations`, and `user_id`.

This repository does not currently include a database migration or table-creation script. Configure the table in the Neon database before using the analysis endpoint.

## Deployment notes

- Set `DATABASE_URL`, `GROQ_API_KEY`, and `NEON_AUTH_URL` as backend environment variables in the hosting platform. Keep secrets out of source control.
- Set `VITE_API_URL` and `VITE_NEON_AUTH_URL` for the frontend build environment. Vite variables are embedded in the built client and must not contain secrets.
- Update the backend CORS `allow_origins` list in `Backend/main.py` if the deployed frontend uses a different domain.
- The frontend expects `VITE_API_URL`; `VITE_BACKEND_URL` is not read by the current application.

## Privacy and safety

- Prescription images are sent to Groq to perform analysis. Review the provider’s terms and data-handling policies before using real or sensitive medical information.
- The application stores extracted OCR and analysis results, the submitted filename, and the associated user ID in PostgreSQL. Do not describe the current service as storing no prescription data.
- AI output can be inaccurate or incomplete, especially for unclear handwriting. Treat it as informational only and confirm details with a qualified healthcare professional.

## Roadmap

- **Razorpay payments:** add payment checkout and server-side payment verification.
- **Prescription history:** add authenticated API endpoints and a UI for users to browse their saved analyses.
- Connect payment status to any paid features or plans once the product’s payment model is defined.

At present, analysis results are saved in PostgreSQL, but there is no history endpoint or history screen. Razorpay is not yet integrated.
