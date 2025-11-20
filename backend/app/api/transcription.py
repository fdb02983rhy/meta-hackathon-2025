from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.transcription import transcription_service

router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe a recorded audio MP3 file using SambaNova's Whisper-Large-v3 model.

    Args:
        file: MP3 audio file to transcribe

    Returns:
        JSON response with transcribed text
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    try:
        contents = await file.read()

        transcription = transcription_service.transcribe_from_bytes(
            contents, file.filename or "audio.mp3"
        )

        return {"transcription": transcription, "filename": file.filename}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
