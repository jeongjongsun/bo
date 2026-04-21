package com.shopeasy.api;

/**
 * API 응답/예외 메시지 키. 프론트엔드 다국어(ko/en) 번역 키와 동일하게 사용.
 * 백엔드는 메시지 키만 반환하고, 클라이언트에서 locale에 맞게 번역해 표시.
 */
public final class MessageKeys {

    /** products.corporation_cd_required */
    public static final String PRODUCTS_CORPORATION_CD_REQUIRED = "products.corporation_cd_required";
    /** products.product_cd_required */
    public static final String PRODUCTS_PRODUCT_CD_REQUIRED = "products.product_cd_required";
    /** products.product_nm_required */
    public static final String PRODUCTS_PRODUCT_NM_REQUIRED = "products.product_nm_required";
    /** products.create_failed */
    public static final String PRODUCTS_CREATE_FAILED = "products.create_failed";
    /** products.duplicate_product_cd */
    public static final String PRODUCTS_DUPLICATE_PRODUCT_CD = "products.duplicate_product_cd";
    /** products.corporation_required (목록 조회용) */
    public static final String PRODUCTS_CORPORATION_REQUIRED = "products.corporation_required";
    /** products.sheet_required (엑셀 Products 시트 없음) */
    public static final String PRODUCTS_SHEET_REQUIRED = "products.sheet_required";
    /** products.sheet_units_required (단위/바코드만 모드에서 Units 시트 없음) */
    public static final String PRODUCTS_SHEET_UNITS_REQUIRED = "products.sheet_units_required";
    /** products.sheet_set_required (세트 구성만 모드에서 SetComponents 시트 없음) */
    public static final String PRODUCTS_SHEET_SET_REQUIRED = "products.sheet_set_required";
    /** products.excel_product_not_found (기존 상품이 아님 - 단위/바코드만 등록 시) */
    public static final String PRODUCTS_EXCEL_PRODUCT_NOT_FOUND = "products.excel_product_not_found";
    /** products.excel_parse_error */
    public static final String PRODUCTS_EXCEL_PARSE_ERROR = "products.excel_parse_error";
    /** products.excel_column_required */
    public static final String PRODUCTS_EXCEL_COLUMN_REQUIRED = "products.excel_column_required";
    /** products.excel_duplicate_product */
    public static final String PRODUCTS_EXCEL_DUPLICATE_PRODUCT = "products.excel_duplicate_product";
    /** products.excel_component_not_found */
    public static final String PRODUCTS_EXCEL_COMPONENT_NOT_FOUND = "products.excel_component_not_found";

    /** orders.excel_sheet_required (주문일괄등록 시트 없음) */
    public static final String ORDERS_EXCEL_SHEET_REQUIRED = "orders.excel_sheet_required";
    /** orders.excel_column_required (필수 컬럼 없음) */
    public static final String ORDERS_EXCEL_COLUMN_REQUIRED = "orders.excel_column_required";
    /** orders.excel_parse_error */
    public static final String ORDERS_EXCEL_PARSE_ERROR = "orders.excel_parse_error";
    /** orders.excel_no_data (데이터 행 없음) */
    public static final String ORDERS_EXCEL_NO_DATA = "orders.excel_no_data";
    /** orders.bulkImport.orderRegisterFailed (일괄등록 시 주문 1건 등록 실패 - 상세는 서버 로그만) */
    public static final String ORDERS_BULK_IMPORT_ORDER_REGISTER_FAILED = "orders.bulkImport.orderRegisterFailed";
    /** orders.bulkImport.duplicateOrderNo (중복 주문번호 - 뒤에 |로 구분된 주문번호 목록 붙임) */
    public static final String ORDERS_BULK_IMPORT_DUPLICATE_ORDER_NO = "orders.bulkImport.duplicateOrderNo";
    /** orders.bulkImport.invalidStoreCd (해당 법인에 등록된 상점 아님 - 뒤에 |로 구분된 상점코드 목록) */
    public static final String ORDERS_BULK_IMPORT_INVALID_STORE_CD = "orders.bulkImport.invalidStoreCd";

    /** error.not_found */
    public static final String ERROR_NOT_FOUND = "error.not_found";
    /** error.bad_request */
    public static final String ERROR_BAD_REQUEST = "error.bad_request";
    /** error.constraint_violation */
    public static final String ERROR_CONSTRAINT_VIOLATION = "error.constraint_violation";
    /** error.field_not_editable */
    public static final String ERROR_FIELD_NOT_EDITABLE = "error.field_not_editable";
    /** error.session_expired */
    public static final String ERROR_SESSION_EXPIRED = "error.session_expired";
    /** error.login_failed */
    public static final String ERROR_LOGIN_FAILED = "error.login_failed";

    private MessageKeys() {}
}
