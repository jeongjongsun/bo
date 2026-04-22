package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.CodeFieldUpdateRequest;
import com.shopeasy.dto.CodeManageDetailUpdateRequest;
import com.shopeasy.dto.CodeManageChildRegisterRequest;
import com.shopeasy.dto.CodeManageGroupRegisterRequest;
import com.shopeasy.dto.CodeManageRow;
import com.shopeasy.service.CodeManageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 공통코드(OM_CODE_M) 관리 API. 대분류(CODE)·하위 목록, 그리드/모달 수정, 엑셀.
 */
@RestController
@RequestMapping("/api/v1/codes/manage")
public class CodeManageController {

    private final CodeManageService codeManageService;

    public CodeManageController(CodeManageService codeManageService) {
        this.codeManageService = codeManageService;
    }

    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<List<CodeManageRow>>> groups(
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.ok(codeManageService.listGroups(keyword)));
    }

    @GetMapping("/details")
    public ResponseEntity<ApiResponse<List<CodeManageRow>>> details(@RequestParam("mainCd") String mainCd) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(codeManageService.listDetails(mainCd)));
        } catch (IllegalArgumentException e) {
            String key = e.getMessage() != null ? e.getMessage() : MessageKeys.ERROR_BAD_REQUEST;
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, key));
        }
    }

    @GetMapping("/row")
    public ResponseEntity<ApiResponse<CodeManageRow>> row(
            @RequestParam("mainCd") String mainCd, @RequestParam("subCd") String subCd) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(codeManageService.getRow(mainCd, subCd)));
        } catch (IllegalArgumentException e) {
            String key = e.getMessage() != null ? e.getMessage() : MessageKeys.ERROR_BAD_REQUEST;
            if (MessageKeys.CODES_NOT_FOUND.equals(key)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, key));
            }
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, key));
        }
    }

    @PutMapping("/field")
    public ResponseEntity<ApiResponse<Void>> updateField(
            @RequestBody CodeFieldUpdateRequest request, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            codeManageService.updateField(request, userId != null ? userId : "system");
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail(ErrorCodes.ERR_INTERNAL, "error.internal"));
        }
    }

    @PutMapping("/detail")
    public ResponseEntity<ApiResponse<Void>> updateDetail(
            @RequestBody CodeManageDetailUpdateRequest request, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            codeManageService.updateDetail(request, userId != null ? userId : "system");
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            if (MessageKeys.CODES_NOT_FOUND.equals(msgKey)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, msgKey));
            }
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail(ErrorCodes.ERR_INTERNAL, "error.internal"));
        }
    }

    @PostMapping("/group")
    public ResponseEntity<ApiResponse<Void>> registerGroup(
            @RequestBody CodeManageGroupRegisterRequest request, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            codeManageService.registerGroup(request, userId != null ? userId : "system");
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(null));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail(ErrorCodes.ERR_CONFLICT, MessageKeys.CODES_DUPLICATE_KEY));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail(ErrorCodes.ERR_INTERNAL, "error.internal"));
        }
    }

    @PostMapping("/child")
    public ResponseEntity<ApiResponse<Void>> registerChild(
            @RequestBody CodeManageChildRegisterRequest request, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            codeManageService.registerChild(request, userId != null ? userId : "system");
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(null));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail(ErrorCodes.ERR_CONFLICT, MessageKeys.CODES_DUPLICATE_KEY));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            if (MessageKeys.CODES_NOT_FOUND.equals(msgKey)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, msgKey));
            }
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail(ErrorCodes.ERR_INTERNAL, "error.internal"));
        }
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam(required = false) String keyword) {
        try {
            byte[] body = codeManageService.exportExcel(keyword);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "codes_export.xlsx");
            return new ResponseEntity<>(body, headers, HttpStatus.OK);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
