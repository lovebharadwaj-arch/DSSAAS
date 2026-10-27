
import re
import pandas as pd

INTEGER_RE = re.compile(r"^[+-]?\d+$")
FLOAT_RE = re.compile(r"^[+-]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?$")

TRUE_VALUES = {"true", "yes", "y"}
FALSE_VALUES = {"false", "no", "n"}


def infer_column_type(series: pd.Series) -> dict:
    values = series.dropna().astype(str).str.strip()
    values = values[values != ""]

    if values.empty:
        return {
            "inferred_type": "unknown",
            "confidence": 0.0,
            "non_missing_values": 0,
        }

    lower = values.str.lower()

    if lower.isin(TRUE_VALUES | FALSE_VALUES).all():
        return {
            "inferred_type": "boolean",
            "confidence": 1.0,
            "non_missing_values": len(values),
        }

    if values.map(lambda x: bool(INTEGER_RE.fullmatch(x))).all():
        # Preserve leading-zero identifiers as strings.
        has_leading_zeros = values.map(
            lambda x: bool(re.fullmatch(r"[+-]?0\d+", x))
        ).any()

        return {
            "inferred_type": (
                "string" if has_leading_zeros else "integer"
            ),
            "confidence": 1.0,
            "non_missing_values": len(values),
        }

    if values.map(lambda x: bool(FLOAT_RE.fullmatch(x))).all():
        return {
            "inferred_type": "float",
            "confidence": 1.0,
            "non_missing_values": len(values),
        }

    parsed_dates = pd.to_datetime(values, errors="coerce", format="mixed")
    date_ratio = float(parsed_dates.notna().mean())

    if date_ratio >= 0.95:
        return {
            "inferred_type": "date",
            "confidence": round(date_ratio, 3),
            "non_missing_values": len(values),
        }

    return {
        "inferred_type": "string",
        "confidence": 1.0,
        "non_missing_values": len(values),
    }


def infer_schema(df: pd.DataFrame) -> dict:
    return {
        str(column): infer_column_type(df[column])
        for column in df.columns
    }


def convert_column_types(
    df: pd.DataFrame,
    schema: dict,
    selected_columns: list[str] | None = None,
) -> tuple[pd.DataFrame, list[dict]]:
    """Convert only selected columns; report values that fail."""

    result = df.copy()
    issues = []

    columns = selected_columns or list(schema.keys())

    for column in columns:
        if column not in result.columns or column not in schema:
            continue

        kind = schema[column]["inferred_type"]
        original = result[column].copy()
        text = original.astype("string").str.strip()

        if kind == "integer":
            converted = pd.to_numeric(text, errors="coerce")
            invalid = original.notna() & converted.isna()
            fractional = converted.notna() & (converted % 1 != 0)
            invalid |= fractional

            result[column] = converted.mask(invalid).astype("Int64")

        elif kind == "float":
            converted = pd.to_numeric(text, errors="coerce")
            invalid = original.notna() & converted.isna()
            result[column] = converted.mask(invalid).astype("Float64")

        elif kind == "boolean":
            mapping = {
                "true": True, "yes": True, "y": True,
                "false": False, "no": False, "n": False,
            }
            converted = text.str.lower().map(mapping)
            invalid = original.notna() & converted.isna()
            result[column] = converted.astype("boolean")

        elif kind == "date":
            converted = pd.to_datetime(
                text, errors="coerce", format="mixed"
            )
            invalid = original.notna() & converted.isna()
            result[column] = converted

        else:
            continue

        invalid_count = int(invalid.sum())

        if invalid_count:
            issues.append({
                "column": column,
                "issue": "type_conversion_failed",
                "count": invalid_count,
            })

    return result, issues
