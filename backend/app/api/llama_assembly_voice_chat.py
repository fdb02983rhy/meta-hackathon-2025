from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic_core import to_jsonable_python
from app.services.transcription import transcription_service
from app.services.llama_assembly_agent import run_agent_with_files
from app.services.session_manager import (
    get_manual_text,
    get_conversation_history,
    update_conversation_history,
)

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
        # Step 1: Transcribe audio
        contents = await file.read()
        transcription = transcription_service.transcribe_from_bytes(
            contents, file.filename or "audio.mp3"
        )

        # Step 2: Get manual text and conversation history from session if provided
        manual_text = None
        conversation_history = None
        if session_id:
            manual_text = get_manual_text(session_id)
            if manual_text is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Session not found or expired: {session_id}",
                )
            conversation_history = get_conversation_history(session_id)

        # Step 3: Send transcribed text to Llama assembly agent
        result = await run_agent_with_files(
            message=transcription,
            manual_text=manual_text,
            message_history=conversation_history,
        )

        # Step 4: Update conversation history in session if session_id provided
        if session_id:
            # Serialize all messages and update session
            serialized_messages = to_jsonable_python(result.all_messages())
            update_conversation_history(session_id, serialized_messages)

        # Step 5: Return transcription and response
        return {
            "transcription": transcription,
            "response": result.output,
            "filename": file.filename,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Voice chat processing failed: {str(e)}"
        )
