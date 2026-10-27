
# service/csvCorrector/reader.py

import csv
from io import StringIO


import pandas as pd


SUPPORTED_DELIMITERS = {",", "\t", ";", "|"}


def read_csv_file(
    content: bytes,
    delimiter: str | None = None,
    has_header: bool = True,
    encoding: str | None = None,
) -> tuple[pd.DataFrame, dict]:
    if not content:
        raise ValueError("The uploaded file is empty.")

    if delimiter is not None and delimiter not in SUPPORTED_DELIMITERS:
        raise ValueError("Unsupported delimiter.")

    encodings = (
        [encoding] if encoding
        else ["utf-8-sig", "utf-8", "cp1252", "latin-1"]
    )

    errors = []

    for current_encoding in encodings:
        try:
            text = content.decode(current_encoding)

            detected_delimiter = delimiter

            if detected_delimiter is None:
                try:
                    detected_delimiter = csv.Sniffer().sniff(
                        text[:65536],
                        delimiters=",\t;|",
                    ).delimiter
                except csv.Error:
                    detected_delimiter = ","

            if detected_delimiter not in SUPPORTED_DELIMITERS:
                raise ValueError("Unsupported detected delimiter.")

            df = pd.read_csv(
                StringIO(text),
                sep=detected_delimiter,
                header=0 if has_header else None,
                dtype=str,
                keep_default_na=False,
                na_filter=False,
                skipinitialspace=False,
                on_bad_lines="error",
                engine="python",
            )

            if df.shape[1] == 0:
                raise ValueError("No columns were found.")

            return df, {
                "encoding": current_encoding,
                "delimiter": detected_delimiter,
                "has_header": has_header,
            }

        except (UnicodeDecodeError, pd.errors.ParserError, csv.Error,
                ValueError) as exc:
            errors.append(f"{current_encoding}: {exc}")

    raise ValueError(
        "Unable to read the CSV. " + " | ".join(errors)
    )
