import mongoose, { Schema, Document, Model } from "mongoose";

export interface IColumnProfile {
  name: string;
  dataType: string;
  missingCount: number;
  uniqueCount: number;
  statistics?: Record<string, unknown>;
}

export interface IDatasetProfile extends Document {
  datasetId: string;
  organizationId: string;
  rowCount: number;
  columnCount: number;
  duplicateCount: number;
  columns: IColumnProfile[];
  createdAt: Date;
  updatedAt: Date;
}

const ColumnProfileSchema = new Schema<IColumnProfile>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dataType: {
      type: String,
      required: true,
    },
    missingCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    uniqueCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    statistics: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

const DatasetProfileSchema = new Schema<IDatasetProfile>(
  {
    datasetId: {
      type: String,
      required: true,
    },
    organizationId: {
      type: String,
      required: true,
    },
    rowCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    columnCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    duplicateCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    columns: {
      type: [ColumnProfileSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// A dataset has one current profile per organization.
DatasetProfileSchema.index(
  { organizationId: 1, datasetId: 1 },
  { unique: true },
);

const DatasetProfile: Model<IDatasetProfile> =
  (mongoose.models.DatasetProfile as Model<IDatasetProfile>) ||
  mongoose.model<IDatasetProfile>("DatasetProfile", DatasetProfileSchema);

export default DatasetProfile;
