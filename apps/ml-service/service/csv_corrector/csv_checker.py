
import csv
import io

import pandas as pd


def check_csv(content: bytes) -> dict:
    errors = []
    warnings = []

    # Check that the file is not empty
    if not content:
        return {
            "valid": False,
            "errors": ["The file is empty."],
            "warnings": [],
        }

    # Decode the file
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return {
            "valid": False,
            "errors": [
                "Unsupported encoding. Please upload a UTF-8 CSV."
            ],
            "warnings": [],
        }

    # Check CSV structure and header
    try:
        reader = csv.reader(io.StringIO(text), strict=True)
        rows = list(reader)
    except csv.Error as exc:
        return {
            "valid": False,
            "errors": [f"Malformed CSV: {exc}"],
            "warnings": [],
        }

    if not rows:
        return {
            "valid": False,
            "errors": ["The CSV has no rows."],
            "warnings": [],
        }

    headers = [header.strip() for header in rows[0]]

    if not any(headers):
        errors.append("The CSV header row is empty.")

    if any(not header for header in headers):
        errors.append("One or more column names are empty.")

    normalized = [header.casefold() for header in headers if header]
    if len(normalized) != len(set(normalized)):
        errors.append("Duplicate column names were found.")

    # Check whether data rows have the same number of columns
    expected_columns = len(headers)
    bad_rows = [
        index
        for index, row in enumerate(rows[1:], start=2)
        if len(row) != expected_columns
    ]

    if bad_rows:
        errors.append(
            f"{len(bad_rows)} row(s) have an incorrect number "
            "of columns. First affected line: "
            f"{bad_rows[0]}."
        )

    if errors:
        return {
            "valid": False,
            "errors": errors,
            "warnings": warnings,
        }

    # Analyze data only after structural checks pass
    try:
        df = pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")
    except (pd.errors.ParserError, pd.errors.EmptyDataError, ValueError) as exc:
        return {
            "valid": False,
            "errors": [f"Unable to parse CSV data: {exc}"],
            "warnings": [],
        }

    if df.empty:
        warnings.append("The CSV contains headers but no data rows.")

    if df.isnull().values.any():
        warnings.append("Missing values were found.")

    if df.duplicated().any():
        warnings.append("Duplicate data rows were found.")

    return {
        "valid": True,
        "errors": [],
        "warnings": warnings,
        "summary": {
            "rows": int(len(df)),
            "columns": int(len(df.columns)),
            "column_names": df.columns.tolist(),
            "missing_values": int(df.isnull().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum()),
        },
    }
