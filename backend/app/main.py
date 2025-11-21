from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.llama_assembly_chat import router as chat_router
from app.api.transcription import router as transcription_router
from app.api.pdf_to_text import router as pdf_router

app = FastAPI()

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",  # Alternative React port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to the API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/test")
async def test_endpoint():
    return {
        "message": "Backend is connected!",
        "status": "success",
        "data": {"timestamp": "2025-11-20"},
    }


# Include routers
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(transcription_router, prefix="/api", tags=["Transcription"])
app.include_router(pdf_router, prefix="/api", tags=["PDF"])
