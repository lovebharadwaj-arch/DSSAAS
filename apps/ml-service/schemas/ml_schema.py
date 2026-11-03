
from pydantic import BaseModel, Field
from typing import Any


class LinearRegressionRequest(BaseModel):

    data: list[dict[str, Any]]

    target_column: str

    test_size: float = Field(
        default=0.2,
        gt=0,
        lt=1
    )
