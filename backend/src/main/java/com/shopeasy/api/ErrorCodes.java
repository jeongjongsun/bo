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

    private ErrorCodes() {}
}
