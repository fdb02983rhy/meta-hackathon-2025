# Project Structure

This project is a full-stack application with a FastAPI backend and React frontend, featuring AI capabilities powered by Pydantic AI and SambaNova.

## High-Level Folder Structure

```
meta-hackathon-2025/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── main.py         # Main FastAPI application with CORS configuration
│   │   ├── core/
│   │   │   └── config.py   # Settings and environment configuration
│   │   ├── api/
│   │   │   ├── chat.py          # Chat API endpoint for AI interactions
│   │   │   └── transcription.py # Audio transcription API endpoint
│   │   └── services/
│   │       ├── llama_agent.py     # Pydantic AI agent with SambaNova Llama-4
│   │       └── transcription.py   # Audio transcription service with Whisper
│   ├── Dockerfile          # Backend Docker configuration
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React frontend application (Vite)
│   ├── src/               # Source files
│   │   ├── App.jsx        # Main app component
│   │   ├── main.jsx       # Entry point
│   │   └── assets/        # Static assets
│   ├── public/            # Public assets
│   ├── Dockerfile         # Frontend Docker configuration
│   ├── package.json       # Node dependencies
│   └── vite.config.js     # Vite configuration
│
├── docker-compose.yml     # Docker Compose orchestration
├── .venv/                 # Python virtual environment
├── requirements.txt       # Python dependencies
└── .env                   # Environment variables (SambaNova API credentials)
```

## Code Quality

**Backend (Python):**
```bash
# Format code
uvx ruff format .

# Fix linting issues
uvx ruff check --fix .
```

**Frontend (JavaScript/React):**
```bash
cd frontend

# Format code
npm run format

# Lint and fix
npm run lint -- --fix
```

## AI Integration

### Pydantic AI with SambaNova

The backend integrates **Pydantic AI** framework with **SambaNova's Llama-4-Maverick-17B-128E-Instruct** model for AI capabilities.

**Configuration:**
- Environment variables in `.env`:
  - `SAMBANOVA_API_KEY` - Your SambaNova API key
  - `SAMBANOVA_BASE_URL` - SambaNova API base URL

**Implementation:**
- `backend/app/services/llama_agent.py` - Pydantic AI agent configuration
- `backend/app/api/chat.py` - Chat endpoint for AI interactions
- `backend/app/core/config.py` - Settings management

### Audio Transcription with SambaNova Whisper

The backend also integrates **SambaNova's Whisper-Large-v3** model for audio transcription capabilities.

**Configuration:**
- Uses the same environment variables from `.env`:
  - `SAMBANOVA_API_KEY` - Your SambaNova API key
  - `SAMBANOVA_BASE_URL` - SambaNova API base URL

**Implementation:**
- `backend/app/services/transcription.py` - Transcription service using SambaNova's Whisper model
- `backend/app/api/transcription.py` - Audio transcription endpoint

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `GET /api/test` - Test endpoint for frontend connection
- `POST /api/chat?message=<your_message>` - Chat with AI (Llama-4-Maverick)
- `POST /api/transcribe` - Transcribe audio files (MP3, WAV, M4A, etc.)
- `GET /docs` - Interactive API documentation (Swagger UI)

### Example Chat Request

```bash
curl -X POST "http://localhost:8000/api/chat?message=Hello,%20who%20are%20you?"
```

**Response:**
```json
{
  "response": "I'm Llama, a model designed by Meta..."
}
```

### Example Transcription Request

```bash
curl -X POST "http://localhost:8000/api/transcribe" \
  -F "file=@path/to/audio.mp3"
```

**Response:**
```json
{
  "transcription": "And we will make America great again.",
  "filename": "audio.mp3"
}
```

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (Vite default port)
- `http://localhost:3000` (Alternative React port)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

## Development Notes

- Backend uses FastAPI with auto-reload enabled for development
- Frontend uses Vite for fast HMR (Hot Module Replacement)
- Both servers run independently and communicate via HTTP requests
- Docker volumes enable live code changes without rebuilding containers
- Pydantic AI provides type-safe AI agent interactions with structured outputs
