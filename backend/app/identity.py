import re


def normalize_email(email: str | None) -> str | None:
    if not email:
        return None

    email = email.strip().lower()

    # Gmail alias handling
    if "@gmail.com" in email:
        local, domain = email.split("@")

        # Remove anything after +
        if "+" in local:
            local = local.split("+")[0]

        # Remove dots in gmail local part
        local = local.replace(".", "")

        return f"{local}@{domain}"

    return email


def normalize_phone(phone: str | None) -> str | None:
    if not phone:
        return None

    # Keep only digits
    digits = re.sub(r"\D", "", phone)

    return digits if digits else None


def get_student_identity(email: str | None, phone: str | None) -> str | None:
    """
    Returns a normalized identity string.
    Email preferred. If no email, fallback to phone.
    """

    normalized_email = normalize_email(email)

    if normalized_email:
        return f"email:{normalized_email}"

    normalized_phone = normalize_phone(phone)

    if normalized_phone:
        return f"phone:{normalized_phone}"

    return None
