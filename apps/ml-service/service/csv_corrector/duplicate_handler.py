

import pandas as pd


def handle_duplicates(
    df: pd.DataFrame,
    remove: bool = False,
    subset: list[str] | None = None,
    keep: str = "first",
) -> tuple[pd.DataFrame, dict]:
    if keep not in {"first", "last", False}:
        raise ValueError("keep must be 'first', 'last', or False")

    if subset:
        unknown = set(subset) - set(df.columns)
        if unknown:
            raise ValueError(f"Unknown columns: {sorted(unknown)}")

    duplicate_mask = df.duplicated(subset=subset, keep=False)
    duplicate_count = int(df.duplicated(subset=subset).sum())

    result = (
        df.drop_duplicates(subset=subset, keep=keep).reset_index(drop=True)
        if remove else df.copy()
    )

    return result, {
        "duplicate_rows_in_groups": int(duplicate_mask.sum()),
        "duplicate_rows_removable": duplicate_count,
        "duplicate_rows_removed": len(df) - len(result),
    }
