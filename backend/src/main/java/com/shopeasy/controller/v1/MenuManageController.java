package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.MenuCreateRequest;
import com.shopeasy.dto.MenuCreateResult;
import com.shopeasy.dto.MenuManageRow;
import com.shopeasy.dto.MenuUpdateRequest;
import com.shopeasy.service.MenuManageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 메뉴(OM_MENU_M) 관리 API.
 */
@RestController
@RequestMapping("/api/v1/menus/manage")
public class MenuManageController {

    private final MenuManageService menuManageService;

    public MenuManageController(MenuManageService menuManageService) {
        this.menuManageService = menuManageService;
    }

    /**
     * 시스템별 메뉴 플랫 목록 (프론트에서 parent 기준으로 트리 구성).
     *
     * @param systemMainCd 기본 SYSTEM
     * @param systemSubCd  OM | BO (om_code_m SYSTEM 하위)
     */
    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<MenuManageRow>>> tree(
            @RequestParam(defaultValue = "SYSTEM") String systemMainCd,
            @RequestParam String systemSubCd) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(menuManageService.listFlat(systemMainCd, systemSubCd)));
        } catch (IllegalArgumentException e) {
            String key = e.getMessage() != null ? e.getMessage() : MessageKeys.ERROR_BAD_REQUEST;
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, key));
        }
    }

    @GetMapping("/{menuId}")
    public ResponseEntity<ApiResponse<MenuManageRow>> detail(@PathVariable("menuId") String menuId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(menuManageService.getDetail(menuId)));
        } catch (IllegalArgumentException e) {
            String key = e.getMessage() != null ? e.getMessage() : MessageKeys.ERROR_BAD_REQUEST;
            if (MessageKeys.MENUS_NOT_FOUND.equals(key)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, key));
            }
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, key));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MenuCreateResult>> create(
            @RequestBody MenuCreateRequest request, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            MenuCreateResult result = menuManageService.create(request, userId != null ? userId : "system");
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
        } catch (IllegalArgumentException e) {
            String key = e.getMessage() != null ? e.getMessage() : MessageKeys.ERROR_BAD_REQUEST;
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, key));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail(ErrorCodes.ERR_CONFLICT, MessageKeys.ERROR_CONSTRAINT_VIOLATION));
        }
    }

    @PutMapping("/{menuId}")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable("menuId") String menuId,
            @RequestBody MenuUpdateRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            menuManageService.update(menuId, request, userId != null ? userId : "system");
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            String key = e.getMessage() != null ? e.getMessage() : MessageKeys.ERROR_BAD_REQUEST;
            if (MessageKeys.MENUS_NOT_FOUND.equals(key)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, key));
            }
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, key));
        }
    }

    @DeleteMapping("/{menuId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("menuId") String menuId, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            menuManageService.deleteCascade(menuId, userId != null ? userId : "system");
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            String key = e.getMessage() != null ? e.getMessage() : MessageKeys.ERROR_BAD_REQUEST;
            if (MessageKeys.MENUS_NOT_FOUND.equals(key)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, key));
            }
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, key));
        }
    }
}
