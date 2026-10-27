
from io import BytesIO

import pandas as pd


def inspect_csv(content: bytes) -> dict:
    try:
        df = pd.read_csv(BytesIO(content), encoding="utf-8-sig")
    except (pd.errors.ParserError, pd.errors.EmptyDataError, ValueError) as exc:
        raise ValueError(f"Could not read CSV: {exc}") from exc

    if len(df.columns) == 0:
        raise ValueError("The CSV must contain column headers.")

    if len(df.columns) != len(set(df.columns)):
        raise ValueError("Duplicate column names are not supported.")

    columns = []

    for name in df.columns:
        series = df[name]
        dtype = str(series.dtype)

        if pd.api.types.is_numeric_dtype(series):
            kind = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(series):
            kind = "datetime"
        else:
            kind = "categorical"

        columns.append({
            "name": str(name),
            "dtype": dtype,
            "kind": kind,
            "missing_values": int(series.isna().sum()),
            "unique_values": int(series.nunique()),
        })

    preview = df.head(5).where(pd.notna(df.head(5)), None)

    return {
        "rows": int(len(df)),
        "column_count": int(len(df.columns)),
        "columns": columns,
        "preview": preview.to_dict(orient="records"),
    }
