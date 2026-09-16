"""Report delivery (build plan step 6).

Three channels, chosen by `method`:
  - "console": print the Markdown (default; always works).
  - "file":    already handled by report.save_report; included for symmetry.
  - "email":   send via SMTP using env-provided settings.

Email is safe-by-default: if SMTP settings are missing it does NOT raise and
does NOT send — it returns a "dry_run" result and logs what it would have
done. This keeps a scheduled run from failing just because creds aren't set,
and lets the compose step be unit-tested without a network.

Secrets come from the environment (see .env.example); they are never logged.
"""

from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from typing import Optional


def compose_email(markdown: str, subject: str, sender: str, recipients: list[str]) -> EmailMessage:
    """Build a MIME email with the Markdown as the plain-text body.

    Pure/offline — no network. Unit-testable.
    """
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)
    msg.set_content(markdown)
    return msg


def _smtp_settings() -> Optional[dict]:
    """Read SMTP settings from env; return None if not fully configured."""
    host = os.environ.get("SMTP_HOST")
    sender = os.environ.get("REPORT_FROM")
    recipients = os.environ.get("REPORT_TO")
    if not (host and sender and recipients):
        return None
    return {
        "host": host,
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER"),
        "password": os.environ.get("SMTP_PASSWORD"),
        "sender": sender,
        "recipients": [r.strip() for r in recipients.split(",") if r.strip()],
        "use_tls": os.environ.get("SMTP_USE_TLS", "true").lower() != "false",
    }


def deliver(markdown: str, method: str = "console", *,
            subject: Optional[str] = None) -> dict:
    """Deliver the report. Returns a small result dict describing what happened."""
    subject = subject or "Daily Market Intelligence Briefing"

    if method == "console":
        print(markdown)
        return {"method": "console", "status": "printed"}

    if method == "file":
        # File writing lives in report.save_report; nothing to do here.
        return {"method": "file", "status": "noop", "note": "use report.save_report"}

    if method == "email":
        settings = _smtp_settings()
        if settings is None:
            # Safe default: don't fail the run, don't send.
            return {
                "method": "email",
                "status": "dry_run",
                "note": "SMTP not configured (set SMTP_HOST, REPORT_FROM, REPORT_TO)",
            }
        msg = compose_email(markdown, subject, settings["sender"], settings["recipients"])
        with smtplib.SMTP(settings["host"], settings["port"]) as smtp:
            if settings["use_tls"]:
                smtp.starttls()
            if settings["user"] and settings["password"]:
                smtp.login(settings["user"], settings["password"])
            smtp.send_message(msg)
        return {"method": "email", "status": "sent", "recipients": settings["recipients"]}

    raise ValueError(f"Unknown delivery method: {method!r}")
