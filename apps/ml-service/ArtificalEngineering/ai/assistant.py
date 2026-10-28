"""DSSAAS assistant combining intent detection, retrieval, and service orchestration."""
from __future__ import annotations
from .intent_classifier import IntentClassifier
from .knowledge_base import KnowledgeBase
from .orchestrator import ServiceOrchestrator
from .service_registry import ServiceRegistry

class DSSAASAssistant:
    def __init__(self, knowledge_base: KnowledgeBase | None = None,
                 service_registry: ServiceRegistry | None = None):
        self.intent_classifier = IntentClassifier()
        self.knowledge_base = knowledge_base or KnowledgeBase()
        self.service_registry = service_registry or ServiceRegistry()
        self.orchestrator = ServiceOrchestrator(self.service_registry)

    def respond(self, message: str, *, service_args: dict | None = None) -> dict:
        """Return a structured answer. service_args must come from trusted app context."""
        detected = self.intent_classifier.classify(message)
        base = {"intent": detected.intent, "confidence": detected.confidence,
                "entities": detected.entities}
        if detected.intent == "greeting":
            return {**base, "answer": "Hello! I can help you explore datasets, clean data, analyze results, and train models in DSSAAS."}
        if detected.intent == "help":
            return {**base, "answer": "I can answer DSSAAS questions, retrieve product guidance, and call configured dataset or model services."}
        if detected.intent in ServiceOrchestrator.INTENT_TO_SERVICE:
            execution = self.orchestrator.execute_for_intent(detected.intent, **(service_args or {}))
            return {**base, "execution": execution,
                    "answer": "The requested service was processed." if execution.get("executed") else
                              "This action is not configured yet. Connect the relevant DSSAAS service first."}
        matches = self.knowledge_base.search(message, top_k=3)
        if matches:
            return {**base, "answer": "Here is the most relevant guidance available in the DSSAAS knowledge base.",
                    "sources": matches}
        return {**base, "answer": "I couldn't find a confident answer in the current DSSAAS knowledge base. Add relevant documentation or configure a language model to improve responses."}
