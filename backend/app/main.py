import json
import os
import uuid
from datetime import datetime
from uuid import UUID

from fastapi import FastAPI, Query, Request, HTTPException

from .db import engine, Base, SessionLocal
from . import models
from .scoring import compute_score
from .identity import get_student_identity
from .dedup import find_duplicate_attempt
from .logging_config import get_logger

from fastapi.middleware.cors import CORSMiddleware




app = FastAPI()


origins = [
    "http://localhost:5173",                       
    "https://assessment-platform-frontend-rgvs.onrender.com",    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

http_logger = get_logger("http")
scoring_logger = get_logger("scoring")
dedup_logger = get_logger("dedup")


# -----------------------
# STARTUP
# -----------------------
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


# -----------------------
# REQUEST LOGGING
# -----------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = datetime.utcnow()

    response = await call_next(request)

    duration = (datetime.utcnow() - start_time).total_seconds()

    http_logger.info(
        "Request completed",
        extra={
            "context": {"request_id": request_id},
            "extra": {
                "path": request.url.path,
                "method": request.method,
                "duration": duration,
                "status_code": response.status_code,
            },
        },
    )

    return response


# -----------------------
# HEALTH CHECK
# -----------------------
@app.get("/")
def home():
    return {"message": "Backend + PostgreSQL connected successfully!"}


# -----------------------
# LOAD JSON (INGESTION)
# -----------------------
@app.post("/load-json")
def load_json():
    db = SessionLocal()

    try:
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(BASE_DIR, "..", "attempt_events.json")

        with open(file_path, "r") as f:
            data = json.load(f)

        for event in data:
            try:
                student_data = event.get("student", {})

                identity_key = get_student_identity(
                    student_data.get("email"),
                    student_data.get("phone"),
                )

                student = db.query(models.Student).filter_by(
                    identity_key=identity_key
                ).first()

                if not student:
                    student = models.Student(
                        full_name=student_data.get("full_name"),
                        email=student_data.get("email"),
                        phone=student_data.get("phone"),
                        identity_key=identity_key,
                    )
                    db.add(student)
                    db.commit()
                    db.refresh(student)

                test_data = event.get("test", {})

                test = models.Test(
                    name=test_data.get("name"),
                    max_marks=test_data.get("max_marks"),
                    negative_marking=test_data.get("negative_marking"),
                )
                db.add(test)
                db.commit()
                db.refresh(test)

                def parse_ts(value):
                    if not value:
                        return None
                    try:
                        return datetime.fromisoformat(value.replace("Z", ""))
                    except:
                        return None

                started_at = parse_ts(event.get("started_at"))
                submitted_at = parse_ts(event.get("submitted_at"))

                attempt = models.Attempt(
                    student_id=student.id,
                    test_id=test.id,
                    source_event_id=event.get("source_event_id"),
                    started_at=started_at,
                    submitted_at=submitted_at,
                    answers=event.get("answers"),
                    raw_payload=event,
                    status="INGESTED",
                )

                db.add(attempt)
                db.commit()
                db.refresh(attempt)

                existing_attempts = db.query(models.Attempt).filter(
                    models.Attempt.student_id == student.id,
                    models.Attempt.test_id == test.id,
                    models.Attempt.id != attempt.id,
                ).all()

                duplicate = find_duplicate_attempt(attempt, existing_attempts)

                if duplicate:
                    attempt.status = "DEDUPED"
                    attempt.duplicate_of_attempt_id = duplicate.id
                    dedup_logger.info(
                        "Duplicate detected",
                        extra={
                            "context": {"attempt_id": str(attempt.id)},
                            "extra": {"duplicate_of": str(duplicate.id)},
                        },
                    )
                else:
                    attempt.status = "SCORED"

                db.commit()

                correct, wrong, skipped, accuracy, net_correct, score, explanation = compute_score(
                    attempt.answers or {}, test.negative_marking or {}
                )

                attempt_score = models.AttemptScore(
                    attempt_id=attempt.id,
                    correct=correct,
                    wrong=wrong,
                    skipped=skipped,
                    accuracy=accuracy,
                    net_correct=net_correct,
                    score=score,
                    explanation=explanation,
                )

                db.add(attempt_score)
                db.commit()

                scoring_logger.info(
                    "Scoring completed",
                    extra={
                        "context": {"attempt_id": str(attempt.id)},
                        "extra": {"score": score},
                    },
                )

            except Exception:
                db.rollback()
                continue

        return {"message": "JSON loaded successfully"}

    finally:
        db.close()


# -----------------------
# LIST ATTEMPTS
# -----------------------
@app.get("/api/attempts")
def list_attempts(
    test_id: UUID | None = None,
    student_id: UUID | None = None,
    status: str | None = None,
    has_duplicates: bool | None = None,
    search: str | None = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
):
    db = SessionLocal()

    try:
        
        query = (
            db.query(models.Attempt, models.Student, models.Test)
            .join(models.Student, models.Attempt.student_id == models.Student.id)
            .join(models.Test, models.Attempt.test_id == models.Test.id)
        )

        # -----------------------
        # Filters
        # -----------------------

        if test_id:
            query = query.filter(models.Attempt.test_id == test_id)

        if student_id:
            query = query.filter(models.Attempt.student_id == student_id)

        if status:
            query = query.filter(models.Attempt.status == status)

        if has_duplicates is not None:
            if has_duplicates:
                query = query.filter(
                    models.Attempt.duplicate_of_attempt_id.isnot(None)
                )
            else:
                query = query.filter(
                    models.Attempt.duplicate_of_attempt_id.is_(None)
                )

        if search:
            query = query.filter(
                models.Student.full_name.ilike(f"%{search}%")
            )

        total = query.count()
        attempts = query.offset(offset).limit(limit).all()

        results = []

        for attempt, student, test in attempts:
            score = db.query(models.AttemptScore).filter_by(
                attempt_id=attempt.id
            ).first()

            results.append({
                "attempt_id": str(attempt.id),
                "student_id": str(student.id),
                "student_name": student.full_name,
                "test_id": str(test.id),
                "test_name": test.name,
                "status": attempt.status,
                "score": score.score if score else None,
                "duplicate_of_attempt_id": str(attempt.duplicate_of_attempt_id)
                if attempt.duplicate_of_attempt_id
                else None,
            })

        return {"total": total, "data": results}

    finally:
        db.close()


# -----------------------
# ATTEMPT DETAIL
# -----------------------
@app.get("/api/attempts/{attempt_id}")
def get_attempt_detail(attempt_id: UUID):
    db = SessionLocal()

    try:
        attempt = db.query(models.Attempt).filter_by(id=attempt_id).first()

        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")

        student = db.query(models.Student).filter_by(id=attempt.student_id).first()
        test = db.query(models.Test).filter_by(id=attempt.test_id).first()
        score = db.query(models.AttemptScore).filter_by(attempt_id=attempt.id).first()

        return {
            "attempt_id": str(attempt.id),
            "student_name": student.full_name if student else None,
            "student_email": student.email if student else None,
            "test_name": test.name if test else None,
            "status": attempt.status,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "duplicate_of_attempt_id": str(attempt.duplicate_of_attempt_id) if attempt.duplicate_of_attempt_id else None,
            "raw_payload": attempt.raw_payload,
            "score": score.score if score else None,
            "correct": score.correct if score else None,
            "wrong": score.wrong if score else None,
            "skipped": score.skipped if score else None,
            "accuracy": score.accuracy if score else None,
            "net_correct": score.net_correct if score else None,
        }

    finally:
        db.close()





# -----------------------
# LEADERBOARD
# -----------------------
@app.get("/api/leaderboard")
def leaderboard(test_id: UUID):
    db = SessionLocal()

    try:
        attempts = db.query(models.Attempt).filter(
            models.Attempt.test_id == test_id,
            models.Attempt.status == "SCORED",
        ).all()

        student_best = {}

        for attempt in attempts:
            score = db.query(models.AttemptScore).filter_by(
                attempt_id=attempt.id
            ).first()

            if not score:
                continue

            sid = str(attempt.student_id)

            if sid not in student_best or score.score > student_best[sid]["score"].score:
                student_best[sid] = {"attempt": attempt, "score": score}

        leaderboard_data = []

        for sid, data in student_best.items():
            student = db.query(models.Student).filter_by(
                id=data["attempt"].student_id
            ).first()

            leaderboard_data.append(
                {
                    "student_id": sid,
                    "student_name": student.full_name,
                    "score": data["score"].score,
                    "accuracy": data["score"].accuracy,
                    "net_correct": data["score"].net_correct,
                    "submitted_at": data["attempt"].submitted_at,
                }
            )

        leaderboard_data.sort(
            key=lambda x: (
                -x["score"],
                -x["accuracy"],
                -x["net_correct"],
                x["submitted_at"] or datetime.max,
            )
        )

        for i, entry in enumerate(leaderboard_data, start=1):
            entry["rank"] = i

        return leaderboard_data

    finally:
        db.close()


# -----------------------
# TESTS API
# -----------------------
@app.get("/api/tests")
def list_tests():
    db = SessionLocal()
    try:
        tests = db.query(models.Test).all()
        return [
            {
                "test_id": str(t.id),
                "name": t.name,
                "max_marks": t.max_marks,
            }
            for t in tests
        ]
    finally:
        db.close()


# -----------------------
# STUDENTS API
# -----------------------
@app.get("/api/students")
def list_students():
    db = SessionLocal()
    try:
        students = db.query(models.Student).all()
        return [
            {
                "student_id": str(s.id),
                "name": s.full_name,
                "email": s.email,
            }
            for s in students
        ]
    finally:
        db.close()


# -----------------------
# FLAGS LIST
# -----------------------
@app.get("/api/flags")
def list_flags():
    db = SessionLocal()

    try:
        flags = db.query(models.Flag).all()

        results = []

        for flag in flags:
            attempt = db.query(models.Attempt).filter_by(
                id=flag.attempt_id
            ).first()

            if not attempt:
                continue

            student = db.query(models.Student).filter_by(
                id=attempt.student_id
            ).first()

            test = db.query(models.Test).filter_by(
                id=attempt.test_id
            ).first()

            results.append({
                "flag_id": str(flag.id),
                "attempt_id": str(flag.attempt_id),
                "student_name": student.full_name if student else "Unknown",
                "test_name": test.name if test else "Unknown",
                "reason": flag.reason,
                "created_at": flag.created_at
            })

        return results

    finally:
        db.close()




        # ////////////////////////////////////////

@app.post("/api/attempts/{attempt_id}/recompute")
def recompute_attempt(attempt_id: UUID):
    db = SessionLocal()

    try:
        attempt = db.query(models.Attempt).filter_by(id=attempt_id).first()
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")

        test = db.query(models.Test).filter_by(id=attempt.test_id).first()
        score = db.query(models.AttemptScore).filter_by(
            attempt_id=attempt.id
        ).first()

        correct, wrong, skipped, accuracy, net_correct, new_score, explanation = compute_score(
            attempt.answers or {},
            test.negative_marking or {},
        )

        score.correct = correct
        score.wrong = wrong
        score.skipped = skipped
        score.accuracy = accuracy
        score.net_correct = net_correct
        score.score = new_score
        score.explanation = explanation
        score.computed_at = datetime.utcnow()

        attempt.status = "SCORED"

        db.commit()

        return {"message": "Recomputed successfully"}

    finally:
        db.close()



