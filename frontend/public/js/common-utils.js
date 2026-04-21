/**
 * 공통 유틸리티 함수
 */

/**
 * 메시지 프로퍼티 접근 헬퍼 함수
 * @param {string} key - 메시지 키 (점(.)으로 구분된 경로, 예: 'product.title', 'button.save')
 * @param {string} defaultValue - 메시지를 찾을 수 없을 때 반환할 기본값
 * @returns {string} - 메시지 값
 * 
 * @example
 * getMessage('product.title') // '상품 정보'
 * getMessage('button.save') // '저장'
 * getMessage('nonexistent.key', '기본값') // '기본값'
 */
window.getMessage = function(key, defaultValue = '') {
  if (!key || typeof key !== 'string') {
    return defaultValue;
  }
  
  if (!window.MESSAGES || typeof window.MESSAGES !== 'object') {
    console.warn('MESSAGES 객체가 초기화되지 않았습니다.');
    return defaultValue;
  }
  
  // 메시지 키로 직접 접근
  return window.MESSAGES[key] || defaultValue;
};

/**
 * SweetAlert2를 사용한 Toast 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {string} type - 메시지 타입 ('success', 'error', 'info', 'warning')
 */
window.showToast = function(message, type = 'success') {
  const swalConfig = {
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  };
  
  if (type === 'success') {
    swalConfig.icon = 'success';
  } else if (type === 'error') {
    swalConfig.icon = 'error';
  } else if (type === 'warning') {
    swalConfig.icon = 'warning';
  } else {
    swalConfig.icon = 'info';
  }
  
  Swal.fire(swalConfig);
};

/**
 * 폼 validation 처리 및 오류 필드로 스크롤
 * @param {HTMLFormElement} form - 검증할 폼 요소
 * @returns {boolean} - validation 통과 여부
 */
window.validateForm = function(form) {
  if (!form || !form.checkValidity()) {
    form.classList.add('was-validated');
    
    // 첫 번째 오류 필드로 스크롤
    const firstInvalid = form.querySelector(':invalid');
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus();
    }
    return false;
  }
  return true;
};

/**
 * Bootstrap 모달 인스턴스 가져오기 또는 생성
 * @param {HTMLElement|string} modalElement - 모달 요소 또는 ID
 * @returns {bootstrap.Modal|null} - 모달 인스턴스
 */
window.getOrCreateModal = function(modalElement) {
  if (typeof modalElement === 'string') {
    modalElement = document.getElementById(modalElement);
  }
  
  if (!modalElement) {
    return null;
  }
  
  let modalInstance = bootstrap.Modal.getInstance(modalElement);
  if (!modalInstance) {
    try {
      modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true
      });
    } catch (error) {
      console.error('모달 인스턴스 생성 오류:', error);
      return null;
    }
  }
  
  return modalInstance;
};

/**
 * 경고 알림 표시 (제목 없이 메시지만 표시)
 * @param {string} message - 표시할 메시지
 * @param {string} confirmButtonText - 확인 버튼 텍스트 (기본값: '확인')
 * @param {string} icon - 아이콘 타입 (기본값: 'warning')
 *   - 'warning': 경고 아이콘
 *   - 'error': 오류 아이콘
 *   - 'success': 성공 아이콘
 *   - 'info': 정보 아이콘
 *   - 'question': 질문 아이콘
 * @returns {Promise} - SweetAlert2 Promise
 */
window.showWarningAlert = function(message, confirmButtonText = '확인', icon = 'warning') {
  return Swal.fire({
    icon: icon,
    text: message,
    confirmButtonText: confirmButtonText
  });
};

/**
 * 세션 만료 처리 함수
 * 세션이 만료되었을 때 안내 문구를 표시하고 로그인 페이지로 이동합니다.
 */
window.handleSessionExpired = function() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'warning',
      title: '세션 만료',
      text: '세션이 만료되었습니다. 다시 로그인해주세요.',
      confirmButtonText: '로그인 페이지로 이동',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      window.location.href = '/login';
    });
  } else {
    // SweetAlert2가 없는 경우 기본 alert 사용
    alert('세션이 만료되었습니다. 다시 로그인해주세요.');
    window.location.href = '/login';
  }
};

/**
 * API 호출 및 응답 처리 (공통 패턴)
 * @param {string} url - API URL
 * @param {string} method - HTTP 메서드 ('GET', 'POST', 'PUT', 'DELETE')
 * @param {Object} data - 요청 데이터
 * @param {Object} options - 추가 옵션 { successMessage, errorMessage, onSuccess, onError }
 * @returns {Promise} - API 응답 Promise
 */
window.callAPI = function(url, method = 'GET', data = null, options = {}) {
  const {
    successMessage,
    errorMessage,
    onSuccess,
    onError
  } = options;
  
  const config = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }
  
  return fetch(url, config)
    .then(response => {
      // 401 Unauthorized 응답 처리 (세션 만료)
      if (response.status === 401) {
        return response.json().then(data => {
          if (data && data.sessionExpired) {
            handleSessionExpired();
            throw new Error('세션이 만료되었습니다.');
          }
          throw new Error(data.message || '인증이 필요합니다.');
        }).catch(error => {
          // JSON 파싱 실패 시에도 세션 만료 처리
          handleSessionExpired();
          throw new Error('세션이 만료되었습니다.');
        });
      }
      
      if (!response.ok) {
        return response.text().then(text => {
          console.error('서버 응답 오류:', text);
          throw new Error(text || errorMessage || '요청에 실패했습니다.');
        });
      }
      return response.json();
    })
    .then(data => {
      if (successMessage) {
        showToast(successMessage, 'success');
      }
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(data);
      }
      return data;
    })
    .catch(error => {
      // 세션 만료 에러는 이미 처리되었으므로 다시 처리하지 않음
      if (error.message && error.message.includes('세션이 만료')) {
        throw error;
      }
      
      const errorMsg = error.message || errorMessage || '요청 처리 중 오류가 발생했습니다.';
      console.error('API 호출 오류:', error);
      showToast(errorMsg, 'error');
      if (onError && typeof onError === 'function') {
        onError(error);
      }
      throw error;
    });
};
