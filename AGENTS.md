# Project Structure

This project is a full-stack application with a FastAPI backend and React frontend.

## High-Level Folder Structure

```
meta-hackathon-2025/
├── backend/                 # FastAPI backend application
│   └── app/
│       ├── main.py         # Main FastAPI application with CORS configuration
│       ├── core/           # Core configuration and settings
│       └── api/            # API routes and endpoints
│
├── frontend/               # React frontend application (Vite)
│   ├── src/               # Source files
│   │   ├── App.jsx        # Main app component
│   │   ├── main.jsx       # Entry point
│   │   └── assets/        # Static assets
│   ├── public/            # Public assets
│   ├── package.json       # Node dependencies
│   └── vite.config.js     # Vite configuration
│
├── .venv/                 # Python virtual environment
├── requirements.txt       # Python dependencies
└── .env                   # Environment variables
```

## Running the Server

### Prerequisites

- Python 3.x
- Node.js 22+
- `uv` package manager (for Python)
- npm (for Node.js)

### Backend Setup & Run

1. **Install Python dependencies:**
   ```bash
   uv pip install -r requirements.txt
   ```

2. **Run the backend server:**
   ```bash
   source .venv/bin/activate
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

   The backend will be available at: `http://localhost:8000`

### Frontend Setup & Run

1. **Install Node dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the frontend development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at: `http://localhost:5173`

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `GET /api/test` - Test endpoint for frontend connection
- `GET /docs` - Interactive API documentation (Swagger UI)

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
