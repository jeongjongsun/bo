/**
 * SweetAlert2 래퍼 (A title with a text under 스타일).
 * @see https://sweetalert2.github.io/#examples
 * @see https://sweetalert2.github.io/#icons
 * @see https://github.com/sweetalert2/sweetalert2-react-content
 */
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const defaultOptions = {
  showCloseButton: false,
  confirmButtonText: '확인',
};

/** 문장 구분(. ) 또는 줄바꿈(\\n)이 있으면 <br>로 변환해 html로 표시 */
function textOrHtml(content: string) {
  const t = content.trim();
  if (!t) return { text: '' };
  let out = t;
  if (out.includes('\n')) out = out.replace(/\n/g, '<br>');
  if (out.includes('. ')) out = out.replace(/\. /g, '.<br>');
  if (out !== t) return { html: out };
  return { text: t };
}

/**
 * 성공 알림 (icon: success)
 */
export function showSuccess(title: string, text?: string) {
  return MySwal.fire({
    ...defaultOptions,
    title,
    ...textOrHtml(text ?? ''),
    icon: 'success',
  });
}

/**
 * 오류 알림 (icon: error)
 */
export function showError(title: string, text?: string) {
  return MySwal.fire({
    ...defaultOptions,
    title,
    ...textOrHtml(text ?? ''),
    icon: 'error',
  });
}

/**
 * 경고 알림 (icon: warning)
 */
export function showWarning(title: string, text?: string) {
  return MySwal.fire({
    ...defaultOptions,
    title,
    ...textOrHtml(text ?? ''),
    icon: 'warning',
  });
}

/**
 * 정보 알림 (icon: info)
 */
export function showInfo(title: string, text?: string) {
  return MySwal.fire({
    ...defaultOptions,
    title,
    ...textOrHtml(text ?? ''),
    icon: 'info',
  });
}

/**
 * 성공 토스트 (작은 알림, 자동 사라짐). 모달이 아닌 토스트 형태.
 */
export function showSuccessToast(message: string) {
  return MySwal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: message,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
}

/**
 * 오류 토스트 (작은 알림, 자동 사라짐). 모달이 아닌 토스트 형태.
 */
export function showErrorToast(message: string, detail?: string) {
  return MySwal.fire({
    toast: true,
    position: 'top-end',
    icon: 'error',
    title: message,
    text: detail,
    showConfirmButton: false,
    timer: 6000,
    timerProgressBar: true,
  });
}

/**
 * 확인 대화상자 (confirm/cancel). 확인 시 true, 취소/닫기 시 false.
 * @see https://sweetalert2.github.io/#icons (warning 등)
 */
export function confirm(
  title: string,
  text?: string,
  options?: { confirmButtonText?: string; cancelButtonText?: string; icon?: 'warning' | 'question' | 'info' },
) {
  return MySwal.fire({
    ...defaultOptions,
    title,
    ...textOrHtml(text ?? ''),
    icon: options?.icon ?? 'question',
    showCancelButton: true,
    confirmButtonText: options?.confirmButtonText ?? '확인',
    cancelButtonText: options?.cancelButtonText ?? '취소',
  }).then((result) => result.isConfirmed);
}

export { MySwal };
