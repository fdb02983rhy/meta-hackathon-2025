from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic_ai.exceptions import ModelHTTPError
from app.services.transcription import transcription_service
from app.services.llama_assembly_agent import run_agent_with_files
from pathlib import Path
from datetime import datetime
import uuid
import base64
from PIL import Image
import io

router = APIRouter()

# Create uploads directory for images
UPLOADS_DIR = Path("uploads/images")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/voice-chat-multimodal")
async def voice_chat_multimodal(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    images: list[UploadFile] = File(None, description="Optional images (up to 5)"),
):
    """
    Voice chat endpoint with multimodal support (audio + images).

    Workflow:
    1. Transcribe audio using SambaNova's Whisper-Large-v3
    2. Process images (if provided)
    3. Send transcribed text + images to Llama assembly agent
    4. Return both transcription and agent response

    Features:
    - Audio transcription (MP3, WAV, M4A, etc.)
    - Image analysis (JPEG, PNG, GIF, WebP) - up to 5 images
    - NO session/memory support (stateless)

    Args:
        audio: Audio file to transcribe (required)
        images: Optional list of images (up to 5)

    Returns:
        JSON with transcription, AI response, and filename
    """
    if not audio:
        raise HTTPException(status_code=400, detail="No audio file provided")

    try:
        # Step 1: Read and save audio file
        print(f"[Voice Chat Multimodal] Received audio: {audio.filename}, content_type: {audio.content_type}")
        audio_contents = await audio.read()
        print(f"[Voice Chat Multimodal] Audio size: {len(audio_contents)} bytes")

        if len(audio_contents) == 0:
            raise HTTPException(
                status_code=400,
                detail="Received empty audio file"
            )

        # Save audio file to recordings directory
        recordings_dir = Path("recordings")
        recordings_dir.mkdir(exist_ok=True)

        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(audio.filename).suffix if audio.filename else ".mp3"
        saved_filename = f"recording_multimodal_{timestamp}{file_extension}"
        saved_path = recordings_dir / saved_filename

        # Write audio file
        with open(saved_path, "wb") as f:
            f.write(audio_contents)
        print(f"[Voice Chat Multimodal] Saved audio file to: {saved_path}")

        # Step 2: Transcribe audio
        transcription = transcription_service.transcribe_from_bytes(
            audio_contents, audio.filename or "audio.mp3"
        )
        print(f"[Voice Chat Multimodal] Transcription successful: {transcription[:100]}...")

        # Step 3: Process images if provided - convert to base64 data URLs
        image_urls = None
        if images:
            # Validate image count
            valid_images = [img for img in images if img]
            if len(valid_images) > 5:
                raise HTTPException(
                    status_code=400,
                    detail="Maximum 5 images allowed per request",
                )

            print(f"[Voice Chat Multimodal] Processing {len(valid_images)} images...")
            image_urls = []
            for img in valid_images:
                # Read image content
                img_content = await img.read()

                # Validate file type
                content_type = img.content_type or "application/octet-stream"

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

                # Resize image to reduce token count (max 1024x1024)
                pil_image = Image.open(io.BytesIO(img_content))
                original_size = pil_image.size
                print(f"[Voice Chat Multimodal] Original image size: {original_size}")

                # Calculate new size maintaining aspect ratio
                max_size = 1024
                if pil_image.width > max_size or pil_image.height > max_size:
                    pil_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                    print(f"[Voice Chat Multimodal] Resized to: {pil_image.size}")

                # Convert to RGB if needed (for JPEG)
                if pil_image.mode in ('RGBA', 'LA', 'P'):
                    pil_image = pil_image.convert('RGB')

                # Save to bytes with compression
                img_byte_arr = io.BytesIO()
                pil_image.save(img_byte_arr, format='JPEG', quality=85, optimize=True)
                compressed_content = img_byte_arr.getvalue()

                print(f"[Voice Chat Multimodal] Original size: {len(img_content)} bytes, Compressed: {len(compressed_content)} bytes")

                # Convert to base64 data URL format required by SambaNova
                base64_encoded = base64.b64encode(compressed_content).decode('utf-8')

                # Use JPEG format for all compressed images
                data_url = f"data:image/jpeg;base64,{base64_encoded}"
                image_urls.append(data_url)

                print(f"[Voice Chat Multimodal] Converted {img.filename} to base64 data URL (JPEG, base64 size: {len(base64_encoded)} chars)")

            print("[Voice Chat Multimodal] Images processed successfully")

        # Step 4: Send transcribed text + images to Llama assembly agent (NO session context)
        print("[Voice Chat Multimodal] Sending to Llama agent (stateless, no memory)...")
        result = await run_agent_with_files(
            message=transcription,
            image_urls=image_urls,
            manual_text=None,  # No manual context
            message_history=None,  # No conversation history
        )
        print(f"[Voice Chat Multimodal] Agent response received: {result.output[:100]}...")

        # Step 5: Return transcription and response
        return {
            "transcription": transcription,
            "response": result.output,
            "filename": audio.filename,
            "image_count": len(image_urls) if image_urls else 0,
        }

    except HTTPException:
        raise
    except ModelHTTPError as e:
        # Handle Pydantic AI model errors (rate limits, API errors, etc.)
        print(f"[Voice Chat Multimodal] ModelHTTPError: status={e.status_code}, body={e.body}")
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
        print(f"[Voice Chat Multimodal] Error: {str(e)}")
        print(f"[Voice Chat Multimodal] Traceback:\n{error_trace}")

        raise HTTPException(
            status_code=500, detail=f"Voice chat multimodal processing failed: {str(e)}"
        )
