def compute_score(answers, config):
    correct = sum(1 for a in answers.values() if a == "A")
    wrong = sum(1 for a in answers.values() if a == "B")
    skipped = sum(1 for a in answers.values() if a == "SKIP")

    accuracy = int((correct / (correct + wrong)) * 100) if correct + wrong else 0
    net_correct = correct - wrong

    score = (
        correct * config["correct"] +
        wrong * config["wrong"] +
        skipped * config["skip"]
    )

    explanation = {
        "config": config,
        "counts": {
            "correct": correct,
            "wrong": wrong,
            "skipped": skipped
        }
    }

    return correct, wrong, skipped, accuracy, net_correct, score, explanation
