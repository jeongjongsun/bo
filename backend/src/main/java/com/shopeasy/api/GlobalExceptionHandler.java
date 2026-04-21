package com.shopeasy.api;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.dao.DataIntegrityViolationException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 전역 예외 처리 → 표준 에러 응답 (docs/02-개발-표준.md, 06-보안-표준.md).
 * <p>@Valid 실패 시 400+errors, 그 외 Exception 시 500.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** @Valid 검증 실패 (Bean Validation) → 400, code=ERR_VALIDATION, errors 필드 목록 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException e, HttpServletRequest request) {

        List<Map<String, String>> fieldErrors = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of("field", fe.getField(), "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : ""))
                .collect(Collectors.toList());

        Map<String, Object> body = errorBody(ErrorCodes.ERR_VALIDATION, "입력 값을 확인해 주세요.", request.getRequestURI());
        body.put("errors", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    /** DB 유니크 제약 위반 (상품코드 중복 등) → 409, code=ERR_CONFLICT. message는 다국어 키로 반환. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(
            DataIntegrityViolationException e, HttpServletRequest request) {
        String exMsg = e.getMessage() != null ? e.getMessage() : "";
        String messageKey;
        if (exMsg.contains("uk_product_corporation_product_cd")) {
            messageKey = MessageKeys.PRODUCTS_DUPLICATE_PRODUCT_CD;
        } else if (exMsg.contains("uk_order_m_regist_corp_mall_store_no")
                || (exMsg.contains("om_order_m_") && exMsg.contains("regist_dt_corporation_cd_mall_cd_store"))) {
            messageKey = MessageKeys.ORDERS_BULK_IMPORT_DUPLICATE_ORDER_NO;
        } else {
            messageKey = MessageKeys.ERROR_CONSTRAINT_VIOLATION;
        }
        log.warn("DB 제약 위반, path={}, message={}", request.getRequestURI(), exMsg);
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(errorBody(ErrorCodes.ERR_CONFLICT, messageKey, request.getRequestURI()));
    }

    /** 그 외 예외 → 500, code=ERR_INTERNAL (로그 출력) */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e, HttpServletRequest request) {
        log.error("처리 중 오류, path={}", request.getRequestURI(), e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorBody(ErrorCodes.ERR_INTERNAL, "일시적인 오류가 발생했습니다.", request.getRequestURI()));
    }

    private Map<String, Object> errorBody(String code, String message, String path) {
        Map<String, Object> map = new HashMap<>();
        map.put("success", false);
        map.put("data", null);
        map.put("message", message);
        map.put("code", code);
        map.put("timestamp", Instant.now().toString());
        map.put("path", path != null ? path : "");
        return map;
    }
}
