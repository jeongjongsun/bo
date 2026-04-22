import { isAxiosError } from 'axios';
import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

async function parseErrorBlob(blob: Blob): Promise<{ message?: string; code?: string } | null> {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === 'object') {
      const o = parsed as Record<string, unknown>;
      const message = typeof o.message === 'string' ? o.message : undefined;
      const code = typeof o.code === 'string' ? o.code : undefined;
      return { message, code };
    }
  } catch {
    /* not JSON */
  }
  return null;
}

export interface CodeManageRow {
  rowType: 'MAIN' | 'DETAIL';
  mainCd: string;
  subCd: string;
  codeNmKo: string;
  codeNmEn: string;
  useYn: string;
  dispSeq: number | null;
  etc1: string;
  etc2: string;
  createdAt: string | null;
}

export type CodeGridEditableField = 'codeNmKo' | 'codeNmEn' | 'useYn' | 'dispSeq' | 'etc1' | 'etc2';

export async function fetchCodeGroups(keyword?: string): Promise<CodeManageRow[]> {
  const { data } = await apiClient.get<ApiResponse<CodeManageRow[]>>('/codes/manage/groups', {
    params: { keyword: keyword?.trim() || undefined },
  });
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load code groups');
  return data.data;
}

export async function fetchCodeDetails(mainCd: string): Promise<CodeManageRow[]> {
  const { data } = await apiClient.get<ApiResponse<CodeManageRow[]>>('/codes/manage/details', {
    params: { mainCd },
  });
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load code details');
  return data.data;
}

export async function fetchCodeRow(mainCd: string, subCd: string): Promise<CodeManageRow> {
  const { data } = await apiClient.get<ApiResponse<CodeManageRow>>('/codes/manage/row', {
    params: { mainCd, subCd },
  });
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load code');
  return data.data;
}

export async function updateCodeField(params: {
  mainCd: string;
  subCd: string;
  field: CodeGridEditableField;
  value: unknown;
}): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>('/codes/manage/field', params);
  if (!data.success) throw new Error(data.message || 'Update failed');
}

export interface CodeDetailUpdateBody {
  mainCd: string;
  subCd: string;
  codeNmKo: string;
  codeNmEn: string;
  useYn: string;
  dispSeq: number | null;
  etc1: string;
  etc2: string;
}

export async function updateCodeDetail(body: CodeDetailUpdateBody): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>('/codes/manage/detail', body);
  if (!data.success) throw new Error(data.message || 'Update failed');
}

export interface CodeGroupRegisterBody {
  subCd: string;
  codeNmKo?: string;
  codeNmEn?: string;
  useYn?: string;
  dispSeq?: number | null;
}

export async function registerCodeGroup(body: CodeGroupRegisterBody): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<null>>('/codes/manage/group', body);
  if (!data.success) throw new Error(data.message || 'Register failed');
}

export interface CodeChildRegisterBody {
  parentMainCd: string;
  subCd: string;
  codeNmKo?: string;
  codeNmEn?: string;
  useYn?: string;
  dispSeq?: number | null;
}

export async function registerCodeChild(body: CodeChildRegisterBody): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<null>>('/codes/manage/child', body);
  if (!data.success) throw new Error(data.message || 'Register failed');
}

export async function downloadCodesExport(keyword?: string): Promise<void> {
  try {
    const { data } = await apiClient.get<Blob>('/codes/manage/export', {
      params: { keyword: keyword?.trim() || undefined },
      responseType: 'blob',
    });

    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'codes_export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      if (objectUrl !== null) {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl!), 300);
      }
    }
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.data instanceof Blob) {
      const status = err.response.status;
      const parsed = await parseErrorBlob(err.response.data);
      const fromBody = parsed?.message?.trim();
      const statusPart = status != null && status > 0 ? ` (${status})` : '';
      const msg =
        fromBody ||
        (parsed?.code ? `${parsed.code}${statusPart}` : null) ||
        (status != null && status > 0 ? `HTTP ${status}` : null) ||
        err.message;
      throw new Error(msg);
    }
    throw err;
  }
}
