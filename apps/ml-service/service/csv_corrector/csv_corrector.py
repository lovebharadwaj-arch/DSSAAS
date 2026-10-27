
import re
import pandas as pd

from .csv_reader import read_csv_file


def clean_column_name(name: str) -> str:
    name = str(name).strip().lower()
    name = re.sub(r"\s+", "_", name)
    name = re.sub(r"[^a-z0-9_]", "", name)
    return name or "unnamed_column"


def correct_csv(
    content: bytes,
    delimiter: str | None = None,
    has_header: bool = True,
    trim_whitespace: bool = True,
    normalize_columns: bool = True,
    remove_duplicates: bool = False,
):
    df, detected_delimiter, encoding = read_csv_file(
        content,
        delimiter=delimiter,
        has_header=has_header,
    )

    original_rows = len(df)
    original_columns = len(df.columns)

    # Generate names for files without headers.
    if not has_header:
        df.columns = [
            f"column_{i + 1}" for i in range(len(df.columns))
        ]

    # Replace blank column names and optionally normalize them.
    if normalize_columns:
        df.columns = [clean_column_name(c) for c in df.columns]

        # Ensure column names remain unique.
        counts = {}
        unique_columns = []

        for column in df.columns:
            counts[column] = counts.get(column, 0) + 1
            unique_columns.append(
                column if counts[column] == 1
                else f"{column}_{counts[column]}"
            )

        df.columns = unique_columns

    # Trim surrounding spaces from text values.
    if trim_whitespace:
        for column in df.columns:
            df[column] = df[column].map(
                lambda value: value.strip()
                if isinstance(value, str) else value
            )

    # Detect common missing-value representations.
    missing_tokens = {"", "na", "n/a", "null", "none"}
    missing_count = 0

    for column in df.columns:
        mask = df[column].map(
            lambda value: isinstance(value, str)
            and value.strip().lower() in missing_tokens
        )
        missing_count += int(mask.sum())
        df.loc[mask, column] = pd.NA

    # Optionally remove fully duplicated rows.
    duplicate_count = int(df.duplicated().sum())

    if remove_duplicates:
        df = df.drop_duplicates().reset_index(drop=True)

    report = {
        "valid": True,
        "encoding_detected": encoding,
        "delimiter_detected": (
            "TAB" if detected_delimiter == "\t"
            else detected_delimiter
        ),
        "header_present": has_header,
        "original_rows": original_rows,
        "corrected_rows": len(df),
        "original_columns": original_columns,
        "corrected_columns": len(df.columns),
        "column_names": [str(c) for c in df.columns],
        "missing_values_detected": missing_count,
        "duplicate_rows_detected": duplicate_count,
        "duplicate_rows_removed": (
            original_rows - missing_count * 0
            - len(df) if remove_duplicates else 0
        ),
        "corrections": [
            "Trimmed whitespace" if trim_whitespace else None,
            "Normalized column names" if normalize_columns else None,
            "Normalized common missing-value tokens",
            "Removed duplicate rows" if remove_duplicates else None,
        ],
    }

    report["corrections"] = [
        item for item in report["corrections"] if item
    ]

    return df, report, detected_delimiter
