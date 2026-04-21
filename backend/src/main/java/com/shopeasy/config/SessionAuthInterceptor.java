package com.shopeasy.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;

/**
 * 인증 필요 API 공통 처리: 세션 유효 시 userId를 request attribute로 넣고,
 * 없으면 401 + ERR_SESSION_EXPIRED 반환. docs/06-보안-표준.md.
 * <p>제외 경로: /api/v1/auth/login (WebConfig에서 excludePathPatterns 설정)</p>
 */
public class SessionAuthInterceptor implements HandlerInterceptor {

    public static final String REQUEST_ATTR_USER_ID = "userId";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) throws Exception {
        HttpSession session = request.getSession(false);
        Object userId = session != null ? session.getAttribute(REQUEST_ATTR_USER_ID) : null;

        if (userId == null || !(userId instanceof String)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            ApiResponse<?> body = ApiResponse.fail(ErrorCodes.ERR_SESSION_EXPIRED, "error.session_expired");
            response.getWriter().write(objectMapper.writeValueAsString(body));
            return false;
        }

        request.setAttribute(REQUEST_ATTR_USER_ID, userId);
        return true;
    }
}
