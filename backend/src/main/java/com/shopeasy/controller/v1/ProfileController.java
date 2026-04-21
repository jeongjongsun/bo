package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.ProfileResponse;
import com.shopeasy.dto.ProfileUpdateRequest;
import com.shopeasy.service.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 로그인 사용자 프로필 API. GET/PUT /api/v1/profile.
 */
@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    /**
     * 현재 사용자 프로필 조회.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(HttpServletRequest request) {
        String userId = (String) request.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        ProfileResponse profile = profileService.getProfile(userId);
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, "error.not_found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    /**
     * 현재 사용자 프로필 수정. 이름·비밀번호(선택). 비밀번호 미입력 시 변경하지 않음.
     */
    @PutMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            HttpServletRequest request,
            @RequestBody ProfileUpdateRequest body) {
        String userId = (String) request.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        try {
            String updatedName = profileService.updateProfile(userId, body);
            if (updatedName == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, "error.not_found"));
            }
            if (updatedName != null && body.getName() != null && !body.getName().isBlank()) {
                HttpSession session = request.getSession(false);
                if (session != null) {
                    session.setAttribute("userNm", updatedName);
                }
            }
            ProfileResponse profile = profileService.getProfile(userId);
            return ResponseEntity.ok(ApiResponse.ok(profile));
        } catch (IllegalArgumentException e) {
            String messageKey = e.getMessage();
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(ErrorCodes.ERR_VALIDATION, messageKey != null ? messageKey : "error.bad_request"));
        }
    }
}
