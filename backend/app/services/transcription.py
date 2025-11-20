from sambanova import SambaNova
from app.core.config import settings


class TranscriptionService:
    def __init__(self):
        self.client = SambaNova(
            api_key=settings.sambanova_api_key,
            base_url=settings.sambanova_base_url,
        )

    def transcribe(self, audio_path: str) -> str:
        """
        Transcribe audio file using SambaNova's Whisper-Large-v3 model.

        Args:
            audio_path: Path to the audio file

        Returns:
            Transcribed text
        """
        with open(audio_path, "rb") as audio:
            resp = self.client.audio.transcriptions.create(
                model="Whisper-Large-v3",
                file=audio,
                response_format="text",
            )
        return resp

    def transcribe_from_bytes(self, audio_bytes: bytes, filename: str) -> str:
        """
        Transcribe audio from bytes using SambaNova's Whisper-Large-v3 model.

        Args:
            audio_bytes: Audio file bytes
            filename: Original filename for the audio

        Returns:
            Transcribed text
        """
        import io

        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename

        resp = self.client.audio.transcriptions.create(
            model="Whisper-Large-v3",
            file=audio_file,
            response_format="text",
        )
        return resp


transcription_service = TranscriptionService()
