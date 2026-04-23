package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.controller.v1.AuthController;
import com.shopeasy.dto.MenuFavoriteAddRequest;
import com.shopeasy.mapper.OmAuthGroupMenuRMapper;
import com.shopeasy.service.UserMenuFavoriteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 현재 로그인 사용자의 BO 메뉴 즐겨찾기.
 */
@RestController
@RequestMapping("/api/v1/me/menu-favorites")
public class UserMenuFavoriteController {

    private static final String BO_SYSTEM_MAIN = "SYSTEM";
    private static final String BO_SYSTEM_SUB = "BO";

    private final UserMenuFavoriteService userMenuFavoriteService;
    private final OmAuthGroupMenuRMapper authGroupMenuRMapper;

    public UserMenuFavoriteController(
            UserMenuFavoriteService userMenuFavoriteService,
            OmAuthGroupMenuRMapper authGroupMenuRMapper) {
        this.userMenuFavoriteService = userMenuFavoriteService;
        this.authGroupMenuRMapper = authGroupMenuRMapper;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> add(
            @RequestBody MenuFavoriteAddRequest request, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        List<String> allowed = resolveAllowed(httpRequest);
        try {
            userMenuFavoriteService.add(userId, request != null ? request.getMenuId() : null, allowed);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            return fail(e.getMessage());
        }
    }

    @DeleteMapping("/{menuId}")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable("menuId") String menuId, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            userMenuFavoriteService.remove(userId, menuId);
            return ResponseEntity.ok(ApiResponse.ok(null));
        } catch (IllegalArgumentException e) {
            return fail(e.getMessage());
        }
    }

    private List<String> resolveAllowed(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        String authGroup = session != null ? (String) session.getAttribute(AuthController.SESSION_AUTH_GROUP) : null;
        if (authGroup == null || authGroup.isBlank()) {
            return List.of();
        }
        List<String> ids = authGroupMenuRMapper.selectActiveMenuIdsByAuthGroupAndSystem(
                authGroup.trim(), BO_SYSTEM_MAIN, BO_SYSTEM_SUB);
        return ids != null ? ids : List.of();
    }

    private static ResponseEntity<ApiResponse<Void>> fail(String key) {
        String k = key != null ? key : MessageKeys.ERROR_BAD_REQUEST;
        if (MessageKeys.FAVORITES_NOT_FOUND.equals(k)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, k));
        }
        return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, k));
    }
}
