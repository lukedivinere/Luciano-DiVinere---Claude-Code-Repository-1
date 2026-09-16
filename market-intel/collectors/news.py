"""News collector with relevance scoring.

Adapted from the reference repo's `news_service.py`. Pulls headlines from
yfinance's `.news` and scores each for relevance to the ticker using a
transparent keyword model: company-specific terms and market catalysts add
points; noise (gaming, gossip, crime) and low-signal terms subtract; trusted
financial sources get a bonus. Only items scoring at/above a threshold are
kept, deduped by title.

The live fetch needs Yahoo (blocked in some sandboxed environments), but the
scoring logic is pure and fully unit-tested offline.

This collector reports news only — it makes no recommendations.
"""

from __future__ import annotations

from datetime import datetime, timezone

import yfinance as yf

# --- Keyword taxonomies -----------------------------------------------------
COMPANY_TERMS = {
    "AAPL": ["apple", "aapl", "iphone", "ipad", "mac", "app store", "tim cook"],
    "MSFT": ["microsoft", "msft", "azure", "windows", "copilot", "satya nadella", "office"],
    "NVDA": ["nvidia", "nvda", "gpu", "cuda", "datacenter", "h100", "blackwell", "jensen huang"],
    "AMZN": ["amazon", "amzn", "aws", "prime", "alexa", "andy jassy"],
    "GOOGL": ["google", "googl", "alphabet", "youtube", "gemini", "sundar pichai", "waymo"],
    "META": ["meta", "facebook", "instagram", "whatsapp", "mark zuckerberg", "threads"],
    "TSLA": ["tesla", "tsla", "ev", "deliveries", "gigafactory", "autopilot", "robotaxi", "elon musk"],
    "AMD": ["amd", "advanced micro devices", "ryzen", "radeon", "epyc", "lisa su"],
    "AVGO": ["broadcom", "avgo", "semiconductor", "vmware", "hock tan"],
    "NFLX": ["netflix", "nflx", "streaming", "subscribers", "ted sarandos"],
    "CRM": ["salesforce", "crm", "marc benioff", "slack"],
    "INTC": ["intel", "intc", "foundry", "core ultra"],
    "PLTR": ["palantir", "pltr", "alex karp", "gotham", "foundry"],
    "MU": ["micron", "mu", "dram", "nand", "memory chip", "hbm"],
    "MRNA": ["moderna", "mrna", "mrna vaccine", "cancer vaccine", "oncology", "spikevax", "clinical trial"],
    "PFE": ["pfizer", "pfe", "vaccine", "comirnaty", "fda", "clinical trial", "drug"],
    "LLY": ["eli lilly", "lly", "zepbound", "mounjaro", "weight loss", "glp-1", "obesity drug"],
    "JNJ": ["johnson & johnson", "jnj", "j&j", "medtech", "pharmaceutical"],
    "JPM": ["jpmorgan", "jpm", "jamie dimon", "bank", "investment banking"],
    "BAC": ["bank of america", "bac", "brian moynihan", "bank"],
    "XOM": ["exxon", "xom", "exxonmobil", "oil", "crude", "refining"],
    "CVX": ["chevron", "cvx", "oil", "crude", "natural gas"],
    "F": ["ford", "f", "f-150", "lightning", "ev truck", "jim farley"],
    "T": ["at&t", "att", "telecom", "wireless", "fiber", "5g"],
    "KO": ["coca-cola", "coke", "ko", "beverage"],
    "DIS": ["disney", "dis", "bob iger", "streaming", "disney+", "parks", "espn"],
    "SOFI": ["sofi", "sofi technologies", "fintech", "anthony noto", "student loan"],
    # Current holdings
    "HOOD": ["robinhood", "hood", "brokerage", "crypto trading", "vlad tenev", "trading app"],
    "UBER": ["uber", "uber technologies", "rideshare", "dara khosrowshahi", "delivery", "eats", "robotaxi"],
    "ACHR": ["archer", "archer aviation", "achr", "evtol", "air taxi", "midnight", "united airlines"],
    "RKLB": ["rocket lab", "rklb", "electron", "neutron", "launch", "peter beck", "space"],
    "ENPH": ["enphase", "enph", "solar", "microinverter", "battery", "residential solar"],
    "NNOX": ["nano-x", "nnox", "nanox", "medical imaging", "fda clearance", "x-ray"],
    "IBIT": ["bitcoin", "ibit", "btc", "crypto", "etf inflows", "spot bitcoin"],
}

