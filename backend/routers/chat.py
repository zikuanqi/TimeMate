from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
import sqlite3
import os

router = APIRouter(prefix="/api/chat", tags=["chat"])

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "timemate.db")

class ChatMessage(BaseModel):
    id: Optional[int] = None
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    session_id: str

class ChatSession(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON chat_messages(timestamp)")
        conn.commit()

@router.post("/sessions")
def create_session(title: str = "新对话"):
    """Create a new chat session."""
    session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    now = datetime.now()
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO chat_sessions (id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        """, (session_id, title, now, now))
        conn.commit()
    return {"session_id": session_id, "title": title, "created_at": now}

@router.get("/sessions")
def list_sessions(limit: int = 20, offset: int = 0):
    """List chat sessions with message count."""
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT s.*, COUNT(m.id) as message_count
            FROM chat_sessions s
            LEFT JOIN chat_messages m ON s.id = m.session_id
            GROUP BY s.id
            ORDER BY s.updated_at DESC
            LIMIT ? OFFSET ?
        """, (limit, offset)).fetchall()
        return [dict(r) for r in rows]

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    """Delete a chat session and all its messages."""
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        conn.commit()
    return {"deleted": True}

@router.post("/sessions/{session_id}/messages")
def add_message(session_id: str, message: ChatMessage):
    """Add a message to a session."""
    message.timestamp = datetime.now()
    with get_connection() as conn:
        # Ensure session exists
        session = conn.execute("SELECT id FROM chat_sessions WHERE id = ?", (session_id,)).fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        cur = conn.execute("""
            INSERT INTO chat_messages (session_id, role, content, timestamp)
            VALUES (?, ?, ?, ?)
        """, (session_id, message.role, message.content, message.timestamp))
        conn.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", (message.timestamp, session_id))
        conn.commit()
        return {"id": cur.lastrowid, **message.dict()}

@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: str, limit: int = 50, offset: int = 0):
    """Get messages from a session."""
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, role, content, timestamp, session_id
            FROM chat_messages
            WHERE session_id = ?
            ORDER BY timestamp ASC
            LIMIT ? OFFSET ?
        """, (session_id, limit, offset)).fetchall()
        return [dict(r) for r in rows]

@router.get("/sessions/{session_id}/messages/count")
def count_messages(session_id: str):
    """Count messages in a session."""
    with get_connection() as conn:
        count = conn.execute("SELECT COUNT(*) as c FROM chat_messages WHERE session_id = ?", (session_id,)).fetchone()
        return {"count": count["c"]}

@router.put("/sessions/{session_id}/title")
def update_session_title(session_id: str, title: str):
    """Update session title."""
    with get_connection() as conn:
        cur = conn.execute("UPDATE chat_sessions SET title = ? WHERE id = ?", (title, session_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        conn.commit()
    return {"updated": True}