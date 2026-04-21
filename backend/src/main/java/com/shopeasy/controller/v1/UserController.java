package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.api.PagedData;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.UserDetailResponse;
import com.shopeasy.dto.UserDetailUpdateRequest;
import com.shopeasy.dto.UserFieldUpdateRequest;
import com.shopeasy.dto.UserListItem;
import com.shopeasy.dto.UserManageRow;
import com.shopeasy.dto.UserRegisterRequest;
import com.shopeasy.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 관리 API. docs/02-개발-표준.md 규격. 인증은 SessionAuthInterceptor에서 처리.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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
     * 사용자 목록 페이징. keyword로 검색 가능 (레거시).
     *
     * @param keyword 검색어 (선택)
     * @param page 0-based
     * @param size 최대 5000
     * @return ApiResponse.data = PagedData&lt;UserListItem&gt;
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedData<UserListItem>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (size > 5000) {
            size = 5000;
        }
        PagedData<UserListItem> result = userService.getUserList(keyword, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 사용자 정보 화면용 관리 목록 (등급·권한 필터, 등록일시 내림차순).
     */
    @GetMapping("/manage")
    public ResponseEntity<ApiResponse<PagedData<UserManageRow>>> manageList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String gradeCd,
            @RequestParam(required = false) String authGroup,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(value = "lang", required = false) String lang,
            HttpServletRequest request) {
        if (size > 5000) {
            size = 5000;
        }
        String resolvedLang = resolveLang(request, lang);
        PagedData<UserManageRow> result =
                userService.getManageList(keyword, gradeCd, authGroup, resolvedLang, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportManage(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String gradeCd,
            @RequestParam(required = false) String authGroup,
            @RequestParam(value = "lang", required = false) String lang,
            HttpServletRequest request) {
        String resolvedLang = resolveLang(request, lang);
        byte[] body = userService.exportManageExcel(keyword, gradeCd, authGroup, resolvedLang);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "users_export.xlsx");
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }

    @GetMapping("/detail")
    public ResponseEntity<ApiResponse<UserDetailResponse>> detail(@RequestParam("userId") String userId) {
        try {
            UserDetailResponse result = userService.getUserDetail(userId);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (IllegalArgumentException e) {
            String key = e.getMessage() != null ? e.getMessage() : "error.bad_request";
            if (MessageKeys.ERROR_NOT_FOUND.equals(key)) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, key));
            }
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, key));
        }
    }

    @PutMapping("/field")
    public ResponseEntity<ApiResponse<Void>> updateField(
            @RequestBody UserFieldUpdateRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            userService.updateUserField(request, userId);
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
            @RequestBody UserDetailUpdateRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            userService.updateUserDetail(request, userId);
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail(ErrorCodes.ERR_INTERNAL, "error.internal"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDetailResponse>> register(
            @RequestBody UserRegisterRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            UserDetailResponse created = userService.registerUser(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail(ErrorCodes.ERR_CONFLICT, MessageKeys.USERS_DUPLICATE_USER_ID));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail(ErrorCodes.ERR_INTERNAL, "error.internal"));
        }
    }
}
