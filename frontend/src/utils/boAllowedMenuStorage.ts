const STORAGE_KEY = 'shopeasy.bo.allowedMenuIds.v1';

export function persistBoAllowedMenuIds(ids: string[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* private mode / quota */
  }
}

export function clearBoAllowedMenuIds(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** 세션 스토리지에 없으면 null (호출부에서 /auth/me 값으로 대체). */
export function readBoAllowedMenuIdsFromSession(): string[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.map((v) => String(v));
  } catch {
    return null;
  }
}
