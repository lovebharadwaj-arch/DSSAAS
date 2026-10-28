import { Router } from "express";
import { trainPythonModel } from "../services/ML.Service.tsx";

const router = Router();

// Connect your existing authentication middleware here.
// Example: router.post("/train", authenticate, async (req, res) => {

router.post("/train", async (req, res) => {
  try {
    const { datasetId, targetColumn, task, testSize } = req.body;

    if (
      typeof datasetId !== "string" ||
      !datasetId.trim() ||
      typeof targetColumn !== "string" ||
      !targetColumn.trim() ||
      !["classification", "regression"].includes(task)
    ) {
      return res.status(400).json({
        message: "Invalid dataset or model configuration.",
      });
    }

    // IMPORTANT:
    // Replace this with your existing PostgreSQL dataset lookup
    // and CSV reader. Verify that the authenticated user belongs
    // to the organization that owns this dataset.
    //
    // Expected result:
    // const rows = await getAuthorizedDatasetRows(
    //   req.user.id,
    //   req.user.organizationId,
    //   datasetId
    // );

    return res.status(501).json({
      message:
        "Connect the existing authorized dataset reader before training.",
      datasetId,
      targetColumn,
      task,
      testSize: testSize ?? 0.2,
    });
  } catch (error) {
    console.error("ML training route error:", error);

    return res.status(500).json({
      message: "Unable to start model training.",
    });
  }
});

export default router;
