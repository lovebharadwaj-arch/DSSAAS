import pandas as pd

def export_csv(
    df: pd.DataFrame,
    delimiter: str = ",",
    include_header: bool = True,
    encoding: str = "utf-8",
) -> bytes:
    if delimiter not in {",", "\t", ";", "|"}:
        raise ValueError("Unsupported output delimiter.")

    text = df.to_csv(
        index=False,
        sep=delimiter,
        header=include_header,
        na_rep="",
        lineterminator="\n",
    )

    return text.encode(encoding)
