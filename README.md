<!-- Student Assessment Analytics Platform  -->

This is a full-stack application designed to make sense of messy student test data. It ingests raw attempt logs, cleans up duplicates, calculates scores based on custom marking rules, and visualizes the results on a React dashboard.

<!-- My Approach -->

My goal was to build a system that is resilient to bad data and transparent in its logic. Here is how I broke it down:

1. The "Ingestion & Deduplication" Engine

Real-world data is noisy. Students double-submit, internet connections drop, and browsers retry requests. To handle this, I didn't just reject duplicates; I "soft-linked" them.

The Logic: I consider an attempt a "duplicate" if the same student submits the same test within 7 minutes of a previous attempt and their answers are more than 90% similar.

The Result: The system keeps the "master" attempt for scoring but retains the duplicates linked in the database for audit trails.

2. Dynamic Scoring

Hardcoding scoring logic is a trap. Instead, I designed the Test model to store its own marking scheme (e.g., +4 for correct, -1 for wrong) in a JSON column. The scoring engine reads this config for every attempt, making the system flexible enough to handle different exam types without code changes.

3. "Monolog" Structured Logging

Debugging distributed systems is a nightmare with plain text logs. I implemented Structured JSON Logging. Every log entry—whether it's an HTTP request, a database query, or a scoring event—is a JSON object containing a request_id, student_id, and channel. This makes the logs machine-readable and ready for tools like Datadog or ELK.

Tech Stack

Backend: Python (FastAPI) - Chosen for its speed and native async support.

Database: PostgreSQL - Used for robust relational data modeling.

Frontend: React (Vite) - A lightweight, fast dashboard to view analytics.

Infrastructure: Docker & Docker Compose - To ensure it runs everywhere.

<!-- Setup Instructions -->

Getting this running locally is designed to be painless.

Prerequisites

Docker & Docker Compose installed on your machine.

Step 1: Clone & Configure

Clone the repo and set up your environment variables.

Run the entire stack (Frontend, Backend, DB) with one command:

Bash
docker-compose up --build
Frontend: http://localhost:5173

Backend API: http://localhost:8000/docs

Step 3: Initialize the Database

Once the containers are running, you need to apply the schema migrations.

Bash
# Open a shell inside the backend container
docker-compose exec backend bash

# Run the migrations
alembic upgrade head
Step 4: Load Sample Data

I've included a script to load the attempt_events.json file so you don't have to start with an empty dashboard.

Bash
# Still inside the backend container...
python scripts/seed_data.py
Key Assumptions & Decisions
While building this, I had to make a few judgment calls on the requirements:

<!-- Assumptions -->

Assumption: Students might use john.doe@gmail.com one day and johndoe@gmail.com the next.

Decision: I normalize all emails by removing dots (for Gmail) and ignoring case. If no email exists, I fall back to a normalized phone number.

The "7-Minute" Rule:

Assumption: A true "retry" usually happens immediately after a failure.

Decision: I set the deduplication window to 7 minutes. Anything after that is treated as a genuine retake of the test.

Partial Submissions:

Assumption: Sometimes the input JSON is missing answers for certain questions.

Decision: The scoring engine treats missing keys as "Skipped" questions (0 marks) rather than crashing.

Frontend UX:

Decision: I prioritized functionality over flashiness. The UI is clean and functional, focusing on data visibility (Leaderboards, Recompute buttons, JSON inspectors) rather than complex animations.

Running Tests
To ensure the logic holds up, I wrote unit tests for the scoring and deduplication engines.
