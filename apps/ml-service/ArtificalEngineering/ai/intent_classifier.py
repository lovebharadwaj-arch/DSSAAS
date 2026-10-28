"""Lightweight intent detection for the DSSAAS assistant."""
from __future__ import annotations
import re
from dataclasses import dataclass

@dataclass
class IntentResult:
    intent: str
    confidence: float
    entities: dict[str, str]

class IntentClassifier:
    """Rule-based baseline. Replace/extend with a trained classifier when data grows."""
    PATTERNS = [
        ("greeting", [r"\b(hi|hello|hey|good morning|good afternoon)\b"]),
        ("help", [r"\b(help|what can you do|how do i use)\b"]),
        ("dataset_list", [r"\b(list|show|find)\b.*\b(datasets|files|data files)\b", r"\bmy datasets\b"]),
        ("data_cleaning", [r"\b(clean|cleaning|fix|correct|deduplicate|missing values)\b.*\b(csv|data|dataset|file|values)?\b", r"\bcsv corrector\b"]),
        ("data_analysis", [r"\b(analy[sz]e|analysis|insights|statistics|distribution|correlation|profile)\b"]),
        ("model_training", [r"\b(train|training|build|fit)\b.*\b(model|ml|machine learning|classifier|regression|neural network)\b", r"\btrain (an? )?(ml|ai|neural|classification|regression)\b"]),
        ("prediction", [r"\b(predict|prediction|forecast|score this)\b"]),
        ("explain", [r"\b(explain|what is|describe|how does)\b.*\b(model|algorithm|metric|column|dataset|machine learning|ai)\b"]),
    ]

    def classify(self, text: str) -> IntentResult:
        value = (text or "").strip().lower()
        entities: dict[str, str] = {}
        quoted = re.search(r"['\"]([^'\"]+)['\"]", text or "")
        if quoted:
            entities["quoted_value"] = quoted.group(1)
        for intent, patterns in self.PATTERNS:
            if any(re.search(pattern, value, re.I) for pattern in patterns):
                return IntentResult(intent=intent, confidence=0.82, entities=entities)
        return IntentResult(intent="general_question", confidence=0.35, entities=entities)
