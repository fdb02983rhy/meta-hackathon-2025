from fastapi import APIRouter, Query, UploadFile, File, HTTPException
from app.services.llama_assembly_agent import run_agent_with_files
from app.services.session_manager import get_manual_text

router = APIRouter()


@router.post("/chat")
async def chat(
    message: str = Query(..., description="The message to send to the AI"),
    files: list[UploadFile] = File(None, description="Optional images (up to 5)"),
    session_id: str = Query(None, description="Optional session ID from PDF upload for manual context"),
):
    """
    Chat endpoint using SambaNova Llama-4-Maverick model.

    Supports:
    - Text-only messages
    - Messages with attached images (JPEG, PNG, GIF, WebP) - up to 5 images
    - Optional session_id for assembly manual context (from /api/pdf-to-text)
    """
    try:
        # Look up manual text from session if session_id provided
        manual_text = None
        if session_id:
            manual_text = get_manual_text(session_id)
            if manual_text is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Session not found or expired: {session_id}",
                )

        if not files:
            # Text-only message (with optional manual context)
            result = await run_agent_with_files(message, manual_text=manual_text)
            return {"response": result.output}

        # Validate image count
        valid_files = [f for f in files if f]
        if len(valid_files) > 5:
            raise HTTPException(
                status_code=400,
                detail="Maximum 5 images allowed per request",
            )

        # Process files
        file_data = []
        for file in valid_files:
            # Read file content
            content = await file.read()

            # Validate file type
            content_type = file.content_type or "application/octet-stream"

            # Support only images
            supported_types = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
            ]

            if content_type not in supported_types:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {content_type}. Only images (JPEG, PNG, GIF, WebP) are supported.",
                )

            file_data.append((content, file.filename or "file", content_type))

        # Run agent with files and optional manual context
        result = await run_agent_with_files(message, file_data, manual_text)
        return {"response": result.output}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")
