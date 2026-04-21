package com.shopeasy.api;

/**
 * API 공통 응답 래퍼 (docs/02-개발-표준.md).
 * <p>success, data, message, code 필드. 목록은 data에 PagedData 또는 List.</p>
 */
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private String code;

    public ApiResponse() {}

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    /** 성공 응답 (data 포함) */
    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> r = new ApiResponse<>();
        r.setSuccess(true);
        r.setData(data);
        r.setCode("SUCCESS");
        return r;
    }

    /** 실패 응답 (code, message. data=null) */
    public static <T> ApiResponse<T> fail(String code, String message) {
        ApiResponse<T> r = new ApiResponse<>();
        r.setSuccess(false);
        r.setData(null);
        r.setMessage(message);
        r.setCode(code);
        return r;
    }
}
