from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic_core import to_jsonable_python
from pydantic_ai.exceptions import ModelHTTPError
from app.services.transcription import transcription_service
from app.services.llama_assembly_agent import run_agent_with_files
from app.services.session_manager import (
    get_manual_text,
    get_conversation_history,
    update_conversation_history,
)
from pathlib import Path
from datetime import datetime

router = APIRouter()


@router.post("/voice-chat")
async def voice_chat(
    file: UploadFile = File(..., description="Audio file to transcribe and chat about"),
    session_id: str = Query(
        None, description="Optional session ID from PDF upload for manual context"
    ),
):
    """
    Voice chat endpoint combining audio transcription with Llama assembly assistant.

    Workflow:
    1. Transcribe audio using SambaNova's Whisper-Large-v3
    2. Send transcribed text to Llama assembly agent (with optional manual context)
    3. Return both transcription and agent response

    Supports:
    - Audio transcription (MP3, WAV, M4A, etc.)
    - Optional session_id for assembly manual context (from /api/pdf-to-text)
    - Conversation history for multi-turn voice interactions

    Args:
        file: Audio file to transcribe
        session_id: Optional session ID for manual context and conversation history

    Returns:
        JSON with transcription, AI response, and filename
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    try:
        # Step 1: Read and save audio file
        print(f"[Voice Chat] Received file: {file.filename}, content_type: {file.content_type}")
        contents = await file.read()
        print(f"[Voice Chat] File size: {len(contents)} bytes")

        if len(contents) == 0:
            raise HTTPException(
                status_code=400,
                detail="Received empty audio file"
            )

        # Save audio file to recordings directory
        recordings_dir = Path("recordings")
        recordings_dir.mkdir(exist_ok=True)

        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(file.filename).suffix if file.filename else ".mp3"
        saved_filename = f"recording_{timestamp}{file_extension}"
        saved_path = recordings_dir / saved_filename

        # Write audio file
        with open(saved_path, "wb") as f:
            f.write(contents)
        print(f"[Voice Chat] Saved audio file to: {saved_path}")

        # Step 2: Transcribe audio

        transcription = transcription_service.transcribe_from_bytes(
            contents, file.filename or "audio.mp3"
        )
        print(f"[Voice Chat] Transcription successful: {transcription[:100]}...")

        # Step 3: Get manual text and conversation history from session if provided
        manual_text = None
        conversation_history = None
        if session_id:
            print(f"[Voice Chat] Using session_id: {session_id}")
            manual_text = get_manual_text(session_id)
            if manual_text is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Session not found or expired: {session_id}",
                )
            conversation_history = get_conversation_history(session_id)

        # Step 4: Send transcribed text to Llama assembly agent
        print("[Voice Chat] Sending to Llama agent...")
        result = await run_agent_with_files(
            message=transcription,
            manual_text=manual_text,
            message_history=conversation_history,
        )
        print(f"[Voice Chat] Agent response received: {result.output[:100]}...")

        # Step 5: Update conversation history in session if session_id provided
        if session_id:
            # Serialize all messages and update session
            serialized_messages = to_jsonable_python(result.all_messages())
            update_conversation_history(session_id, serialized_messages)

        # Step 6: Return transcription and response
        return {
            "transcription": transcription,
            "response": result.output,
            "filename": file.filename,
        }

    except HTTPException:
        raise
    except ModelHTTPError as e:
        # Handle Pydantic AI model errors (rate limits, API errors, etc.)
        print(f"[Voice Chat] ModelHTTPError: status={e.status_code}, body={e.body}")
        if e.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="SambaNova API rate limit exceeded. Please wait a moment and try again."
            )
        raise HTTPException(
            status_code=e.status_code or 500,
            detail=f"AI model error: {e.body.get('message', str(e)) if isinstance(e.body, dict) else str(e)}"
        )
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[Voice Chat] Error: {str(e)}")
        print(f"[Voice Chat] Traceback:\n{error_trace}")

        raise HTTPException(
            status_code=500, detail=f"Voice chat processing failed: {str(e)}"
        )
