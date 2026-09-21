"""Tests for the 'why it moved' explainer. No network — client is injected."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import explain  # noqa: E402


class _Block:
    def __init__(self, text):
        self.type = "text"
        self.text = text


class _Resp:
    def __init__(self, text):
        self.content = [_Block(text)]


class _FakeClient:
    def __init__(self, text="Shares rose after a strong earnings beat.", record=None):
        self._text = text
        self._record = record

    class _Messages:
        def __init__(self, outer):
            self._outer = outer

        def create(self, **kwargs):
            if self._outer._record is not None:
                self._outer._record.update(kwargs)
            return _Resp(self._outer._text)

    @property
    def messages(self):
        return _FakeClient._Messages(self)


NEWS = [{"title": "Company beats Q3 earnings, raises guidance", "source": "Reuters"}]


def test_generates_one_sentence_from_news():
    rec = {}
    client = _FakeClient("Likely up on the earnings beat and raised guidance.", record=rec)
    out = explain.generate("NVDA", 4.5, NEWS, client=client)
    assert out == "Likely up on the earnings beat and raised guidance."
    # The prompt includes the ticker, move, and the headline.
    prompt = rec["messages"][0]["content"]
    assert "NVDA" in prompt and "4.5%" in prompt and "beats Q3 earnings" in prompt


def test_no_news_returns_empty():
    assert explain.generate("NVDA", 4.5, [], client=_FakeClient()) == ""


def test_no_key_and_no_client_is_noop():
    os.environ.pop("ANTHROPIC_API_KEY", None)
    assert explain.generate("NVDA", 4.5, NEWS) == ""


def test_api_error_is_swallowed():
    class _Boom:
        @property
        def messages(self):
            raise RuntimeError("api down")
    assert explain.generate("NVDA", 4.5, NEWS, client=_Boom()) == ""


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
