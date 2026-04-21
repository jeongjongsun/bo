/**
 * 폼 검증 유틸. 등록/수정 모달 공통.
 */

/**
 * 한국 전화번호 표준 형식 검사.
 * - 숫자만 추출 후 9~11자리, 0으로 시작
 * - 허용 예: 010-1234-5678, 02-123-4567, 031-123-4567, 01012345678
 */
export function isPhoneFormat(value: string | null | undefined): boolean {
  if (value == null) return true;
  const s = String(value).trim();
  if (s === '') return true;
  const digits = s.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 11) return false;
  return digits.startsWith('0');
}
