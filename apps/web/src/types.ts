export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokenResponse {
  token: string;
  user?: User;
}

export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignupForm {
  username: string;
  email: string;
  password: string;
  cnf_password: string;
}

export interface ColumnProfile {
  name: string;
  dataType: string;
  missingCount: number;
  uniqueCount: number;
  statistics?: Record<string, unknown>;
}

export interface DatasetProfile {
  datasetId: string;
  rowCount: number;
  columnCount: number;
  duplicateCount: number;
  columns: ColumnProfile[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileApiResponse extends ApiResponse<DatasetProfile> {}

export interface DatasetPreviewRow {
  [key: string]: string | null;
}

export interface DatasetPreviewData {
  datasetId: string;
  columns: string[];
  rows: DatasetPreviewRow[];
  rowCount: number;
  limit: number;
  hasMore: boolean;
}

export interface PreviewResponse extends ApiResponse<DatasetPreviewData> {}

export interface FeatureItem {
  title: string;
  description: string;
  icon: string;
}

export interface HeroStat {
  label: string;
  value: string;
}
