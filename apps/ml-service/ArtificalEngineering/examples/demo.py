from ai import DSSAASAssistant, KnowledgeBase, ServiceRegistry

knowledge = KnowledgeBase()
knowledge.add("CSV Corrector", "The CSV Corrector checks column names, detects missing values, finds duplicate rows, and prepares a cleaning report.")
knowledge.add("Model training", "Choose a dataset, select a target column, choose a supported algorithm, and train a model. Evaluate it using held-out data.")

services = ServiceRegistry()
services.register("list_datasets", lambda organization_id=None: {"datasets": [], "organization_id": organization_id},
                  "List datasets available to the current organization")
assistant = DSSAASAssistant(knowledge, services)

print(assistant.respond("hello"))
print(assistant.respond("How does CSV Corrector work?"))
print(assistant.respond("show my datasets", service_args={"organization_id": "demo-org"}))
