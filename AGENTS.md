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
│   │   │   ├── llama_assembly_chat.py          # Chat API endpoint for AI interactions
│   │   │   ├── transcription.py # Audio transcription API endpoint
│   │   │   └── pdf_to_text.py   # PDF to text extraction API endpoint
│   │   └── services/
│   │       ├── llama_assembly_agent.py     # Pydantic AI agent with SambaNova Llama-4
│   │       ├── transcription.py   # Audio transcription service with Whisper
│   │       └── gemini_pdf_agent.py # Pydantic AI agent with Google Gemini for PDF processing
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
└── .env                   # Environment variables (SambaNova and Google API credentials)
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

The backend integrates **Pydantic AI** framework with **SambaNova's Llama-4-Maverick-17B-128E-Instruct** model for AI chat capabilities with multimodal support.

**Configuration:**
- Environment variables in `.env`:
  - `SAMBANOVA_API_KEY` - Your SambaNova API key
  - `SAMBANOVA_BASE_URL` - SambaNova API base URL

**Implementation:**
- `backend/app/services/llama_assembly_agent.py` - Pydantic AI agent configuration with multimodal support
- `backend/app/api/llama_assembly_chat.py` - Chat endpoint for AI interactions (text and images)
- `backend/app/core/config.py` - Settings management

**Features:**
- Text-based chat interactions
- Image analysis (up to 5 images per request)
- Supported image formats: JPEG, PNG, GIF, WebP
- Multimodal file handling with `BinaryContent`

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
- `POST /api/chat?message=<your_message>` - Chat with AI (Llama-4-Maverick) - supports text and images (up to 5)
- `POST /api/transcribe` - Transcribe audio files (MP3, WAV, M4A, etc.)
- `POST /api/pdf-to-text` - Convert PDF manuals to text-based manuals using Google Gemini
- `GET /docs` - Interactive API documentation (Swagger UI)

### Example Chat Request (Text Only)

```bash
curl -X POST "http://localhost:8000/api/chat?message=Hello,%20who%20are%20you?"
```

**Response:**
```json
{
  "response": "I'm Llama, a model designed by Meta..."
}
```

### Example Chat Request (With Images)

```bash
curl -X POST "http://localhost:8000/api/chat?message=What%20is%20in%20this%20image?" \
  -F "files=@path/to/image.png"
```

**Features:**
- Supports up to 5 images per request
- Supported formats: JPEG, PNG, GIF, WebP
- Images are analyzed using SambaNova Llama-4-Maverick multimodal capabilities

**Response:**
```json
{
  "response": "The image shows a black-and-white line drawing of a stool..."
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

### Example PDF to Text Manual Conversion

```bash
curl -X POST "http://localhost:8000/api/pdf-to-text" \
  -F "file=@path/to/manual.pdf"
```

**Features:**
- Converts PDF manuals into well-formatted text-based manuals
- Organizes content with proper sections, steps, and formatting
- Includes parts lists, assembly instructions, diagrams descriptions, and warnings
- Uses Google Gemini 2.5 Flash for intelligent document understanding

**Response:**
```json
{
  "text": "# Product Manual\n\n## Parts List\n\n| Item | Description | Quantity |\n...",
  "filename": "manual.pdf",
  "status": "success"
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
