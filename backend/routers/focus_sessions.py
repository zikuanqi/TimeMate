from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
import os

router = APIRouter(prefix="/api/focus-sessions", tags=["focus-sessions"])

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "timemate.db")

class InterruptionCreate(BaseModel):
    reason: str  # notification, urgent_matter, distraction, physical_need, other
    note: str = ""

class InterruptionResponse(InterruptionCreate):
    id: int
    session_id: int
    time: datetime

class FocusSessionCreate(BaseModel):
    time_block_id: Optional[int] = None
    task_id: Optional[int] = None
    planned_duration: int  # seconds
    start_time: datetime

class FocusSessionUpdate(BaseModel):
    end_time: Optional[datetime] = None
    actual_duration: Optional[int] = None
    completed: Optional[bool] = None

class FocusSessionResponse(BaseModel):
    id: int
    time_block_id: Optional[int]
    task_id: Optional[int]
    start_time: datetime
    end_time: Optional[datetime]
    planned_duration: int
    actual_duration: Optional[int]
    completed: bool
    created_at: datetime
    interruptions: List[InterruptionResponse] = []

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_connection() as conn:
        # Focus sessions
        conn.execute("""
            CREATE TABLE IF NOT EXISTS focus_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                time_block_id INTEGER,
                task_id INTEGER,
                start_time TEXT NOT NULL,
                end_time TEXT,
                planned_duration INTEGER NOT NULL,
                actual_duration INTEGER,
                completed BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (time_block_id) REFERENCES time_blocks(id),
                FOREIGN KEY (task_id) REFERENCES tasks(id)
            )
        """)
        # Interruptions
        conn.execute("""
            CREATE TABLE IF NOT EXISTS interruptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                note TEXT DEFAULT '',
                time TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES focus_sessions(id) ON DELETE CASCADE
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_session_start ON focus_sessions(start_time)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_session_completed ON focus_sessions(completed)")

@router.get("/", response_model=List[FocusSessionResponse])
def get_sessions(
    date: Optional[str] = None,
    completed: Optional[bool] = None,
    limit: int = 50,
):
    query = "SELECT * FROM focus_sessions WHERE 1=1"
    params = []
    
    if date:
        query += " AND DATE(start_time) = ?"
        params.append(date)
    if completed is not None:
        query += " AND completed = ?"
        params.append(1 if completed else 0)
    
    query += " ORDER BY start_time DESC LIMIT ?"
    params.append(limit)
    
    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        sessions = []
        for row in rows:
            session = dict(row)
            # Load interruptions
            interruptions = conn.execute(
                "SELECT * FROM interruptions WHERE session_id = ? ORDER BY time",
                (session["id"],)
            ).fetchall()
            session["interruptions"] = [dict(i) for i in interruptions]
            sessions.append(session)
        return sessions

@router.get("/active", response_model=Optional[FocusSessionResponse])
def get_active_session():
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM focus_sessions WHERE completed = 0 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1"
        ).fetchone()
        if not row:
            return None
        session = dict(row)
        interruptions = conn.execute(
            "SELECT * FROM interruptions WHERE session_id = ? ORDER BY time",
            (session["id"],)
        ).fetchall()
        session["interruptions"] = [dict(i) for i in interruptions]
        return session

@router.post("/", response_model=FocusSessionResponse)
def create_session(session: FocusSessionCreate):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO focus_sessions (time_block_id, task_id, start_time, planned_duration)
            VALUES (?, ?, ?, ?)
            """,
            (
                session.time_block_id,
                session.task_id,
                session.start_time.isoformat(),
                session.planned_duration,
            ),
        )
        conn.commit()
        session_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM focus_sessions WHERE id = ?", (session_id,)).fetchone()
        return {**dict(row), "interruptions": []}

@router.put("/{session_id}", response_model=FocusSessionResponse)
def update_session(session_id: int, updates: FocusSessionUpdate):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM focus_sessions WHERE id = ?", (session_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Focus session not found")
        
        fields = []
        values = []
        for field, value in updates.dict(exclude_unset=True).items():
            if value is not None:
                if field in ["end_time"]:
                    value = value.isoformat()
                fields.append(f"{field} = ?")
                values.append(value)
        
        if fields:
            values.append(session_id)
            conn.execute(f"UPDATE focus_sessions SET {', '.join(fields)} WHERE id = ?", values)
            conn.commit()
        
        row = conn.execute("SELECT * FROM focus_sessions WHERE id = ?", (session_id,)).fetchone()
        interruptions = conn.execute(
            "SELECT * FROM interruptions WHERE session_id = ? ORDER BY time",
            (session_id,)
        ).fetchall()
        return {**dict(row), "interruptions": [dict(i) for i in interruptions]}

@router.post("/{session_id}/interruptions", response_model=InterruptionResponse)
def add_interruption(session_id: int, interruption: InterruptionCreate):
    with get_connection() as conn:
        # Verify session exists
        row = conn.execute("SELECT * FROM focus_sessions WHERE id = ?", (session_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Focus session not found")
        
        cursor = conn.execute(
            """
            INSERT INTO interruptions (session_id, reason, note, time)
            VALUES (?, ?, ?, ?)
            """,
            (
                session_id,
                interruption.reason,
                interruption.note,
                datetime.now().isoformat(),
            ),
        )
        conn.commit()
        inter_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM interruptions WHERE id = ?", (inter_id,)).fetchone()
        return dict(row)

@router.get("/{session_id}/interruptions", response_model=List[InterruptionResponse])
def get_interruptions(session_id: int):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM interruptions WHERE session_id = ? ORDER BY time",
            (session_id,)
        ).fetchall()
        return [dict(row) for row in rows]

@router.get("/stats/daily")
def get_daily_stats(date: str):
    with get_connection() as conn:
        # Total focus time
        row = conn.execute("""
            SELECT COALESCE(SUM(actual_duration), 0) as total_seconds,
                   COUNT(*) as total_sessions,
                   COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed_sessions
            FROM focus_sessions
            WHERE DATE(start_time) = ?
        """, (date,)).fetchone()
        
        # Interruption stats
        inter_rows = conn.execute("""
            SELECT reason, COUNT(*) as count
            FROM interruptions i
            JOIN focus_sessions f ON i.session_id = f.id
            WHERE DATE(f.start_time) = ?
            GROUP BY reason
            ORDER BY count DESC
        """, (date,)).fetchall()
        
        return {
            "date": date,
            "total_focus_seconds": row["total_seconds"],
            "total_sessions": row["total_sessions"],
            "completed_sessions": row["completed_sessions"],
            "interruption_stats": [dict(r) for r in inter_rows],
        }