"""Allow-list for application functions the assistant may invoke."""
from __future__ import annotations
from collections.abc import Callable

class ServiceRegistry:
    def __init__(self):
        self._services: dict[str, Callable] = {}
        self._descriptions: dict[str, str] = {}

    def register(self, name: str, function: Callable, description: str = "") -> None:
        if not name or not name.replace("_", "").isalnum():
            raise ValueError("Service names may contain only letters, numbers, and underscores.")
        if not callable(function):
            raise TypeError("function must be callable")
        self._services[name] = function
        self._descriptions[name] = description

    def describe(self) -> list[dict[str, str]]:
        return [{"name": name, "description": self._descriptions[name]}
                for name in sorted(self._services)]

    def call(self, name: str, **kwargs):
        if name not in self._services:
            raise KeyError(f"Service is not registered: {name}")
        return self._services[name](**kwargs)

    def has(self, name: str) -> bool:
        return name in self._services
