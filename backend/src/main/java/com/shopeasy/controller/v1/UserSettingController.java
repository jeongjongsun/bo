package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.UserSettingDto;
import com.shopeasy.service.UserSettingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 사용자별 환경설정 API. 로그인 사용자 본인 설정만 조회·저장.
 */
@RestController
@RequestMapping("/api/v1/user-settings")
public class UserSettingController {

    private final UserSettingService userSettingService;

    public UserSettingController(UserSettingService userSettingService) {
        this.userSettingService = userSettingService;
    }

    /**
     * 현재 사용자 환경설정 조회.
     *
     * @return ApiResponse.data = { userId, orderSimpleViewYn, defaultCorporationCd }
     */
    @GetMapping
    public ResponseEntity<ApiResponse<UserSettingDto>> getSettings(HttpServletRequest request) {
        String userId = (String) request.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        UserSettingDto dto = userSettingService.getSettings(userId);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    /**
     * 현재 사용자 환경설정 저장.
     *
     * @param body orderSimpleViewYn (boolean, optional), defaultCorporationCd (string, optional), defaultOrderDateType (string, optional), orderBulkSaveUnmatchedYn (boolean, optional)
     * @return ApiResponse.data = 저장 후 전체 설정
     */
    @PutMapping
    public ResponseEntity<ApiResponse<UserSettingDto>> saveSettings(
            HttpServletRequest request,
            @RequestBody Map<String, Object> body) {
        String userId = (String) request.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        Boolean orderSimpleViewYn = parseBooleanOption(body, "orderSimpleViewYn");
        String defaultCorporationCd = body != null && body.get("defaultCorporationCd") != null
                ? body.get("defaultCorporationCd").toString().trim()
                : null;
        if (defaultCorporationCd != null && defaultCorporationCd.isEmpty()) {
            defaultCorporationCd = null;
        }
        String defaultOrderDateType = body != null && body.get("defaultOrderDateType") != null
                ? body.get("defaultOrderDateType").toString().trim()
                : null;
        Boolean orderBulkSaveUnmatchedYn = parseBooleanOption(body, "orderBulkSaveUnmatchedYn");
        UserSettingDto dto = userSettingService.saveSettings(userId, orderSimpleViewYn, defaultCorporationCd, defaultOrderDateType, orderBulkSaveUnmatchedYn);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    /**
     * Map에서 boolean 옵션 추출. 키 없음/빈 문자열이면 null, Boolean이면 그대로, String이면 parseBoolean.
     */
    private static Boolean parseBooleanOption(Map<String, Object> body, String key) {
        if (body == null || !body.containsKey(key)) {
            return null;
        }
        Object val = body.get(key);
        if (val instanceof Boolean) {
            return (Boolean) val;
        }
        if (val instanceof String) {
            String s = ((String) val).trim();
            if (s.isEmpty()) {
                return null;
            }
            return Boolean.parseBoolean(s);
        }
        return null;
    }
}
