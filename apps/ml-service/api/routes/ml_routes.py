
from fastapi import APIRouter, HTTPException

from schemas.ml_schema import LinearRegressionRequest

from services.ml_service import MLService

router = APIRouter();



@router.post("/linear-regression/train")
async def train_linear_regression(request: LinearRegressionRequest):

    try:
        result = MLService.train_linear_regression(
            data=request.data,
            target_column=request.target_column,
            test_size=request.test_size
        )

        return {
            "success": True,
            "algorithm": "linear_regression",
            "result": result
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
