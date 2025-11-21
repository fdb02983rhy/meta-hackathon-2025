from fastapi import APIRouter, Query, UploadFile, File, HTTPException
from app.services.llama_agent import agent, run_agent_with_files

router = APIRouter()


@router.post("/chat")
async def chat(
    message: str = Query(..., description="The message to send to the AI"),
    files: list[UploadFile] = File(None, description="Optional files (images, PDFs)"),
):
    """
    Chat endpoint using SambaNova Llama-4-Maverick model.

    Supports:
    - Text-only messages
    - Messages with attached images (JPEG, PNG, GIF, WebP)
    - Messages with attached PDFs
    - Multiple files in a single request
    """
    try:
        if not files:
            # Text-only message
            result = await agent.run(message)
            return {"response": result.output}

        # Process files
        file_data = []
        for file in files:
            if not file:
                continue

            # Read file content
            content = await file.read()

            # Validate file type
            content_type = file.content_type or "application/octet-stream"

            # Support images and PDFs
            supported_types = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
                "application/pdf",
            ]

            if content_type not in supported_types:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {content_type}. Supported types: images (JPEG, PNG, GIF, WebP) and PDF",
                )

            file_data.append((content, file.filename or "file", content_type))

        # Run agent with files
        result = await run_agent_with_files(message, file_data)
        return {"response": result.output}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")
