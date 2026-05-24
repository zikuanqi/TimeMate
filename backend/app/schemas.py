from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# Task schemas
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    estimated_minutes: int = 0
    project_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    status: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    priority: str
    estimated_minutes: int
    actual_minutes: Optional[int]
    status: str
    project_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# TimeBlock schemas
class TimeBlockCreate(BaseModel):
    task_id: Optional[str] = None
    title: str
    type: str = "misc"
    start_time: datetime
    end_time: datetime
    date: str

class TimeBlockUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class TimeBlockResponse(BaseModel):
    id: str
    task_id: Optional[str]
    title: str
    type: str
    start_time: datetime
    end_time: datetime
    completed: bool
    date: str
    notes: Optional[str]

    class Config:
        from_attributes = True

# FocusSession schemas
class FocusSessionCreate(BaseModel):
    time_block_id: Optional[str] = None
    task_id: Optional[str] = None
    planned_duration: int  # seconds

class FocusSessionUpdate(BaseModel):
    actual_duration: Optional[int] = None
    completed: Optional[bool] = None

class InterruptionCreate(BaseModel):
    reason: str
    note: Optional[str] = None

class FocusSessionResponse(BaseModel):
    id: str
    time_block_id: Optional[str]
    task_id: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    planned_duration: int
    actual_duration: Optional[int]
    completed: bool

    class Config:
        from_attributes = True

# AI Chat schemas
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    action: Optional[str] = None