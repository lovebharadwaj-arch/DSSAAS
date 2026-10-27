from datetime import datetime, timezone
import pandas as pd

def build_report(
    original: pd.DataFrame,
    corrected: pd.DataFrame,
    schema_before: dict,
    schema_after: dict,
    validation: dict,
    operations: list[dict],
    reader_metadata: dict,
) -> dict:
    return {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "valid": validation["valid"],
        "input": {
            **reader_metadata,
            "rows": int(len(original)),
            "columns": int(len(original.columns)),
            "column_names": [str(c) for c in original.columns],
        },
        "output": {
            "rows": int(len(corrected)),
            "columns": int(len(corrected.columns)),
            "column_names": [str(c) for c in corrected.columns],
        },
        "schema_before": schema_before,
        "schema_after": schema_after,
        "validation": validation,
        "operations": operations,
    }
