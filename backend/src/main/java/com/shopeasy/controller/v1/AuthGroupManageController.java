package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.api.PagedData;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.AuthGroupCreateRequest;
import com.shopeasy.dto.AuthGroupManageRow;
import com.shopeasy.dto.AuthGroupMenuAuditRow;
import com.shopeasy.dto.AuthGroupMenuConfigResponse;
import com.shopeasy.dto.AuthGroupMenuSaveRequest;
import com.shopeasy.dto.AuthGroupUpdateRequest;
import com.shopeasy.service.AuthGroupManageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 권한그룹 메뉴 권한 관리 API. */
@RestController
@RequestMapping("/api/v1/auth-groups/manage")
public class AuthGroupManageController {

    private final AuthGroupManageService authGroupManageService;

    public AuthGroupManageController(AuthGroupManageService authGroupManageService) {
        this.authGroupManageService = authGroupManageService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuthGroupManageRow>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(authGroupManageService.listGroups()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> create(
            @Valid @RequestBody AuthGroupCreateRequest request, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            authGroupManageService.createGroup(request, userId, httpRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            return buildIllegalArgResponse(e);
        }
    }

    @PutMapping("/{authGroupCd}")
    public ResponseEntity<ApiResponse<Void>> updateGroup(
            @PathVariable("authGroupCd") String authGroupCd,
            @RequestBody AuthGroupUpdateRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            authGroupManageService.updateGroupInfo(authGroupCd, request, userId);
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            return buildIllegalArgResponse(e);
        }
    }

    @GetMapping("/{authGroupCd}/menus")
    public ResponseEntity<ApiResponse<AuthGroupMenuConfigResponse>> menus(
            @PathVariable("authGroupCd") String authGroupCd,
            @RequestParam(defaultValue = "SYSTEM") String systemMainCd,
            @RequestParam String systemSubCd) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    authGroupManageService.getGroupMenus(authGroupCd, systemMainCd, systemSubCd)));
        } catch (IllegalArgumentException e) {
            return buildIllegalArgResponse(e);
        }
    }

    @PutMapping("/{authGroupCd}/menus")
    public ResponseEntity<ApiResponse<Void>> saveMenus(
            @PathVariable("authGroupCd") String authGroupCd,
            @RequestBody AuthGroupMenuSaveRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            authGroupManageService.saveGroupMenus(authGroupCd, request, userId, httpRequest);
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            return buildIllegalArgResponse(e);
        }
    }

    @DeleteMapping("/{authGroupCd}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable("authGroupCd") String authGroupCd,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            authGroupManageService.deleteGroup(authGroupCd, userId, httpRequest);
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            return buildIllegalArgResponse(e);
        }
    }

    @GetMapping("/{authGroupCd}/audits")
    public ResponseEntity<ApiResponse<PagedData<AuthGroupMenuAuditRow>>> audits(
            @PathVariable("authGroupCd") String authGroupCd,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            if (size > 500) {
                size = 500;
            }
            return ResponseEntity.ok(ApiResponse.ok(authGroupManageService.getAudits(authGroupCd, page, size)));
        } catch (IllegalArgumentException e) {
            return buildIllegalArgResponse(e);
        }
    }

    private <T> ResponseEntity<ApiResponse<T>> buildIllegalArgResponse(IllegalArgumentException e) {
        String key = e.getMessage() != null ? e.getMessage() : MessageKeys.ERROR_BAD_REQUEST;
        if (MessageKeys.AUTH_GROUPS_NOT_FOUND.equals(key)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, key));
        }
        if (MessageKeys.AUTH_GROUPS_DUPLICATE_CD.equals(key)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail(ErrorCodes.ERR_CONFLICT, key));
        }
        return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, key));
    }
}
