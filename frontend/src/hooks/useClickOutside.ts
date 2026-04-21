import { useEffect, type RefObject } from 'react';

/**
 * 요소 바깥 클릭 시 콜백 실행.
 * 드롭다운/팝오버 닫기 등에 사용.
 *
 * @param ref 감시할 요소 ref (바깥 클릭 판단 기준)
 * @param onOutside 바깥 클릭 시 호출할 함수
 * @param enabled true일 때만 리스너 등록 (보통 열림 상태)
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: () => void,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      onOutside();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onOutside, enabled]);
}
