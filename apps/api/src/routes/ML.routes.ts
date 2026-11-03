import { Router } from "express";
import { trainPythonModel } from "../services/ML.Service.ts";

const router = Router();

router.post("/train", async (req, res) => {
  try {
    const { rows, targetColumn, task, testSize } = req.body ?? {};

    if (!Array.isArray(rows) || rows.length < 10) {
      return res.status(400).json({
        message: "Training data must be a rows array with at least 10 records.",
      });
    }

    if (typeof targetColumn !== "string" || !targetColumn.trim()) {
      return res.status(400).json({
        message: "A valid target column is required.",
      });
    }

    if (task !== "classification" && task !== "regression") {
      return res.status(400).json({
        message: "Task must be classification or regression.",
      });
    }

    const numericTestSize = Number(testSize ?? 0.2);

    if (
      !Number.isFinite(numericTestSize) ||
      numericTestSize < 0.1 ||
      numericTestSize > 0.4
    ) {
      return res.status(400).json({
        message: "Test size must be between 0.1 and 0.4.",
      });
    }

    const result = await trainPythonModel({
      rows,
      target_column: targetColumn,
      task,
      test_size: numericTestSize,
    });

    return res.status(200).json({
      message: "Model training completed.",
      result,
    });
  } catch (error) {
    console.error("ML training route error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to start model training.";

    return res.status(502).json({
      message,
    });
  }
});

export default router;
