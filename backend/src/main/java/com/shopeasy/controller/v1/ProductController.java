package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.BulkImportResult;
import com.shopeasy.dto.ProductCreateRequest;
import com.shopeasy.dto.ProductDetail;
import com.shopeasy.dto.ProductFieldUpdateRequest;
import com.shopeasy.dto.ProductListItem;
import com.shopeasy.dto.ProductUpdateRequest;
import com.shopeasy.service.ProductExcelParser;
import com.shopeasy.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 상품 관리 API (docs/02-개발-표준.md 규격).
 * <p>인증: SessionAuthInterceptor에서 검사. 미인증 시 401, 상품 미존재 시 404.</p>
 */
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;
    private final ProductExcelParser excelParser;

    public ProductController(ProductService productService, ProductExcelParser excelParser) {
        this.productService = productService;
        this.excelParser = excelParser;
    }

    private static String resolveConstraintViolationMessage(DataIntegrityViolationException e) {
        String msg = e.getMessage();
        return (msg != null && (msg.contains("uk_product_corporation_product_cd") || msg.contains("duplicate key")))
                ? "products.duplicate_product_cd" : "error.constraint_violation";
    }

    private static String resolveLang(HttpServletRequest request, String langParam) {
        if (langParam != null && !langParam.isBlank()) return langParam.trim();
        String header = request.getHeader("X-Requested-Lang");
        if (header != null && !header.isBlank()) return header.trim();
        String accept = request.getHeader("Accept-Language");
        return (accept != null && accept.toLowerCase().startsWith("ko")) ? "ko" : "en";
    }

    /**
     * 상품 목록 (법인별 조회). 법인코드 필수.
     *
     * @param corporationCd 법인코드 (필수)
     * @return ApiResponse.data = List&lt;ProductListItem&gt;
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductListItem>>> list(
            @RequestParam(value = "corporationCd", required = false) String corporationCd,
            HttpServletRequest httpRequest) {

        if (corporationCd == null || corporationCd.isBlank()) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "products.corporation_required"));
        }

        List<ProductListItem> result = productService.getProductList(corporationCd);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * OM_PRODUCT_M 전체 컬럼 엑셀 다운로드. 법인별 전체 상품을 한 시트로 반환.
     * (경로를 export-full로 해서 /{productId}와 매칭 충돌 방지)
     */
    @GetMapping("/export-full")
    public ResponseEntity<byte[]> exportFull(
            @RequestParam("corporationCd") String corporationCd,
            @RequestParam(value = "lang", required = false) String lang,
            HttpServletRequest request) {
        if (corporationCd == null || corporationCd.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String resolvedLang = resolveLang(request, lang);
        byte[] body = productService.exportProductsExcel(corporationCd, resolvedLang);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "products_full_export.xlsx");
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }

    /**
     * 상품 엑셀 업로드 양식 다운로드. 헤더는 lang에 따라 한글/영문. 법인코드 컬럼 없음.
     */
    @GetMapping("/import-template")
    public ResponseEntity<byte[]> downloadImportTemplate(
            @RequestParam(value = "lang", required = false) String lang) {
        byte[] body = excelParser.createTemplate(lang);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "product_import_template.xlsx");
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }

    /**
     * 상품 필드 단건 수정 (목록 그리드 등에서 사용).
     *
     * @param request productId, field, value (수정 가능 필드: productCd, productNm, productType, baseUnitCd, isSale, isDisplay)
     * @return 200 성공, 400 잘못된 요청/필드
     */
    @PutMapping("/field")
    public ResponseEntity<ApiResponse<Void>> updateField(
            @RequestBody ProductFieldUpdateRequest request,
            HttpServletRequest httpRequest) {

        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);

        try {
            productService.updateProductField(
                    request.getProductId(), request.getField(), request.getValue(), userId);
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.ok(ApiResponse.fail(ErrorCodes.ERR_CONFLICT, resolveConstraintViolationMessage(e)));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        }
    }

    /**
     * 상품 등록. 수정 폼과 동일한 필드로 등록 후 생성된 상품 상세 반환.
     *
     * @param request corporationCd, productCd, productNm, productType 필수
     * @return ApiResponse.data = ProductDetail (생성된 상품)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProductDetail>> create(
            @RequestBody ProductCreateRequest request,
            HttpServletRequest httpRequest) {

        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);

        try {
            ProductDetail result = productService.createProduct(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.ok(ApiResponse.fail(ErrorCodes.ERR_CONFLICT, resolveConstraintViolationMessage(e)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, e.getMessage() != null ? e.getMessage() : "error.bad_request"));
        }
    }

    /**
     * 상품 상세 조회 (메인 + 부가정보 + 단위/바코드 + 세트구성품).
     *
     * @param productId 상품 ID
     * @return ApiResponse.data = ProductDetail, 없으면 404
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDetail>> getDetail(
            @PathVariable String productId) {

        try {
            ProductDetail result = productService.getProductDetail(productId);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, "error.not_found"));
        }
    }

    /**
     * 상품 수정 (메인·부가정보·단위·세트구성품 일괄).
     *
     * @param productId 상품 ID
     * @param request 수정할 필드 (units/setComponents 있으면 해당 테이블 전체 교체)
     * @return 200 성공, 400 잘못된 요청
     */
    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable String productId,
            @RequestBody ProductUpdateRequest request,
            HttpServletRequest httpRequest) {

        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);

        try {
            productService.updateProduct(productId, request, userId);
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.ok(ApiResponse.fail(ErrorCodes.ERR_CONFLICT, resolveConstraintViolationMessage(e)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, "error.not_found"));
        }
    }

    /**
     * 상품 엑셀 일괄 등록. multipart: file, corporationCd, mode(full|unitsOnly|setOnly).
     * full=상품 일괄, unitsOnly=기존 상품에 단위/바코드만 추가, setOnly=기존 세트에 구성만 추가.
     */
    @PostMapping(value = "/bulk-import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<BulkImportResult>> bulkImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("corporationCd") String corporationCd,
            @RequestParam(value = "mode", defaultValue = "full") String mode,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "error.bad_request"));
        }
        if (corporationCd == null || corporationCd.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, MessageKeys.PRODUCTS_CORPORATION_CD_REQUIRED));
        }
        try {
            BulkImportResult result = productService.bulkImport(file.getInputStream(), corporationCd, userId, mode);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, MessageKeys.PRODUCTS_EXCEL_PARSE_ERROR));
        }
    }
}
