import DatasetProfile, { IColumnProfile } from "../models/DatasetProfile.ts";

export interface SaveDatasetProfileInput {
  datasetId: string;
  organizationId: string;
  rowCount: number;
  columnCount: number;
  duplicateCount: number;
  columns: IColumnProfile[];
}

export async function saveDatasetProfile(input: SaveDatasetProfileInput) {
  const profile = await DatasetProfile.findOneAndUpdate(
    {
      organizationId: input.organizationId,
      datasetId: input.datasetId,
    },
    {
      $set: {
        rowCount: input.rowCount,
        columnCount: input.columnCount,
        duplicateCount: input.duplicateCount,
        columns: input.columns,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return profile;
}

export async function getDatasetProfile(
  organizationId: string,
  datasetId: string,
) {
  return DatasetProfile.findOne({
    organizationId,
    datasetId,
  }).lean();
}

export async function deleteDatasetProfile(
  organizationId: string,
  datasetId: string,
) {
  const result = await DatasetProfile.deleteOne({
    organizationId,
    datasetId,
  });

  return result.deletedCount > 0;
}