MARKET_CATALYST_TERMS = [
    "earnings", "revenue", "guidance", "forecast", "analyst", "upgrade", "downgrade",
    "price target", "margin", "sales", "demand", "shipment", "deliveries",
    "launch", "product launch", "quarter", "q1", "q2", "q3", "q4",
    "ban", "export", "tariff", "regulation", "lawsuit", "approval",
    "partnership", "acquisition", "merger", "buyback", "dividend", "outlook",
    "interest rate", "fed", "inflation", "layoff", "restructuring",
    "beat", "miss", "eps", "guidance raise", "guidance cut", "short squeeze",
]

LOW_SIGNAL_TERMS = [
    "release date", "game", "gaming", "walkthrough", "how to", "tips",
    "best apps", "vs", "comparison", "rumor", "wishlist",
]

NEGATIVE_NOISE_KEYWORDS = [
    "murder", "crime", "killed", "arrested", "celebrity", "gossip",
    "shooting", "scandal",
]

TRUSTED_SOURCES = {
    "Reuters", "Bloomberg", "CNBC", "MarketWatch", "Yahoo Finance",
    "The Wall Street Journal", "Barron's", "Financial Times", "Associated Press",
    "Seeking Alpha", "Investor's Business Daily", "Benzinga",
}

# Items must reach this score to be surfaced.
RELEVANCE_THRESHOLD = 5


def score_article(symbol: str, article: dict) -> int:
    """Transparent, rules-based relevance score for one article."""
    title = (article.get("title") or "").lower()
    desc = (article.get("description") or "").lower()
    source = (article.get("source") or "").strip()
    text = f"{title} {desc}"

    score = 0

    company_hits = 0
    for term in COMPANY_TERMS.get(symbol.upper(), [symbol.lower()]):
        if term in text:
            company_hits += 1
            score += 2

    catalyst_hits = 0
    for term in MARKET_CATALYST_TERMS:
        if term in text:
            catalyst_hits += 1
            score += 3

    for term in LOW_SIGNAL_TERMS:
        if term in text:
            score -= 3

    for term in NEGATIVE_NOISE_KEYWORDS:
        if term in text:
            score -= 5

    score += 3 if source in TRUSTED_SOURCES else -1

    if company_hits > 0 and catalyst_hits == 0:
        score -= 2
    if company_hits == 0 and catalyst_hits == 0:
        score -= 5

    return score


def _normalize_raw_item(item: dict) -> dict:
    """Flatten one yfinance news entry into a common article shape."""
    content = item.get("content") or item

    title = (content.get("title") or "").strip()

    source = (
        (content.get("provider") or {}).get("displayName")
        if isinstance(content.get("provider"), dict)
        else None
    ) or content.get("publisher") or "Yahoo Finance"

    pub_time = content.get("pubDate") or content.get("published_at") or ""
    published_at = pub_time[:10] if pub_time else datetime.now(timezone.utc).strftime("%Y-%m-%d")

    summary = (
        content.get("summary")
        or content.get("description")
        or content.get("snippet")
        or ""
    )

    url = ""
    canonical = content.get("canonicalUrl")
    if isinstance(canonical, dict):
        url = canonical.get("url", "")
    elif isinstance(canonical, str):
        url = canonical

    return {
        "title": title,
        "description": summary,
        "source": source,
        "published_at": published_at,
        "url": url,
    }


def rank_articles(symbol: str, raw_news: list, max_items: int = 5) -> list[dict]:
    """Normalize, score, dedupe, filter, and rank raw yfinance news.

    Pure function (no network) — the unit-testable core of the collector.
    """
    cleaned = []
    seen_titles = set()

    for item in raw_news or []:
        article = _normalize_raw_item(item)
        if not article["title"]:
            continue

        key = article["title"].lower()
        if key in seen_titles:
            continue
        seen_titles.add(key)

        article["relevance_score"] = score_article(symbol, article)
        cleaned.append(article)

    cleaned.sort(key=lambda a: (a["relevance_score"], a["published_at"]), reverse=True)
    filtered = [a for a in cleaned if a["relevance_score"] >= RELEVANCE_THRESHOLD]
    return filtered[:max_items]


def get_news(symbol: str, max_items: int = 5) -> list[dict]:
    """Fetch and rank recent news for a ticker (live; needs Yahoo access)."""
    try:
        raw_news = yf.Ticker(symbol.upper()).news
    except Exception:
        return []
    return rank_articles(symbol, raw_news, max_items=max_items)


def _main(argv: list[str]) -> int:
    import json

    import config

    symbols = argv or config.TICKERS
    out = {sym.upper(): get_news(sym) for sym in symbols}
    print(json.dumps(out, indent=2))
    total = sum(len(v) for v in out.values())
    print(f"\nCollected {total} relevant item(s) across {len(out)} ticker(s).")
    return 0


if __name__ == "__main__":
    import sys

    raise SystemExit(_main(sys.argv[1:]))
