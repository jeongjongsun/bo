import { cloneElement, type CSSProperties, type ReactElement } from 'react';

/** 주문 수기등록(ManualOrderModal)과 동일: 필수 시 .required + 라벨 별표. */
export function FloatingRow({
  id,
  label,
  required,
  requiredLabel,
  children,
  style,
}: {
  id: string;
  label: string;
  required?: boolean;
  requiredLabel?: string;
  children: ReactElement;
  style?: CSSProperties;
}) {
  const childWithId = cloneElement(children, { id });
  return (
    <div className={`form-floating mb-2 ${required ? 'required' : ''}`} style={style}>
      {childWithId}
      <label htmlFor={id}>
        {label}
        {required && (
          <>
            <span className="text-primary ms-1" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden">{requiredLabel}</span>
          </>
        )}
      </label>
    </div>
  );
}
