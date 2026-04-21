/**
 * API 클라이언트. credentials include(세션), 401/403 인터셉터. docs/02-개발-표준.md, 04-보안.
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// FormData 전송 시 Content-Type을 제거해 브라우저가 multipart/form-data; boundary=... 로 설정하게 함
apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    delete (config.headers as Record<string, unknown>)['Content-Type'];
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const code = err.response?.data?.code;
    if (status === 401 || code === 'ERR_SESSION_EXPIRED') {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      console.warn('[권한 없음]', err.response?.data?.message);
    }
    return Promise.reject(err);
  }
);

export { apiClient };
