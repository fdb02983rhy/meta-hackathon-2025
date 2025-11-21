import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class ManualSession:
    """Session data for storing uploaded manual text."""

    session_id: str
    manual_text: str
    filename: str
    created_at: datetime


# In-memory storage for manual sessions
# Key: session_id, Value: ManualSession
_manual_sessions: dict[str, ManualSession] = {}

# Configuration
MAX_SESSION_AGE_HOURS = 1
MAX_SESSIONS = 100


def create_session(manual_text: str, filename: str) -> str:
    """
    Create a new session to store manual text.

    Args:
        manual_text: The extracted manual text
        filename: Original PDF filename

    Returns:
        session_id: Unique identifier for this session
    """
    # Clean up expired sessions before creating new one
    cleanup_expired_sessions()

    # If we're at max capacity, remove oldest session
    if len(_manual_sessions) >= MAX_SESSIONS:
        oldest_id = min(_manual_sessions.keys(), key=lambda k: _manual_sessions[k].created_at)
        del _manual_sessions[oldest_id]

    # Create new session
    session_id = str(uuid.uuid4())
    session = ManualSession(
        session_id=session_id,
        manual_text=manual_text,
        filename=filename,
        created_at=datetime.now(),
    )

    _manual_sessions[session_id] = session
    return session_id


def get_manual_text(session_id: str) -> str | None:
    """
    Retrieve manual text for a given session ID.

    Args:
        session_id: The session identifier

    Returns:
        Manual text if session exists and is valid, None otherwise
    """
    session = _manual_sessions.get(session_id)

    if not session:
        return None

    # Check if session has expired
    age = datetime.now() - session.created_at
    if age > timedelta(hours=MAX_SESSION_AGE_HOURS):
        # Session expired, remove it
        del _manual_sessions[session_id]
        return None

    return session.manual_text


def cleanup_expired_sessions():
    """Remove all expired sessions from storage."""
    now = datetime.now()
    expired_ids = [
        sid
        for sid, session in _manual_sessions.items()
        if now - session.created_at > timedelta(hours=MAX_SESSION_AGE_HOURS)
    ]

    for sid in expired_ids:
        del _manual_sessions[sid]


def get_session_count() -> int:
    """Get the current number of active sessions."""
    cleanup_expired_sessions()
    return len(_manual_sessions)
