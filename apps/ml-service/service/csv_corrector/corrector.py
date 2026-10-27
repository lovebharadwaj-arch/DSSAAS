


import pandas as pd

from .csv_reader import read_csv_file
from .validator import validate_dataframe
from .type_inference import infer_schema, convert_column_types
from .missing_values import (
    normalize_missing_values,
    apply_missing_strategies,
)
from .format_normalizer import normalize_text, normalize_dates
from .duplicate_handler import handle_duplicates
from .report import build_report


def correct_csv(
    content: bytes,
    *,
    delimiter: str | None = None,
    has_header: bool = True,
    encoding: str | None = None,
    normalize_column_names: bool = True,
    trim_whitespace: bool = True,
    missing_tokens: list[str] | None = None,
    missing_strategies: dict | None = None,
    date_formats: dict[str, str] | None = None,
    remove_duplicates: bool = False,
    duplicate_subset: list[str] | None = None,
    convert_types: bool = False,
    convert_columns: list[str] | None = None,
    required_columns: list[str] | None = None,
    required_fields: list[str] | None = None,
) -> tuple[pd.DataFrame, dict]:
    df, reader_metadata = read_csv_file(
        content,
        delimiter=delimiter,
        has_header=has_header,
        encoding=encoding,
    )

    original = df.copy(deep=True)
    operations = []

    # Headerless input receives stable generated names.
    if not has_header:
        df.columns = [
            f"column_{index + 1}"
            for index in range(len(df.columns))
        ]

    if normalize_column_names:
        def normalize_name(name):
            import re

            name = str(name).strip().lower()
            name = re.sub(r"\s+", "_", name)
            name = re.sub(r"[^a-z0-9_]", "", name)
            return name or "unnamed_column"

        names = []
        counts = {}

        for column in df.columns:
            name = normalize_name(column)
            counts[name] = counts.get(name, 0) + 1

            names.append(
                name if counts[name] == 1
                else f"{name}_{counts[name]}"
            )

        df.columns = names
        operations.append({"operation": "normalize_column_names"})

    if trim_whitespace:
        df = normalize_text(df)
        operations.append({"operation": "trim_whitespace"})

    # Detect and standardize missing-value tokens.
    df, missing_report = normalize_missing_values(
        df, tokens=missing_tokens
    )
    operations.append({
        "operation": "normalize_missing_values",
        **missing_report,
    })

    # Apply explicitly requested date formats.
    if date_formats:
        df, date_issues = normalize_dates(df, date_formats)
        operations.append({
            "operation": "normalize_dates",
            "issues": date_issues,
        })

    # Infer the schema before optional type conversion.
    schema_before = infer_schema(df)

    if convert_types:
        df, type_issues = convert_column_types(
            df,
            schema_before,
            selected_columns=convert_columns,
        )
        operations.append({
            "operation": "convert_types",
            "issues": type_issues,
        })

    # Missing-value strategies are explicit and opt-in.
    if missing_strategies:
        df, missing_actions = apply_missing_strategies(
            df, missing_strategies
        )
        operations.append({
            "operation": "apply_missing_strategies",
            "actions": missing_actions,
        })

    df, duplicate_report = handle_duplicates(
        df,
        remove=remove_duplicates,
        subset=duplicate_subset,
    )
    operations.append({
        "operation": "handle_duplicates",
        **duplicate_report,
    })

    schema_after = infer_schema(df)

    validation = validate_dataframe(
        df,
        required_columns=required_columns,
        required_fields=required_fields,
    )

    report = build_report(
        original=original,
        corrected=df,
        schema_before=schema_before,
        schema_after=schema_after,
        validation=validation,
        operations=operations,
        reader_metadata=reader_metadata,
    )

    return df, report
