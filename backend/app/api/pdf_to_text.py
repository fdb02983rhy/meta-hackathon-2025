from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.gemini_pdf_agent import extract_text_from_pdf
from app.services.session_manager import create_session

router = APIRouter()


@router.post("/pdf-to-text")
async def pdf_to_text(file: UploadFile = File(...)):
    """
    Convert PDF manual to text-based manual using Google Gemini 2.5 Flash model.
    Creates a session to store the manual text for subsequent chat requests.

    Args:
        file: PDF manual file to convert

    Returns:
        JSON with converted text manual, filename, and session_id for chat requests
    """
    # Validate file type
    if not file.content_type == "application/pdf":
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Only PDF files are supported.",
        )

    try:
        # Read PDF file bytes
        pdf_bytes = await file.read()

        # Extract text using service layer
        text = await extract_text_from_pdf(pdf_bytes)

        # Create session to store manual text
        session_id = create_session(text, file.filename or "manual.pdf")

        return {
            "text": text,
            "filename": file.filename,
            "session_id": session_id,
            "status": "success",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
