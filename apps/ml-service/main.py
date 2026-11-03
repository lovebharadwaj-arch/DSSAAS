import os
from typing import Any, Literal

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from service.csv_corrector.corrector import correct_csv
from service.csv_corrector.csv_checker import check_csv
from service.csv_corrector.exporter import export_csv
from service.csv_corrector.type_inference import infer_schema
from service.distribution_service import DistributionRequest, analyze_distribution
from service.ml_training_service import train_model

app = FastAPI(title="DSSAAS ML Service")

allowed_origins = (
    os.getenv("ML_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 10 * 1024 * 1024


@app.get("/")
def root():
    return {"service": "ml-service", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "ml-service"}


@app.post("/analyze/distribution")
def distribution_endpoint(request: DistributionRequest):
    return analyze_distribution(request)


@app.post("/api/files/correct-csv")
async def correct_csv_endpoint(
    file: UploadFile = File(...),
    trim_whitespace: bool = Form(True),
    standardize_text: bool = Form(False),
    remove_duplicates: bool = Form(True),
    missing_strategy: str = Form("none"),
):
    allowed_extensions = (".csv", ".tsv", ".txt")

    if not file.filename or not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="Only CSV, TSV and TXT files are supported.",
        )

    if missing_strategy not in {"none", "empty", "mean", "median", "mode"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid missing-value strategy.",
        )

    try:
        content = await file.read(MAX_FILE_SIZE + 1)

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Maximum file size is 10 MB.",
            )

        if not content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        df, report = await run_in_threadpool(
            correct_csv,
            content,
            trim_whitespace=trim_whitespace,
            remove_duplicates=remove_duplicates,
        )

        changes = []

        if trim_whitespace:
            changes.append({"operation": "trim_whitespace", "status": "applied"})

        if standardize_text:
            import re

            for column in df.columns:
                df[column] = df[column].map(
                    lambda value: re.sub(r"\s+", " ", value).strip()
                    if isinstance(value, str)
                    else value
                )

            changes.append({"operation": "standardize_text", "status": "applied"})

        if missing_strategy != "none":
            from service.csv_corrector.missing_values import apply_missing_strategies

            schema = infer_schema(df)
            strategies = {}

            for column, details in schema.items():
                inferred_type = details["inferred_type"]

                if missing_strategy in {"mean", "median"}:
                    if inferred_type not in {"integer", "float"}:
                        continue

                strategies[column] = {
                    "action": (
                        "constant" if missing_strategy == "empty"
                        else missing_strategy
                    ),
                    "value": "",
                }

            df, actions = await run_in_threadpool(
                apply_missing_strategies,
                df,
                strategies,
            )

            changes.append(
                {
                    "operation": "missing_values",
                    "strategy": missing_strategy,
                    "values_filled": sum(
                        action["affected"]
                        for action in actions
                        if action["action"] != "keep"
                    ),
                }
            )

        duplicate_operation = next(
            (
                operation
                for operation in report["operations"]
                if operation["operation"] == "handle_duplicates"
            ),
            {},
        )

        duplicates_removed = int(duplicate_operation.get("duplicate_rows_removed", 0))
        missing_remaining = int(df.isna().sum().sum())
        delimiter = report["input"]["delimiter"]
        corrected_csv = export_csv(df, delimiter=delimiter).decode("utf-8")

        summary = {
            "original_rows": int(report["input"]["rows"]),
            "corrected_rows": int(len(df)),
            "columns": int(len(df.columns)),
            "duplicates_removed": duplicates_removed,
            "missing_values_remaining": missing_remaining,
        }

        changes.append({
            "operation": "duplicate_handling",
            "duplicates_removed": duplicates_removed,
        })
        changes.append({
            "operation": "missing_value_check",
            "missing_values_remaining": missing_remaining,
        })

        return {
            "filename": file.filename,
            "valid": bool(report["validation"]["valid"]),
            "summary": summary,
            "changes": changes,
            "corrected_csv": corrected_csv,
        }

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="CSV correction failed.",
        ) from exc
    finally:
        await file.close()


@app.post("/api/files/check-csv")
async def check_csv_endpoint(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith((".csv", ".tsv", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV, TSV and TXT files are supported.",
        )

    try:
        content = await file.read(MAX_FILE_SIZE + 1)

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Maximum file size is 10 MB.",
            )

        if not content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        return await run_in_threadpool(check_csv, content)

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    finally:
        await file.close()


class TrainingRequest(BaseModel):
    rows: list[dict[str, Any]] = Field(min_length=10)
    target_column: str
    task: Literal["classification", "regression"]
    test_size: float = Field(default=0.2, ge=0.1, le=0.4)
    artifact_path: str | None = None


class PredictRequest(BaseModel):
    model_path: str
    input_data: dict[str, Any]


@app.post("/models/train")
def train_ml_model(request: TrainingRequest):
    try:
        return train_model(
            rows=request.rows,
            target_column=request.target_column,
            task=request.task,
            test_size=request.test_size,
            artifact_path=request.artifact_path,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/models/predict")
def predict_ml_model(request: PredictRequest):
    try:
        return predict_model(
            model_path=request.model_path,
            input_data=request.input_data,
        )
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
