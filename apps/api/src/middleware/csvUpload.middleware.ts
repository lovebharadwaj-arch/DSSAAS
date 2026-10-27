import multer from "multer";
import path from "node:path";

const maxFileSizeMb = Number(process.env.CSV_MAX_FILE_SIZE_MB ?? 10);

const allowedExtensions = new Set([".csv", ".tsv", ".txt"]);

export const csvUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024,
    files: 1,
    fields: 10,
    parts: 11,
  },

  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension)) {
      callback(new Error("Only CSV, TSV, and TXT files are supported."));
      return;
    }

    callback(null, true);
  },
});
