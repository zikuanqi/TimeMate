from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter
import sqlite3
import os

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "timemate.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_date_range(days: int) -> tuple:
    end = datetime.now().date()
    start = end - timedelta(days=days - 1)
    return start.isoformat(), end.isoformat()

@router.get("/overview")
def get_overview():
    """Get high-level overview stats for today and this week."""
    today = datetime.now().date().isoformat()
    week_start, week_end = get_date_range(7)

    with get_connection() as conn:
        # Today's stats
        today_focus = conn.execute("""
            SELECT COALESCE(SUM(actual_duration), 0) as total_seconds,
                   COUNT(*) as total_sessions,
                   COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed
            FROM focus_sessions WHERE DATE(start_time) = ?
        """, (today,)).fetchone()

        # Today's tasks
        today_tasks = conn.execute("""
            SELECT COUNT(*) as total,
                   COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) as done
            FROM tasks WHERE DATE(created_at) = ?
        """, (today,)).fetchone()

        # Today's time blocks
        today_blocks = conn.execute("""
            SELECT COUNT(*) as total,
                   COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed
            FROM time_blocks WHERE date = ?
        """, (today,)).fetchone()

        # Week focus stats
        week_focus = conn.execute("""
            SELECT COALESCE(SUM(actual_duration), 0) as total_seconds,
                   COUNT(*) as total_sessions,
                   COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed
            FROM focus_sessions WHERE DATE(start_time) BETWEEN ? AND ?
        """, (week_start, week_end)).fetchone()

        # Week tasks
        week_tasks = conn.execute("""
            SELECT COUNT(*) as total,
                   COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) as done
            FROM tasks WHERE DATE(created_at) BETWEEN ? AND ?
        """, (week_start, week_end)).fetchone()

        # Weekly interruption stats
        inter_by_day = conn.execute("""
            SELECT DATE(f.start_time) as date, COUNT(*) as count
            FROM interruptions i
            JOIN focus_sessions f ON i.session_id = f.id
            WHERE DATE(f.start_time) BETWEEN ? AND ?
            GROUP BY DATE(f.start_time)
            ORDER BY date
        """, (week_start, week_end)).fetchall()

        # Top interruption reasons this week
        top_inter_reasons = conn.execute("""
            SELECT reason, COUNT(*) as count
            FROM interruptions i
            JOIN focus_sessions f ON i.session_id = f.id
            WHERE DATE(f.start_time) BETWEEN ? AND ?
            GROUP BY reason
            ORDER BY count DESC
            LIMIT 5
        """, (week_start, week_end)).fetchall()

        return {
            "today": {
                "date": today,
                "focus_seconds": today_focus["total_seconds"],
                "focus_sessions": today_focus["total_sessions"],
                "focus_completed": today_focus["completed"],
                "tasks_total": today_tasks["total"],
                "tasks_done": today_tasks["done"],
                "blocks_total": today_blocks["total"],
                "blocks_completed": today_blocks["completed"],
            },
            "week": {
                "start": week_start,
                "end": week_end,
                "focus_seconds": week_focus["total_seconds"],
                "focus_sessions": week_focus["total_sessions"],
                "focus_completed": week_focus["completed"],
                "tasks_total": week_tasks["total"],
                "tasks_done": week_tasks["done"],
                "interruption_daily": [dict(r) for r in inter_by_day],
                "top_interruption_reasons": [dict(r) for r in top_inter_reasons],
            },
        }

@router.get("/daily-focus")
def get_daily_focus(days: int = 14):
    """Get daily focus time for the last N days."""
    start, end = get_date_range(days)
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT DATE(start_time) as date,
                   COALESCE(SUM(actual_duration), 0) as total_seconds,
                   COUNT(*) as sessions,
                   COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed
            FROM focus_sessions
            WHERE DATE(start_time) BETWEEN ? AND ?
            GROUP BY DATE(start_time)
            ORDER BY date
        """, (start, end)).fetchall()

        # Fill missing days with zero
        result = []
        cursor_date = datetime.strptime(start, "%Y-%m-%d")
        end_date = datetime.strptime(end, "%Y-%m-%d")
        row_dict = {r["date"]: r for r in rows}

        while cursor_date <= end_date:
            date_str = cursor_date.strftime("%Y-%m-%d")
            if date_str in row_dict:
                r = row_dict[date_str]
                result.append({"date": date_str, "total_seconds": r["total_seconds"], "sessions": r["sessions"], "completed": r["completed"]})
            else:
                result.append({"date": date_str, "total_seconds": 0, "sessions": 0, "completed": 0})
            cursor_date += timedelta(days=1)

        return result

@router.get("/task-distribution")
def get_task_distribution():
    """Get task distribution by status and priority."""
    with get_connection() as conn:
        by_status = conn.execute("""
            SELECT status, COUNT(*) as count FROM tasks GROUP BY status
        """).fetchall()

        by_priority = conn.execute("""
            SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority
        """).fetchall()

        by_tag = conn.execute("""
            SELECT tags, COUNT(*) as count
            FROM tasks WHERE tags != '' AND tags IS NOT NULL
            GROUP BY tags ORDER BY count DESC LIMIT 10
        """).fetchall()

        return {
            "by_status": [dict(r) for r in by_status],
            "by_priority": [dict(r) for r in by_priority],
            "by_tag": [dict(r) for r in by_tag],
        }

@router.get("/productive-hours")
def get_productive_hours(days: int = 30):
    """Analyze most productive hours of day."""
    start, end = get_date_range(days)
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT CAST(strftime('%H', start_time) AS INTEGER) as hour,
                   COALESCE(SUM(actual_duration), 0) as total_seconds,
                   COUNT(*) as sessions
            FROM focus_sessions
            WHERE DATE(start_time) BETWEEN ? AND ? AND completed = 1
            GROUP BY hour
            ORDER BY total_seconds DESC
        """, (start, end)).fetchall()
        return [dict(r) for r in rows]

@router.get("/time-block-types")
def get_time_block_types(days: int = 30):
    """Get time block type distribution."""
    start, end = get_date_range(days)
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT type, COUNT(*) as count,
                   COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed
            FROM time_blocks
            WHERE date BETWEEN ? AND ?
            GROUP BY type
            ORDER BY count DESC
        """, (start, end)).fetchall()
        return [dict(r) for r in rows]