package com.shopeasy.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.dto.ProfileResponse;
import com.shopeasy.dto.ProfileUpdateRequest;
import com.shopeasy.entity.OmUserM;
import com.shopeasy.mapper.OmUserMMapper;
import com.shopeasy.util.PasswordPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * 로그인 사용자 프로필 조회·수정. GET/PUT /api/v1/profile.
 */
@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);

    private final OmUserMMapper userMapper;
    private final AuthService authService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ProfileService(OmUserMMapper userMapper, AuthService authService) {
        this.userMapper = userMapper;
        this.authService = authService;
    }

    /**
     * 현재 사용자 프로필 조회.
     */
    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String userId) {
        OmUserM user = userMapper.selectByUserId(userId);
        if (user == null) {
            return null;
        }
        Map<String, Object> info = user.getUserInfoMap();
        String emailId = info.get("email_id") != null ? info.get("email_id").toString() : null;
        String mobileNo = info.get("mobile_no") != null ? info.get("mobile_no").toString() : null;
        return new ProfileResponse(user.getUserId(), user.getUserNm(), emailId, mobileNo);
    }

    /**
     * 현재 사용자 프로필 수정. 이름·비밀번호(선택). 비밀번호 미입력 시 변경하지 않음.
     *
     * @return 수정된 이름(세션 반영용). 비밀번호 불일치·복잡도 위반 시 예외.
     */
    @Transactional
    public String updateProfile(String userId, ProfileUpdateRequest req) {
        OmUserM user = userMapper.selectByUserId(userId);
        if (user == null) {
            return null;
        }

        if (req.getName() != null && !req.getName().isBlank()) {
            user.setUserNm(req.getName().trim());
        }

        String newPassword = req.getNewPassword() != null ? req.getNewPassword() : "";
        String newPasswordConfirm = req.getNewPasswordConfirm() != null ? req.getNewPasswordConfirm() : "";

        if (!newPassword.isEmpty() || !newPasswordConfirm.isEmpty()) {
            if (!newPassword.equals(newPasswordConfirm)) {
                throw new IllegalArgumentException("settings.profile.password_mismatch");
            }
            String msgKey = PasswordPolicy.validate(newPassword);
            if (msgKey != null) {
                throw new IllegalArgumentException(msgKey);
            }
            String encoded = authService.encodePassword(newPassword);
            Map<String, Object> info = new HashMap<>(user.getUserInfoMap());
            info.put("password", encoded);
            info.put("password_fail_cnt", 0);
            try {
                user.setUserInfo(objectMapper.writeValueAsString(info));
            } catch (Exception e) {
                log.error("user_info 직렬화 실패, userId={}", userId, e);
                throw new IllegalStateException("error.internal");
            }
        }

        userMapper.updateProfile(userId, user.getUserNm(), user.getUserInfo(), userId);
        log.info("프로필 수정 완료, userId={}", userId);
        return user.getUserNm();
    }
}
