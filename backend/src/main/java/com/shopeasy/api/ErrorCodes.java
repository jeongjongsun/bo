package com.shopeasy.api;

/**
 * API 표준 에러/결과 코드 (docs/02-개발-표준.md, 03-부록-타입.md).
 */
public final class ErrorCodes {

    public static final String SUCCESS = "SUCCESS";
    /** 400 잘못된 요청 */
    public static final String ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
    /** 401 미인증 */
    public static final String ERR_UNAUTHORIZED = "ERR_UNAUTHORIZED";
    /** 401 세션 만료 */
    public static final String ERR_SESSION_EXPIRED = "ERR_SESSION_EXPIRED";
    /** 403 권한 없음 */
    public static final String ERR_FORBIDDEN = "ERR_FORBIDDEN";
    /** 404 리소스 없음 */
    public static final String ERR_NOT_FOUND = "ERR_NOT_FOUND";
    /** 409 충돌 (중복 등) */
    public static final String ERR_CONFLICT = "ERR_CONFLICT";
    /** 입력 검증 실패 */
    public static final String ERR_VALIDATION = "ERR_VALIDATION";
    /** 500 서버 내부 오류 */
    public static final String ERR_INTERNAL = "ERR_INTERNAL";
    /** 403 허용 IP 아님 (로그인) */
    public static final String ERR_ACCESS_IP_NOT_ALLOWED = "ERR_ACCESS_IP_NOT_ALLOWED";
    /** 403 계정 상태 비활성·잠금 등 (ACTIVE 아님, 로그인 직전 차단) */
    public static final String ERR_ACCOUNT_NOT_ACTIVE = "ERR_ACCOUNT_NOT_ACTIVE";
    /** 403 로그인 허용 등급 아님 (ADMIN/MANAGER 외) */
    public static final String ERR_LOGIN_GRADE_NOT_ALLOWED = "ERR_LOGIN_GRADE_NOT_ALLOWED";
    /** 401 비밀번호 실패 상한으로 계정 잠금 처리됨 */
    public static final String ERR_ACCOUNT_LOCKED = "ERR_ACCOUNT_LOCKED";

    private ErrorCodes() {}
}
