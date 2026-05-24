from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Task, TimeBlock, FocusSession, Interruption
from app.schemas import (
    TaskCreate, TaskUpdate, TaskResponse,
    TimeBlockCreate, TimeBlockUpdate, TimeBlockResponse,
    FocusSessionCreate, FocusSessionUpdate, FocusSessionResponse,
    InterruptionCreate,
)

router = APIRouter(prefix="/api", tags=["api"])

# === Tasks ===

@router.get("/tasks", response_model=List[TaskResponse])
def list_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.created_at.desc()).all()

@router.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in task.model_dump(exclude_unset=True).items():
        setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted"}

# === TimeBlocks ===

@router.get("/timeblocks", response_model=List[TimeBlockResponse])
def list_timeblocks(date: str | None = None, db: Session = Depends(get_db)):
    query = db.query(TimeBlock)
    if date:
        query = query.filter(TimeBlock.date == date)
    return query.order_by(TimeBlock.start_time).all()

@router.post("/timeblocks", response_model=TimeBlockResponse)
def create_timeblock(block: TimeBlockCreate, db: Session = Depends(get_db)):
    db_block = TimeBlock(**block.model_dump())
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

@router.put("/timeblocks/{block_id}", response_model=TimeBlockResponse)
def update_timeblock(block_id: str, block: TimeBlockUpdate, db: Session = Depends(get_db)):
    db_block = db.query(TimeBlock).filter(TimeBlock.id == block_id).first()
    if not db_block:
        raise HTTPException(status_code=404, detail="TimeBlock not found")
    for key, value in block.model_dump(exclude_unset=True).items():
        setattr(db_block, key, value)
    db.commit()
    db.refresh(db_block)
    return db_block

@router.delete("/timeblocks/{block_id}")
def delete_timeblock(block_id: str, db: Session = Depends(get_db)):
    db_block = db.query(TimeBlock).filter(TimeBlock.id == block_id).first()
    if not db_block:
        raise HTTPException(status_code=404, detail="TimeBlock not found")
    db.delete(db_block)
    db.commit()
    return {"message": "TimeBlock deleted"}

# === FocusSessions ===

@router.get("/focus-sessions", response_model=List[FocusSessionResponse])
def list_focus_sessions(db: Session = Depends(get_db)):
    return db.query(FocusSession).order_by(FocusSession.start_time.desc()).limit(50).all()

@router.post("/focus-sessions", response_model=FocusSessionResponse)
def create_focus_session(session: FocusSessionCreate, db: Session = Depends(get_db)):
    from datetime import datetime
    db_session = FocusSession(
        **session.model_dump(),
        start_time=datetime.utcnow()
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.put("/focus-sessions/{session_id}", response_model=FocusSessionResponse)
def update_focus_session(session_id: str, session: FocusSessionUpdate, db: Session = Depends(get_db)):
    db_session = db.query(FocusSession).filter(FocusSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="FocusSession not found")
    for key, value in session.model_dump(exclude_unset=True).items():
        setattr(db_session, key, value)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.post("/focus-sessions/{session_id}/interrupt")
def add_interruption(session_id: str, interruption: InterruptionCreate, db: Session = Depends(get_db)):
    db_session = db.query(FocusSession).filter(FocusSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="FocusSession not found")
    db_interruption = Interruption(session_id=session_id, **interruption.model_dump())
    db.add(db_interruption)
    db.commit()
    return {"message": "Interruption recorded"}