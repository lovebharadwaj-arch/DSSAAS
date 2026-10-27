import pandas as pd

DEFAULT_MISSING_TOKENS = [
    "", "NA", "N/A", "NULL", "NONE", "NAN"
]

def normalize_missing_values(
    df: pd.DataFrame,
    tokens: list[str] | None = None,
) -> tuple[pd.DataFrame, dict]:
    result = df.copy()
    tokens = DEFAULT_MISSING_TOKENS if tokens is None else tokens
    normalized_tokens = {token.strip().casefold() for token in tokens}

    before = result.isna().sum().to_dict()

    for column in result.columns:
        values = result[column]

        mask = values.map(
            lambda value: isinstance(value, str)
            and value.strip().casefold() in normalized_tokens
        )

        result.loc[mask, column] = pd.NA

    after = result.isna().sum().to_dict()

    return result, {
        "missing_by_column": {
            str(column): int(count)
            for column, count in after.items()
        },
        "missing_detected": int(
            sum(after.values()) - sum(before.values())
        ),
        "missing_total": int(sum(after.values())),
    }


def apply_missing_strategies(
    df: pd.DataFrame,
    strategies: dict[str, dict],
) -> tuple[pd.DataFrame, list[dict]]:
    result = df.copy()
    actions = []

    for column, config in strategies.items():
        if column not in result.columns:
            raise ValueError(f"Unknown column: {column}")

        action = config.get("action", "keep")
        missing_count = int(result[column].isna().sum())

        if action == "keep" or missing_count == 0:
            actions.append({
                "column": column,
                "action": action,
                "affected": 0,
            })
            continue

        if action == "constant":
            result[column] = result[column].fillna(
                config.get("value", "")
            )

        elif action in {"mean", "median"}:
            numeric = pd.to_numeric(
                result[column], errors="coerce"
            )

            if action == "mean":
                fill_value = numeric.mean()
            else:
                fill_value = numeric.median()

            if pd.isna(fill_value):
                raise ValueError(
                    f"Cannot calculate {action} for {column}"
                )

            result[column] = numeric.fillna(fill_value)

        elif action == "mode":
            modes = result[column].mode(dropna=True)

            if modes.empty:
                raise ValueError(
                    f"Cannot calculate mode for {column}"
                )

            result[column] = result[column].fillna(modes.iloc[0])

        elif action == "drop_rows":
            result = result.dropna(subset=[column])

        else:
            raise ValueError(
                f"Unsupported missing-value action: {action}"
            )

        actions.append({
            "column": column,
            "action": action,
            "affected": missing_count,
        })

    return result.reset_index(drop=True), actions
