/**
 * API 공통 타입. docs/03-부록-타입.md 규격.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  code: string;
}

export interface PagedData<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  sort?: { property: string; direction: 'ASC' | 'DESC' }[];
}

export type PagedResponse<T> = ApiResponse<PagedData<T>>;

export interface FieldError {
  field: string;
  message: string;
  rejectedValue?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  code: string;
  errors?: FieldError[] | null;
  timestamp?: string;
  path?: string;
}

export interface ListQueryParams {
  page?: number;
  size?: number;
  sort?: string;
}
