
from collections import Counter
import math
from typing import Any, Literal

import numpy as np
from pydantic import BaseModel, Field


class DistributionRequest(BaseModel):
    column_name: str = Field(min_length=1, max_length=255)
    data_type: Literal["number", "boolean", "string", "unknown"]
    values: list[Any] = Field(max_length=100_000)
    bins: int = Field(default=10, ge=5, le=50)


def analyze_distribution(request: DistributionRequest) -> dict:
    values = request.values

    missing_count = sum(
        value is None
        or (isinstance(value, str) and not value.strip())
        for value in values
    )

    non_missing = [
        value
        for value in values
        if value is not None
        and not (isinstance(value, str) and not value.strip())
    ]

    if request.data_type == "number":
        numbers = []

        for value in non_missing:
            # Python treats booleans as integers, so exclude them.
            if isinstance(value, bool):
                continue

            try:
                number = float(value)
                if math.isfinite(number):
                    numbers.append(number)
            except (ValueError, TypeError):
                continue

        if not numbers:
            return {
                "columnName": request.column_name,
                "dataType": "number",
                "rowCount": len(values),
                "missingCount": missing_count,
                "validCount": 0,
                "invalidCount": len(non_missing),
                "histogram": [],
                "statistics": None,
                "outliers": None,
            }

        array = np.asarray(numbers, dtype=float)

        counts, edges = np.histogram(array, bins=request.bins)
        q1, median, q3 = np.percentile(array, [25, 50, 75])

        iqr = float(q3 - q1)
        lower_bound = float(q1 - 1.5 * iqr)
        upper_bound = float(q3 + 1.5 * iqr)

        outlier_count = int(
            np.sum((array < lower_bound) | (array > upper_bound))
        )

        histogram = [
            {
                "from": float(edges[index]),
                "to": float(edges[index + 1]),
                "count": int(counts[index]),
            }
            for index in range(len(counts))
        ]

        return {
            "columnName": request.column_name,
            "dataType": "number",
            "rowCount": len(values),
            "missingCount": missing_count,
            "validCount": len(numbers),
            "invalidCount": len(non_missing) - len(numbers),
            "histogram": histogram,
            "statistics": {
                "min": float(np.min(array)),
                "max": float(np.max(array)),
                "mean": float(np.mean(array)),
                "median": float(median),
                "q1": float(q1),
                "q3": float(q3),
            },
            "outliers": {
                "count": outlier_count,
                "lowerBound": lower_bound,
                "upperBound": upper_bound,
            },
        }

    frequencies = Counter(str(value) for value in non_missing)

    return {
        "columnName": request.column_name,
        "dataType": (
            "boolean" if request.data_type == "boolean" else "categorical"
        ),
        "rowCount": len(values),
        "missingCount": missing_count,
        "validCount": len(non_missing),
        "uniqueCount": len(frequencies),
        "topValues": [
            {"value": value, "count": count}
            for value, count in frequencies.most_common(20)
        ],
    }
