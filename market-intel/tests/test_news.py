"""Tests for the news collector's scoring/ranking. No network."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collectors import news  # noqa: E402


def test_relevant_article_scores_high():
    article = {
        "title": "Nvidia beats Q3 earnings, raises guidance",
        "description": "Analyst upgrade follows strong datacenter demand",
        "source": "Reuters",
    }
    score = news.score_article("NVDA", article)
    # Company hits + multiple catalysts + trusted source => comfortably above threshold.
    assert score >= news.RELEVANCE_THRESHOLD


def test_noise_article_scores_low():
    article = {
        "title": "Best gaming apps and walkthrough tips",
        "description": "how to guide, rumor roundup",
        "source": "SomeBlog",
    }
    score = news.score_article("NVDA", article)
    assert score < news.RELEVANCE_THRESHOLD


def test_company_without_catalyst_penalized():
    only_company = {"title": "Apple iPhone photo of the day", "description": "",
                    "source": "SomeBlog"}
    with_catalyst = {"title": "Apple iPhone sales beat estimates", "description": "",
                     "source": "SomeBlog"}
    assert news.score_article("AAPL", with_catalyst) > news.score_article("AAPL", only_company)


def test_rank_dedupes_and_filters():
    raw = [
        {"content": {"title": "NVDA beats earnings, analyst upgrade",
                     "provider": {"displayName": "Reuters"},
                     "pubDate": "2024-01-02T00:00:00Z", "summary": "revenue beat"}},
        # Duplicate title -> dropped.
        {"content": {"title": "NVDA beats earnings, analyst upgrade",
                     "provider": {"displayName": "Reuters"},
                     "pubDate": "2024-01-02T00:00:00Z", "summary": "revenue beat"}},
        # Pure noise -> filtered out by threshold.
        {"content": {"title": "celebrity gossip roundup",
                     "publisher": "TabloidDaily", "pubDate": "2024-01-02T00:00:00Z"}},
    ]
    ranked = news.rank_articles("NVDA", raw, max_items=5)
    assert len(ranked) == 1
    assert ranked[0]["source"] == "Reuters"
    assert ranked[0]["published_at"] == "2024-01-02"
    assert ranked[0]["relevance_score"] >= news.RELEVANCE_THRESHOLD


def test_empty_input_is_safe():
    assert news.rank_articles("AAPL", []) == []
    assert news.rank_articles("AAPL", None) == []


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
