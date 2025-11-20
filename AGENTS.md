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
│   │   │   └── chat.py     # Chat API endpoint for AI interactions
│   │   └── services/
│   │       └── llama_agent.py  # Pydantic AI agent with SambaNova Llama-4
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

## Running the Application

### Prerequisites

- Docker & Docker Compose

### Using Docker Compose

This project uses Docker Compose to run both backend and frontend together in containers.

1. **Start the application:**
   ```bash
   docker compose up --build
   ```

   Or run in detached mode (background):
   ```bash
   docker compose up -d --build
   ```

2. **Stop the application:**
   ```bash
   docker compose down
   ```

3. **View logs:**
   ```bash
   docker compose logs -f
   ```

**Services:**
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- API Documentation: `http://localhost:8000/docs`

**Development Features:**
- Code changes are automatically reflected (volume mounting)
- Both services restart automatically on code changes
- Environment variables loaded from `.env` file

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

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `GET /api/test` - Test endpoint for frontend connection
- `POST /api/chat?message=<your_message>` - Chat with AI (Llama-4-Maverick)
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
