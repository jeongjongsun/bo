package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.LoginRequest;
import com.shopeasy.entity.OmUserM;
import com.shopeasy.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 인증 API — 로그인, 로그아웃, 현재 사용자 조회.
 * 세션 기반. docs/02-개발-표준.md, 06-보안-표준.md.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    static final String SESSION_USER_ID = "userId";
    static final String SESSION_USER_NM = "userNm";
    static final String SESSION_AUTH_GROUP = "authGroup";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 로그인. 성공 시 세션에 userId, userNm, authGroup 저장.
     *
     * @param request userId, password
     * @return 200 + 사용자 정보, 401 인증 실패
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        OmUserM user = authService.authenticate(request.getUserId(), request.getPassword());
        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail(ErrorCodes.ERR_UNAUTHORIZED, "error.login_failed"));
        }

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(SESSION_USER_ID, user.getUserId());
        session.setAttribute(SESSION_USER_NM, user.getUserNm());
        session.setAttribute(SESSION_AUTH_GROUP, user.getAuthGroup());

        log.info("세션 생성, userId={}, sessionId={}", user.getUserId(), session.getId());

        Map<String, Object> userData = new LinkedHashMap<>();
        userData.put("userId", user.getUserId());
        userData.put("name", user.getUserNm());
        userData.put("roles", buildRoles(user));

        return ResponseEntity.ok(ApiResponse.ok(userData));
    }

    /**
     * 로그아웃. 세션 무효화.
     *
     * @return 200
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            String userId = (String) session.getAttribute(SESSION_USER_ID);
            session.invalidate();
            log.info("로그아웃, userId={}", userId);
        }
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * 현재 사용자·메뉴·권한 (docs/02-개발-표준 - 권한/메뉴). 인증은 SessionAuthInterceptor에서 처리.
     *
     * @return 200 + { user, menus, permissions }
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> me(HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        HttpSession session = httpRequest.getSession(false);
        String userNm = session != null ? (String) session.getAttribute(SESSION_USER_NM) : null;
        String authGroup = session != null ? (String) session.getAttribute(SESSION_AUTH_GROUP) : null;

        Map<String, Object> user = new LinkedHashMap<>();
        user.put("userId", userId);
        user.put("name", userNm);
        user.put("roles", authGroup != null ? List.of(authGroup) : List.of("USER"));

        // TODO: 실제 메뉴·권한은 authGroup 기반 DB 조회로 대체
        List<Map<String, Object>> menus = List.of(
                Map.of("id", "M001", "name", "대시보드", "path", "/", "icon", "Dashboard", "children", List.of())
        );
        List<String> permissions = List.of("USER_READ");

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("user", user);
        data.put("menus", menus);
        data.put("permissions", permissions);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    private List<String> buildRoles(OmUserM user) {
        String authGroup = user.getAuthGroup();
        return authGroup != null ? List.of(authGroup) : List.of("USER");
    }
}
