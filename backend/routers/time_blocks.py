from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
import os

router = APIRouter(prefix="/api/time-blocks", tags=["time-blocks"])

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "timemate.db")

class TimeBlockCreate(BaseModel):
    title: str
    type: str  # deep_work, meeting, client, learning, break, misc
    start_time: datetime
    end_time: datetime
    date: date
    completed: bool = False

class TimeBlockUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    date: Optional[date] = None
    completed: Optional[bool] = None

class TimeBlockResponse(BaseModel):
    id: int
    title: str
    type: str
    start_time: datetime
    end_time: datetime
    date: date
    completed: bool

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS time_blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                date TEXT NOT NULL,
                completed BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_date ON time_blocks(date)")

@router.get("/", response_model=List[TimeBlockResponse])
def get_time_blocks(start_date: Optional[date] = None, end_date: Optional[date] = None):
    with get_connection() as conn:
        query = "SELECT * FROM time_blocks"
        params = []
        if start_date and end_date:
            query += " WHERE date BETWEEN ? AND ?"
            params = [start_date.isoformat(), end_date.isoformat()]
        elif start_date:
            query += " WHERE date >= ?"
            params = [start_date.isoformat()]
        elif end_date:
            query += " WHERE date <= ?"
            params = [end_date.isoformat()]
        query += " ORDER BY start_time"
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]

@router.post("/", response_model=TimeBlockResponse)
def create_time_block(block: TimeBlockCreate):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO time_blocks (title, type, start_time, end_time, date, completed)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                block.title,
                block.type,
                block.start_time.isoformat(),
                block.end_time.isoformat(),
                block.date.isoformat(),
                1 if block.completed else 0,
            ),
        )
        conn.commit()
        block_id = cursor.lastrowid
        return {
            "id": block_id,
            **block.dict(),
        }

@router.get("/{block_id}", response_model=TimeBlockResponse)
def get_time_block(block_id: int):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM time_blocks WHERE id = ?", (block_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Time block not found")
        return dict(row)

@router.put("/{block_id}", response_model=TimeBlockResponse)
def update_time_block(block_id: int, updates: TimeBlockUpdate):
    with get_connection() as conn:
        # Check existence
        row = conn.execute(
            "SELECT * FROM time_blocks WHERE id = ?", (block_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Time block not found")
        
        # Build update query
        fields = []
        values = []
        for field, value in updates.dict(exclude_unset=True).items():
            if value is not None:
                if field == "start_time" or field == "end_time":
                    value = value.isoformat()
                elif field == "completed":
                    value = 1 if value else 0
                fields.append(f"{field} = ?")
                values.append(value)
        
        if not fields:
            return dict(row)
        
        values.append(block_id)
        query = f"UPDATE time_blocks SET {', '.join(fields)} WHERE id = ?"
        conn.execute(query, values)
        conn.commit()
        
        # Return updated
        row = conn.execute(
            "SELECT * FROM time_blocks WHERE id = ?", (block_id,)
        ).fetchone()
        return dict(row)

@router.delete("/{block_id}")
def delete_time_block(block_id: int):
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM time_blocks WHERE id = ?", (block_id,)
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Time block not found")
        return {"message": "Time block deleted"}