import pandas as pd

def normalize_text(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()

    for column in result.columns:
        result[column] = result[column].map(
            lambda value: value.strip()
            if isinstance(value, str) else value
        )

    return result


def normalize_dates(
    df: pd.DataFrame,
    date_formats: dict[str, str],
    output_format: str = "%Y-%m-%d",
) -> tuple[pd.DataFrame, list[dict]]:
    result = df.copy()
    issues = []

    for column, input_format in date_formats.items():
        if column not in result.columns:
            raise ValueError(f"Unknown date column: {column}")

        original = result[column]
        present = original.notna() & original.astype(str).str.strip().ne("")

        parsed = pd.to_datetime(
            original,
            format=input_format,
            errors="coerce",
        )

        invalid = present & parsed.isna()

        result[column] = parsed.dt.strftime(output_format).astype("string")
        result.loc[parsed.isna(), column] = original[parsed.isna()]

        if invalid.any():
            issues.append({
                "column": column,
                "issue": "invalid_date",
                "count": int(invalid.sum()),
            })

    return result, issues
