"""Delivery tests. No network — email path is exercised via compose + dry-run."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import delivery  # noqa: E402

MD = "# Briefing\n\nBody text.\n"


def test_console_delivery(capsys=None):
    res = delivery.deliver(MD, method="console")
    assert res["status"] == "printed"


def test_compose_email_shape():
    msg = delivery.compose_email(MD, "Subj", "from@x.com", ["a@x.com", "b@x.com"])
    assert msg["Subject"] == "Subj"
    assert msg["From"] == "from@x.com"
    assert msg["To"] == "a@x.com, b@x.com"
    assert "Body text." in msg.get_content()


def test_email_dry_run_when_unconfigured():
    # Ensure SMTP env is absent.
    for k in ["SMTP_HOST", "REPORT_FROM", "REPORT_TO"]:
        os.environ.pop(k, None)
    res = delivery.deliver(MD, method="email")
    assert res["status"] == "dry_run"      # never raises, never sends


def test_unknown_method_raises():
    raised = False
    try:
        delivery.deliver(MD, method="carrier-pigeon")
    except ValueError:
        raised = True
    assert raised


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
