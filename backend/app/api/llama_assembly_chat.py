from fastapi import APIRouter, Query, UploadFile, File, HTTPException
from app.services.llama_assembly_agent import agent, run_agent_with_files

router = APIRouter()


@router.post("/chat")
async def chat(
    message: str = Query(..., description="The message to send to the AI"),
    files: list[UploadFile] = File(None, description="Optional images (up to 5)"),
):
    """
    Chat endpoint using SambaNova Llama-4-Maverick model.

    Supports:
    - Text-only messages
    - Messages with attached images (JPEG, PNG, GIF, WebP) - up to 5 images
    """
    try:
        if not files:
            # Text-only message
            result = await agent.run(message)
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

        # Run agent with files
        result = await run_agent_with_files(message, file_data)
        return {"response": result.output}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")
