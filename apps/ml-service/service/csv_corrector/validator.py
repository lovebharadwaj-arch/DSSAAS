import pandas as pd

def validate_dataframe(
    df: pd.DataFrame,
    required_columns: list[str] | None = None,
    required_fields: list[str] | None = None,
) -> dict:
    errors = []
    warnings = []

    if df.shape[1] == 0:
        errors.append("The dataset contains no columns.")

    if len(df) == 0:
        warnings.append("The dataset contains no data rows.")

    names = [str(column) for column in df.columns]

    if any(not name.strip() for name in names):
        errors.append("One or more column names are empty.")

    if len(names) != len(set(names)):
        errors.append("Column names are not unique.")

    missing_columns = sorted(
        set(required_columns or []) - set(names)
    )

    if missing_columns:
        errors.append({
            "issue": "required_columns_missing",
            "columns": missing_columns,
        })

    required_fields = required_fields or []
    unknown_fields = sorted(set(required_fields) - set(names))

    if unknown_fields:
        errors.append({
            "issue": "required_fields_unknown",
            "columns": unknown_fields,
        })

    missing_by_field = {}

    for column in required_fields:
        if column not in df.columns:
            continue

        values = df[column]
        missing = values.isna() | values.astype(str).str.strip().eq("")

        count = int(missing.sum())

        if count:
            missing_by_field[column] = count

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "required_field_violations": missing_by_field,
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
    }
