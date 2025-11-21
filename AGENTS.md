# Project Structure

This project is a full-stack application with a FastAPI backend and React frontend, featuring AI capabilities powered by Pydantic AI and SambaNova.

## High-Level Folder Structure

```
meta-hackathon-2025/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── main.py         # Main FastAPI application with CORS configuration
│   │   ├── core/
│   │   │   └── config.py   # Settings, environment configuration, and session config
│   │   ├── api/
│   │   │   ├── llama_assembly_chat.py       # Text chat API with session-based manual context & conversation history
│   │   │   ├── llama_assembly_voice_chat.py # Voice chat API combining transcription + llama agent
│   │   │   ├── transcription.py             # Audio transcription-only API endpoint
│   │   │   └── pdf_to_text.py               # PDF to text extraction API with session creation
│   │   └── services/
│   │       ├── llama_assembly_agent.py      # Pydantic AI agent with SambaNova Llama-4, system instruction & conversation history
│   │       ├── transcription.py             # Audio transcription service with Whisper
│   │       ├── gemini_pdf_agent.py          # Pydantic AI agent with Google Gemini for PDF processing
│   │       └── session_manager.py           # Session management for manual text storage & conversation history
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

The backend integrates **Pydantic AI** framework with **SambaNova's Llama-4-Maverick-17B-128E-Instruct** model for AI chat capabilities with multimodal support and assembly manual context.

**Configuration:**
- Environment variables in `.env`:
  - `SAMBANOVA_API_KEY` - Your SambaNova API key
  - `SAMBANOVA_BASE_URL` - SambaNova API base URL

**Implementation:**
- `backend/app/services/llama_assembly_agent.py` - Pydantic AI agent with dynamic system instruction
  - `ASSEMBLY_SYSTEM_INSTRUCTION` - Template string with `{manual_text}` variable
  - `run_agent_with_files()` - Accepts optional `manual_text` and `message_history` parameters
  - Creates agent with populated system instruction when manual text provided
  - Supports conversation history for multi-turn interactions
- `backend/app/services/session_manager.py` - In-memory session storage for manual text and conversation history
  - `create_session()` - Stores manual text and returns session_id
  - `get_manual_text()` - Retrieves manual text by session_id
  - `get_conversation_history()` - Retrieves conversation history by session_id
  - `update_conversation_history()` - Updates conversation history in session
  - 1-hour TTL with automatic cleanup
  - Max 100 concurrent sessions
- `backend/app/api/llama_assembly_chat.py` - Text chat endpoint with session-based manual context and conversation history
- `backend/app/api/llama_assembly_voice_chat.py` - Voice chat endpoint combining transcription and llama agent
- `backend/app/core/config.py` - Settings management and session configuration

**Features:**
- Text-based chat interactions with conversation memory
- Voice chat with audio transcription and AI response
- Image analysis (up to 5 images per request)
- Supported image formats: JPEG, PNG, GIF, WebP
- Multimodal file handling with `BinaryContent`
- Session-based manual context for assembly guidance
- Dynamic system instruction with manual text variable
- Multi-turn conversations with persistent memory

### Audio Transcription and Voice Chat with SambaNova Whisper

The backend integrates **SambaNova's Whisper-Large-v3** model for audio transcription, with two modes:
1. **Transcription only** - `/api/transcribe` - Returns transcribed text only
2. **Voice chat** - `/api/voice-chat` - Transcribes audio and sends to Llama agent for full conversation

**Configuration:**
- Uses the same environment variables from `.env`:
  - `SAMBANOVA_API_KEY` - Your SambaNova API key
  - `SAMBANOVA_BASE_URL` - SambaNova API base URL

**Implementation:**
- `backend/app/services/transcription.py` - Transcription service using SambaNova's Whisper model
- `backend/app/api/transcription.py` - Audio transcription-only endpoint
- `backend/app/api/llama_assembly_voice_chat.py` - Voice chat endpoint (transcription + llama agent)

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `GET /api/test` - Test endpoint for frontend connection
- `POST /api/chat?message=<your_message>&session_id=<session_id>` - Text chat with AI (Llama-4-Maverick) - supports text, images (up to 5), and session-based manual context with conversation history
- `POST /api/voice-chat` - Voice chat with AI - transcribes audio and sends to Llama agent with optional session context and conversation history
- `POST /api/transcribe` - Transcribe audio files only (MP3, WAV, M4A, etc.)
- `POST /api/pdf-to-text` - Convert PDF manuals to text-based manuals using Google Gemini and create a session
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

### Example Voice Chat Request

```bash
# Voice chat without session (no manual context)
curl -X POST "http://localhost:8000/api/voice-chat" \
  -F "file=@path/to/audio.mp3"

# Voice chat with session (includes manual context and conversation history)
curl -X POST "http://localhost:8000/api/voice-chat?session_id=abc-123" \
  -F "file=@path/to/audio.mp3"
```

**Features:**
- Transcribes audio using SambaNova Whisper-Large-v3
- Sends transcribed text to Llama assembly agent
- Supports optional session_id for manual context and conversation history
- Returns both transcription and AI response

**Response:**
```json
{
  "transcription": "How many screws do I need?",
  "response": "According to the manual, you need 6 screws total. Each of the three legs requires 2 screws...",
  "filename": "audio.mp3"
}
```

### Example Transcription Request (Transcription Only)

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

### Example PDF to Text Manual Conversion with Session

```bash
curl -X POST "http://localhost:8000/api/pdf-to-text" \
  -F "file=@path/to/manual.pdf"
```

**Features:**
- Converts PDF manuals into well-formatted text-based manuals
- Organizes content with proper sections, steps, and formatting
- Includes parts lists, assembly instructions, diagrams descriptions, and warnings
- Uses Google Gemini 2.5 Flash for intelligent document understanding
- Creates a session for subsequent chat requests with manual context

**Response:**
```json
{
  "text": "# Product Manual\n\n## Parts List\n\n| Item | Description | Quantity |\n...",
  "filename": "manual.pdf",
  "session_id": "abc-123-uuid",
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
- Session-based manual storage enables efficient multi-turn conversations with context
