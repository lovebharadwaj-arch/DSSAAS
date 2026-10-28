"""Maps detected intents to explicitly registered DSSAAS service functions."""
from __future__ import annotations
from .service_registry import ServiceRegistry

class ServiceOrchestrator:
    INTENT_TO_SERVICE = {
        "dataset_list": "list_datasets",
        "data_cleaning": "clean_dataset",
        "data_analysis": "analyze_dataset",
        "model_training": "train_model",
        "prediction": "predict",
    }

    def __init__(self, registry: ServiceRegistry):
        self.registry = registry

    def execute_for_intent(self, intent: str, **kwargs) -> dict:
        service_name = self.INTENT_TO_SERVICE.get(intent)
        if not service_name:
            return {"executed": False, "reason": "no_service_for_intent"}
        if not self.registry.has(service_name):
            return {"executed": False, "reason": "service_not_configured", "service": service_name}
        try:
            result = self.registry.call(service_name, **kwargs)
            return {"executed": True, "service": service_name, "result": result}
        except Exception as exc:
            # Avoid returning stack traces or secrets to end users.
            return {"executed": False, "service": service_name,
                    "error": f"Service failed ({type(exc).__name__}). Check API logs."}
