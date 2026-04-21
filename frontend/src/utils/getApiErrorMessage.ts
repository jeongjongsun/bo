/**
 * API 호출 실패 시 사용자에게 보여줄 메시지 추출.
 * - 서버가 보낸 message가 있으면 우선 사용 (문자열 키가 아니면 그대로, 키면 t()로 번역).
 * - 없으면 code로 error.{code} 번역, 최종 fallback은 Error.message 또는 fallback.
 */
type TFunction = (key: string) => string;

function isMessageKey(msg: string): boolean {
  return /^[a-z0-9_.]+$/i.test(msg) && msg.includes('.');
}

export function getApiErrorMessage(
  err: unknown,
  fallback: string,
  t?: TFunction,
): string {
  const withResponse = err as {
    response?: { data?: { message?: string; code?: string } };
    message?: string;
  };
  const data = withResponse?.response?.data;
  const message = data?.message;
  const code = data?.code;

  if (message && message.trim()) {
    if (isMessageKey(message) && t) {
      const translated = t(message);
      if (translated !== message) return translated;
    } else {
      return message;
    }
  }
  if (t && code) {
    const translated = t(`error.${code}`);
    if (translated !== `error.${code}`) return translated;
  }
  const fallbackMessage = err instanceof Error ? err.message : null;
  // API에서 throw new Error(data.message) 한 경우 err.message에 키가 들어올 수 있음 → 번역 시도
  if (fallbackMessage && fallbackMessage.trim() && isMessageKey(fallbackMessage) && t) {
    const translated = t(fallbackMessage);
    if (translated !== fallbackMessage) return translated;
  }
  return fallbackMessage ?? fallback;
}
