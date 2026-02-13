from datetime import timedelta


SIMILARITY_THRESHOLD = 0.92
TIME_WINDOW_MINUTES = 7


def calculate_similarity(answers1: dict, answers2: dict) -> float:
    """
    Returns similarity ratio between two answer dictionaries.
    """

    if not answers1 or not answers2:
        return 0.0

    common_questions = set(answers1.keys()).intersection(set(answers2.keys()))

    if not common_questions:
        return 0.0

    same_count = 0

    for q in common_questions:
        if answers1.get(q) == answers2.get(q):
            same_count += 1

    similarity = same_count / len(common_questions)

    return similarity


def is_within_time_window(time1, time2) -> bool:
    """
    Checks if two timestamps are within 7 minutes.
    """

    if not time1 or not time2:
        return False

    diff = abs(time1 - time2)

    return diff <= timedelta(minutes=TIME_WINDOW_MINUTES)


def find_duplicate_attempt(new_attempt, existing_attempts):
    """
    Returns canonical attempt if duplicate found.
    """

    for attempt in existing_attempts:

       
        if not is_within_time_window(new_attempt.started_at, attempt.started_at):
            continue

        
        similarity = calculate_similarity(
            new_attempt.answers,
            attempt.answers
        )

        if similarity >= SIMILARITY_THRESHOLD:
            return attempt  

    return None
