import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

const uploadDirectory = path.join(process.cwd(), "uploads", "datasets");

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_req, _file, callback) => {
    callback(null, `${randomUUID()}.csv`);
  },
});

const multerUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension !== ".csv") {
      callback(new Error("Only CSV files are allowed."));
      return;
    }

    callback(null, true);
  },
});

export function uploadCsv(
  req: Parameters<typeof multerUpload.single>[0] extends never
    ? never
    : import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
): void {
  multerUpload.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "CSV file must not exceed 10 MB."
            : "Invalid upload. Upload only one CSV file.",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "CSV upload failed.",
    });
  });
}
