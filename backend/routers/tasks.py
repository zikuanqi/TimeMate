from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
import os

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "timemate.db")

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: int = 0  # 0=low, 1=medium, 2=high, 3=urgent
    status: str = "todo"  # todo, in_progress, done
    due_date: Optional[date] = None
    estimated_minutes: int = 30
    tags: str = ""  # comma-separated tags

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    estimated_minutes: Optional[int] = None
    tags: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    priority: int
    status: str
    due_date: Optional[date]
    estimated_minutes: int
    tags: str
    created_at: Optional[datetime] = None

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                priority INTEGER DEFAULT 0,
                status TEXT DEFAULT 'todo',
                due_date TEXT,
                estimated_minutes INTEGER DEFAULT 30,
                tags TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_task_status ON tasks(status)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_task_due ON tasks(due_date)")

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[str] = None,
    priority: Optional[int] = None,
    tag: Optional[str] = None,
    due_before: Optional[date] = None,
):
    query = "SELECT * FROM tasks WHERE 1=1"
    params: list = []

    if status:
        query += " AND status = ?"
        params.append(status)
    if priority is not None:
        query += " AND priority >= ?"
        params.append(priority)
    if tag:
        query += " AND tags LIKE ?"
        params.append(f"%{tag}%")
    if due_before:
        query += " AND (due_date <= ? OR due_date IS NULL)"
        params.append(due_before.isoformat())

    query += " ORDER BY priority DESC, created_at DESC"

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]


@router.post("/", response_model=TaskResponse)
def create_task(task: TaskCreate):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO tasks (title, description, priority, status, due_date, estimated_minutes, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                task.title,
                task.description,
                task.priority,
                task.status,
                task.due_date.isoformat() if task.due_date else None,
                task.estimated_minutes,
                task.tags,
            ),
        )
        conn.commit()
        task_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        return dict(row)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Task not found")
        return dict(row)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, updates: TaskUpdate):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Task not found")

        fields = []
        values = []
        for field, value in updates.dict(exclude_unset=True).items():
            if value is not None:
                if field == "due_date":
                    value = value.isoformat() if value else None
                fields.append(f"{field} = ?")
                values.append(value)

        if not fields:
            return dict(row)

        values.append(task_id)
        conn.execute(f"UPDATE tasks SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        return dict(row)


@router.delete("/{task_id}")
def delete_task(task_id: int):
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"message": "Task deleted"}


@router.post("/batch/status")
def batch_update_status(task_ids: List[int], status: str):
    with get_connection() as conn:
        placeholders = ",".join("?" * len(task_ids))
        conn.execute(
            f"UPDATE tasks SET status = ? WHERE id IN ({placeholders})",
            [status] + task_ids,
        )
        conn.commit()
        return {"updated": len(task_ids)}