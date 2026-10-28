"""Small local retrieval layer using TF-IDF similarity."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Iterable

@dataclass
class KnowledgeDocument:
    title: str
    text: str
    source: str = "local"

class KnowledgeBase:
    def __init__(self, documents: Iterable[KnowledgeDocument] | None = None):
        self.documents = list(documents or [])
        self._vectorizer = None
        self._matrix = None
        self._fit()

    def add(self, title: str, text: str, source: str = "local") -> None:
        self.documents.append(KnowledgeDocument(title, text, source))
        self._fit()

    def _fit(self) -> None:
        if not self.documents:
            self._vectorizer, self._matrix = None, None
            return
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            self._vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
            self._matrix = self._vectorizer.fit_transform(
                [f"{d.title}. {d.text}" for d in self.documents]
            )
        except ValueError:
            self._vectorizer, self._matrix = None, None

    def search(self, query: str, top_k: int = 3) -> list[dict]:
        if not self.documents or self._vectorizer is None or self._matrix is None:
            return []
        from sklearn.metrics.pairwise import cosine_similarity
        query_vector = self._vectorizer.transform([query])
        scores = cosine_similarity(query_vector, self._matrix).ravel()
        indexes = scores.argsort()[::-1][:max(0, top_k)]
        return [
            {"title": self.documents[i].title, "text": self.documents[i].text,
             "source": self.documents[i].source, "score": round(float(scores[i]), 4)}
            for i in indexes if scores[i] > 0
        ]
