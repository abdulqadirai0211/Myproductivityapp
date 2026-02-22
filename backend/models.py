"""SQLAlchemy database models."""

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, Date, Time,
    ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from datetime import datetime, date
import enum

from database import Base


# --- Enums ---

class GoalCategory(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class GoalStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    SKIPPED = "skipped"


class TaskPriority(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    OPTIONAL = "optional"


class EisenhowerQuadrant(str, enum.Enum):
    DO_FIRST = "do_first"           # Urgent + Important
    SCHEDULE = "schedule"           # Not Urgent + Important
    DELEGATE = "delegate"           # Urgent + Not Important
    ELIMINATE = "eliminate"         # Not Urgent + Not Important


# --- Models ---

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    category = Column(SQLEnum(GoalCategory), nullable=False)
    status = Column(SQLEnum(GoalStatus), default=GoalStatus.NOT_STARTED)
    progress = Column(Float, default=0.0)  # 0-100
    target_date = Column(Date, nullable=True)
    color = Column(String(7), default="#6366f1")  # hex color
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="goal", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="linked_goal", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM)
    quadrant = Column(SQLEnum(EisenhowerQuadrant), nullable=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TODO)
    due_date = Column(Date, nullable=True)
    due_time = Column(Time, nullable=True)
    estimated_minutes = Column(Integer, nullable=True)
    actual_minutes = Column(Integer, nullable=True)
    category = Column(String(100), default="general")
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(50), nullable=True)  # daily, weekly, monthly
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    goal = relationship("Goal", back_populates="tasks")
    notes = relationship("Note", back_populates="linked_task", cascade="all, delete-orphan")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="")  # Markdown content
    tags = Column(String(500), default="")  # comma-separated tags
    linked_goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True)
    linked_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    linked_goal = relationship("Goal", back_populates="notes")
    linked_task = relationship("Task", back_populates="notes")


class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, nullable=False, default=date.today)
    productivity_score = Column(Float, nullable=True)  # 0-10
    mood = Column(String(20), nullable=True)  # great, good, okay, bad, terrible
    energy_level = Column(Integer, nullable=True)  # 1-5
    tasks_completed = Column(Integer, default=0)
    tasks_total = Column(Integer, default=0)
    focus_hours = Column(Float, default=0.0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id = Column(Integer, primary_key=True, index=True)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    report_content = Column(Text, default="")  # Markdown content
    goals_progress = Column(Text, default="")  # JSON string
    tasks_summary = Column(Text, default="")  # JSON string
    insights = Column(Text, default="")  # AI-generated insights
    productivity_avg = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TaskCategory(Base):
    """User-defined task categories like Learning, Building, Content Creation."""
    __tablename__ = "task_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    icon = Column(String(10), default="📂")  # Emoji icon
    color = Column(String(7), default="#6366f1")
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    items = relationship("CategoryItem", back_populates="category", cascade="all, delete-orphan")


class CategoryItem(Base):
    """Sub-items within a category — e.g. topics under Learning, projects under Building."""
    __tablename__ = "category_items"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("task_categories.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    status = Column(String(50), default="active")  # active, completed, paused, archived
    phase = Column(String(100), nullable=True)  # e.g. "Phase 2 - MVP"
    eta = Column(Date, nullable=True)
    progress = Column(Float, default=0.0)  # 0-100
    parent_id = Column(Integer, ForeignKey("category_items.id"), nullable=True)  # for sub-items
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("TaskCategory", back_populates="items")
    children = relationship("CategoryItem",
                            foreign_keys="CategoryItem.parent_id",
                            lazy="select",
                            cascade="all, delete-orphan")


class ContentPost(Base):
    """Track content posts on LinkedIn, Medium, Reels, etc."""
    __tablename__ = "content_posts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False)  # linkedin, medium, reel, twitter, youtube
    title = Column(String(255), nullable=False)
    content_type = Column(String(50), default="post")  # post, article, reel, video
    topic = Column(String(255), default="")
    status = Column(String(50), default="idea")  # idea, drafting, published, scheduled
    published_date = Column(Date, nullable=True)
    url = Column(String(500), nullable=True)
    engagement = Column(Text, default="")  # likes, views, comments — JSON or free text
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


# --- P0: Habits & Streaks ---

class Habit(Base):
    """Recurring daily habits like Learning, Building, Posting."""
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    icon = Column(String(10), default="✅")
    color = Column(String(7), default="#6366f1")
    frequency = Column(String(20), default="daily")  # daily, weekdays, weekly
    target_value = Column(Float, default=1.0)  # e.g., 2 hours, 1 post
    unit = Column(String(50), default="times")  # times, hours, minutes, posts
    is_active = Column(Boolean, default=True)
    current_streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    """Daily check-in for a habit."""
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    completed = Column(Boolean, default=False)
    value = Column(Float, default=0.0)  # actual value achieved
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    habit = relationship("Habit", back_populates="logs")


# --- P1: Daily Standup / Reflection ---

class Standup(Base):
    """Morning plan + evening reflection."""
    __tablename__ = "standups"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, nullable=False, default=date.today)
    # Morning
    plan = Column(Text, default="")  # What I'll do today (markdown)
    top_priorities = Column(Text, default="")  # JSON list of top 3
    # Evening
    reflection = Column(Text, default="")  # What I actually did
    wins = Column(Text, default="")  # What went well
    blockers = Column(Text, default="")  # What blocked me
    tomorrow_focus = Column(Text, default="")  # What to focus on tomorrow
    # Scores
    mood = Column(String(20), nullable=True)
    energy = Column(Integer, nullable=True)  # 1-5
    focus_score = Column(Integer, nullable=True)  # 1-10
    overall_score = Column(Integer, nullable=True)  # 1-10
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# --- P1: Income Tracker ---

class IncomeEntry(Base):
    """Track income from various sources."""
    __tablename__ = "income_entries"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(100), nullable=False)  # freelance, job, content, course, product
    description = Column(Text, default="")
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    date = Column(Date, nullable=False, default=date.today)
    category = Column(String(50), default="freelance")  # freelance, job, passive, content, other
    is_recurring = Column(Boolean, default=False)
    client = Column(String(255), nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class IncomeGoal(Base):
    """Monthly/yearly income targets."""
    __tablename__ = "income_goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    target_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    period = Column(String(20), nullable=False)  # monthly, quarterly, yearly
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# --- P2: Time Blocking ---

class TimeBlock(Base):
    """Daily schedule time blocks."""
    __tablename__ = "time_blocks"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, default=date.today)
    title = Column(String(255), nullable=False)
    category = Column(String(50), default="work")  # learning, building, content, break, personal
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    color = Column(String(7), default="#6366f1")
    is_completed = Column(Boolean, default=False)
    actual_start = Column(Time, nullable=True)
    actual_end = Column(Time, nullable=True)
    notes = Column(Text, default="")
    linked_habit_id = Column(Integer, ForeignKey("habits.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

