/**
 * 세트 구성품 선택용 검색 가능 셀렉트 (Choices.js).
 * options에서 excludeProductId를 제외한 상품 목록을 표시하며, value 변경 시 choices 동기화.
 */
import { useRef, useEffect, useId, useMemo } from 'react';
import Choices from 'choices.js';
import 'choices.js/public/assets/styles/choices.min.css';
import type { ProductListItem } from './types';

interface ProductChoicesSelectProps {
  value: string;
  onChange: (productId: string) => void;
  options: ProductListItem[];
  excludeProductId: string | null;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function ProductChoicesSelect({
  value,
  onChange,
  options,
  excludeProductId,
  placeholder = '',
  searchPlaceholder = '상품코드·상품명 검색',
  className = '',
}: ProductChoicesSelectProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const choicesRef = useRef<Choices | null>(null);
  const id = useId().replace(/:/g, '-');

  const list = useMemo(
    () => options.filter((p) => p.productId !== excludeProductId),
    [options, excludeProductId],
  );
  const choices = useMemo(
    () => [
      { value: '', label: placeholder },
      ...list.map((p) => ({ value: p.productId, label: `${p.productCd} - ${p.productNm}` })),
    ],
    [list, placeholder],
  );
  /** options 변경 시 choices 갱신을 위한 의존성 (목록 내용 변경 감지) */
  const optionIdsKey = list.map((p) => p.productId).join(',');

  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;

    const c = new Choices(el, {
      removeItemButton: true,
      placeholder: true,
      searchEnabled: true,
      searchPlaceholderValue: searchPlaceholder,
      itemSelectText: '',
    });
    choicesRef.current = c;

    c.setChoices(choices, 'value', 'label', true);
    if (value) c.setChoiceByValue(value);

    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ value: string }>;
      if (ev.detail?.value !== undefined) onChange(ev.detail.value);
    };
    el.addEventListener('change', handler);

    return () => {
      el.removeEventListener('change', handler);
      c.destroy();
      choicesRef.current = null;
    };
  }, [searchPlaceholder]);

  useEffect(() => {
    const c = choicesRef.current;
    if (!c) return;
    c.setChoices(choices, 'value', 'label', true);
    if (value) c.setChoiceByValue(value);
  }, [value, optionIdsKey]);

  return <select ref={selectRef} id={id} className={`form-select form-select-sm ${className}`.trim()} data-placeholder={placeholder} />;
}
