package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.api.PagedData;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.CorporationCreateRequest;
import com.shopeasy.dto.CorporationDetailResponse;
import com.shopeasy.dto.CorporationDetailUpdateRequest;
import com.shopeasy.dto.CorporationFieldUpdateRequest;
import com.shopeasy.dto.CorporationItem;
import com.shopeasy.dto.CorporationManageRow;
import com.shopeasy.service.CorporationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 법인(화주사) API. GET / (상단 법인 선택), /manage·/detail·등록·수정은 화주(법인) 정보 화면용.
 */
@RestController
@RequestMapping("/api/v1/corporations")
public class CorporationController {

    private final CorporationService corporationService;

    public CorporationController(CorporationService corporationService) {
        this.corporationService = corporationService;
    }

    private static String resolveLang(HttpServletRequest request, String langParam) {
        if (langParam != null && !langParam.isBlank()) {
            return langParam.trim();
        }
        String header = request.getHeader("X-Requested-Lang");
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        String accept = request.getHeader("Accept-Language");
        return (accept != null && accept.toLowerCase().startsWith("ko")) ? "ko" : "en";
    }

    /**
     * 활성 법인(화주사) 목록. 상단 법인 선택 등에 사용.
     *
     * @return ApiResponse.data = List&lt;CorporationItem&gt;
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CorporationItem>>> list() {
        List<CorporationItem> result = corporationService.getCorporationList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 화주 관리 그리드용 페이징 목록. 등록일시 내림차순 정렬.
     */
    @GetMapping("/manage")
    public ResponseEntity<ApiResponse<PagedData<CorporationManageRow>>> manageList(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        PagedData<CorporationManageRow> result = corporationService.getManageList(keyword, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportManage(
            @RequestParam(required = false) String keyword,
            @RequestParam(value = "lang", required = false) String lang,
            HttpServletRequest request) {
        String resolvedLang = resolveLang(request, lang);
        byte[] body = corporationService.exportManageExcel(keyword, resolvedLang);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "corporations_export.xlsx");
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }

    @GetMapping("/detail")
    public ResponseEntity<ApiResponse<CorporationDetailResponse>> detail(
            @RequestParam("corporationCd") String corporationCd) {
        try {
            CorporationDetailResponse result = corporationService.getCorporationDetail(corporationCd);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (IllegalArgumentException e) {
            String key = e.getMessage() != null ? e.getMessage() : "error.bad_request";
            if ("error.not_found".equals(key)) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, key));
            }
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, key));
        }
    }

    @PutMapping("/field")
    public ResponseEntity<ApiResponse<Void>> updateField(
            @RequestBody CorporationFieldUpdateRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            corporationService.updateCorporationField(request, userId);
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        }
    }

    @PutMapping("/detail")
    public ResponseEntity<ApiResponse<Void>> updateDetail(
            @RequestBody CorporationDetailUpdateRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            corporationService.updateCorporationDetail(request, userId);
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<CorporationDetailResponse>> register(
            @RequestBody CorporationCreateRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            CorporationDetailResponse created = corporationService.createCorporation(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail(ErrorCodes.ERR_CONFLICT, "corporations.duplicate_cd"));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        }
    }
}
