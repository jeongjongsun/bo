package com.shopeasy.dto;

import com.shopeasy.entity.OmUserM;
import org.springframework.http.HttpStatus;

/**
 * 로그인 시도 결과. 성공 시 user 비null, 실패 시 HTTP 상태·에러 코드·i18n 메시지 키.
 */
public final class AuthLoginResult {

    private final OmUserM user;
    private final HttpStatus httpStatus;
    private final String errorCode;
    private final String messageKey;

    private AuthLoginResult(OmUserM user, HttpStatus httpStatus, String errorCode, String messageKey) {
        this.user = user;
        this.httpStatus = httpStatus;
        this.errorCode = errorCode;
        this.messageKey = messageKey;
    }

    public static AuthLoginResult ok(OmUserM user) {
        return new AuthLoginResult(user, HttpStatus.OK, null, null);
    }

    public static AuthLoginResult fail(HttpStatus status, String errorCode, String messageKey) {
        return new AuthLoginResult(null, status, errorCode, messageKey);
    }

    public boolean isOk() {
        return user != null;
    }

    public OmUserM getUser() {
        return user;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getMessageKey() {
        return messageKey;
    }
}
