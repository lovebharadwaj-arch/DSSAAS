import type { Request, Response } from "express";
import { z } from "zod";
import { getColumnDistribution } from "../services/columnDistribution.service.ts";

const paramsSchema = z.object({
  organizationId: z.string().uuid(),
  datasetId: z.string().uuid(),
});

const bodySchema = z.object({
  columnName: z.string().trim().min(1).max(255),
  bins: z.number().int().min(5).max(50).optional().default(10),
});

export async function columnDistributionHandler(req: Request, res: Response) {
  const params = paramsSchema.safeParse(req.params);
  const body = bodySchema.safeParse(req.body);

  if (!params.success || !body.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid dataset, organization, or request parameters.",
    });
  }

  try {
    const distribution = await getColumnDistribution(
      params.data.organizationId,
      params.data.datasetId,
      body.data.columnName,
      body.data.bins,
    );

    return res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DATASET_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Dataset not found.",
        });
      }

      if (error.message === "COLUMN_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Column not found in this dataset.",
        });
      }

      if (error.message === "EMPTY_CSV" || error.message === "INVALID_CSV") {
        return res.status(400).json({
          success: false,
          message: "The CSV file is empty or invalid.",
        });
      }

      if (error.message === "TOO_MANY_ROWS") {
        return res.status(413).json({
          success: false,
          message: "This endpoint currently supports up to 100,000 rows.",
        });
      }

      if (error.name === "TimeoutError" || error.name === "AbortError") {
        return res.status(504).json({
          success: false,
          message: "The analytics service timed out.",
        });
      }
    }

    console.error("Column distribution error:", error);

    return res.status(502).json({
      success: false,
      message: "Unable to calculate column distribution.",
    });
  }
}
