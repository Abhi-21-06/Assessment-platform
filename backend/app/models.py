import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .db import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)

    # ADD THIS LINE
    identity_key = Column(String, unique=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)



class Test(Base):
    __tablename__ = "tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    max_marks = Column(Integer)
    negative_marking = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    test_id = Column(UUID(as_uuid=True), ForeignKey("tests.id"))
    source_event_id = Column(String)
    started_at = Column(DateTime)
    submitted_at = Column(DateTime)
    answers = Column(JSONB)
    raw_payload = Column(JSONB)
    status = Column(String)
    duplicate_of_attempt_id = Column(UUID(as_uuid=True), nullable=True)


class AttemptScore(Base):
    __tablename__ = "attempt_scores"

    attempt_id = Column(UUID(as_uuid=True), ForeignKey("attempts.id"), primary_key=True)
    correct = Column(Integer)
    wrong = Column(Integer)
    skipped = Column(Integer)
    accuracy = Column(Integer)
    net_correct = Column(Integer)
    score = Column(Integer)
    explanation = Column(JSONB)
    computed_at = Column(DateTime, default=datetime.utcnow)

class Flag(Base):
    __tablename__ = "flags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("attempts.id"))
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
