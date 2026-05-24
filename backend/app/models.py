from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

def gen_id():
    return str(uuid.uuid4())

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String, default="medium")  # low, medium, high
    estimated_minutes = Column(Integer, default=0)
    actual_minutes = Column(Integer, nullable=True)
    status = Column(String, default="pending")  # pending, in_progress, completed, cancelled
    project_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    time_blocks = relationship("TimeBlock", back_populates="task")
    focus_sessions = relationship("FocusSession", back_populates="task")


class TimeBlock(Base):
    __tablename__ = "time_blocks"
    
    id = Column(String, primary_key=True, default=gen_id)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    title = Column(String, nullable=False)
    type = Column(String, default="misc")  # deep_work, meeting, client, learning, break, misc
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    completed = Column(Boolean, default=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD format for easy querying
    external_event_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    task = relationship("Task", back_populates="time_blocks")


class FocusSession(Base):
    __tablename__ = "focus_sessions"
    
    id = Column(String, primary_key=True, default=gen_id)
    time_block_id = Column(String, ForeignKey("time_blocks.id"), nullable=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    planned_duration = Column(Integer, nullable=False)  # seconds
    actual_duration = Column(Integer, nullable=True)  # seconds
    completed = Column(Boolean, default=False)
    
    task = relationship("Task", back_populates="focus_sessions")
    interruptions = relationship("Interruption", back_populates="session")


class Interruption(Base):
    __tablename__ = "interruptions"
    
    id = Column(String, primary_key=True, default=gen_id)
    session_id = Column(String, ForeignKey("focus_sessions.id"), nullable=False)
    time = Column(DateTime, default=datetime.utcnow)
    reason = Column(String, nullable=False)  # notification, urgent_matter, distraction, physical_need, other
    note = Column(Text, nullable=True)
    
    session = relationship("FocusSession", back_populates="interruptions")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    
    id = Column(String, primary_key=True, default=gen_id)
    external_id = Column(String, nullable=False)
    source = Column(String, nullable=False)  # google, outlook
    title = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String, nullable=True)
    link = Column(String, nullable=True)