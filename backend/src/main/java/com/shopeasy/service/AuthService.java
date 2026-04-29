package com.shopeasy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.dto.AuthLoginResult;
import com.shopeasy.dto.SystemConfigDto;
import com.shopeasy.entity.OmUserM;
import com.shopeasy.mapper.OmConfigMapper;
import com.shopeasy.mapper.OmUserMMapper;
import com.shopeasy.util.ClientIpAllowlist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * 로그인·세션 서비스. 등급(grade_cd)·상태·IP·비밀번호 실패 상한(om_config_m) 적용.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final Set<String> LOGIN_GRADES = Set.of("ADMIN", "MANAGER");
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_LOCKED = "LOCKED";
    private static final String IP_LIMIT_YES = "Y";

    private static final int DEFAULT_MAX_PASSWORD_FAIL = 5;
    private static final int DEFAULT_MAX_INACTIVE_LOGIN_DAYS = 90;

    /** user_info.last_login_dtm 저장 시 사용 (DB/문서 표준: Asia/Seoul). */
    private static final ZoneId LOGIN_TIMEZONE = ZoneId.of("Asia/Seoul");

    private final OmUserMMapper userMapper;
    private final OmConfigMapper configMapper;
    private final ObjectMapper objectMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(OmUserMMapper userMapper, OmConfigMapper configMapper, ObjectMapper objectMapper) {
        this.userMapper = userMapper;
        this.configMapper = configMapper;
        this.objectMapper = objectMapper;
    }

    /**
     * 로그인 검증. 삭제·미존재는 동일 메시지(error.login_failed).
     */
    @Transactional
    public AuthLoginResult login(String userId, String rawPassword, String clientIp) {
        if (userId == null || userId.isBlank() || rawPassword == null) {
            return AuthLoginResult.fail(HttpStatus.UNAUTHORIZED, ErrorCodes.ERR_UNAUTHORIZED, "error.login_failed");
        }
        String uid = userId.trim();

        OmUserM user = userMapper.selectByUserIdForUpdate(uid);
        if (user == null) {
            log.warn("로그인 실패 - 사용자 없음 또는 삭제됨, userId={}", uid);
            return AuthLoginResult.fail(HttpStatus.UNAUTHORIZED, ErrorCodes.ERR_UNAUTHORIZED, "error.login_failed");
        }

        if (!STATUS_ACTIVE.equals(user.getUserStatus())) {
            log.warn("로그인 실패 - 비활성 상태, userId={}, status={}", uid, user.getUserStatus());
            return AuthLoginResult.fail(HttpStatus.FORBIDDEN, ErrorCodes.ERR_ACCOUNT_NOT_ACTIVE, "error.account_not_active");
        }

        String grade = user.getGradeCd();
        if (grade == null || !LOGIN_GRADES.contains(grade)) {
            log.warn("로그인 실패 - 등급 불가, userId={}, gradeCd={}", uid, grade);
            return AuthLoginResult.fail(HttpStatus.FORBIDDEN, ErrorCodes.ERR_LOGIN_GRADE_NOT_ALLOWED, "error.login_grade_not_allowed");
        }

        if (IP_LIMIT_YES.equalsIgnoreCase(user.getAccessIpLimit())) {
            if (!ClientIpAllowlist.isAllowed(clientIp, user.getAccessIpRules())) {
                log.warn("로그인 실패 - IP 미허용, userId={}, clientIp={}", uid, clientIp);
                return AuthLoginResult.fail(HttpStatus.FORBIDDEN, ErrorCodes.ERR_ACCESS_IP_NOT_ALLOWED, "error.access_ip_not_allowed");
            }
        }

        if (isLongInactiveBlocked(user)) {
            log.warn("로그인 실패 - 장기 미접속 초과, userId={}", uid);
            return AuthLoginResult.fail(HttpStatus.FORBIDDEN, ErrorCodes.ERR_ACCOUNT_NOT_ACTIVE, "error.long_inactive_login_blocked");
        }

        String storedHash = user.getPassword();
        if (storedHash == null || !passwordEncoder.matches(rawPassword, storedHash)) {
            return onPasswordMismatch(user);
        }

        try {
            Map<String, Object> onSuccess = new LinkedHashMap<>();
            onSuccess.put("password_fail_cnt", 0);
            onSuccess.put("last_login_dtm", OffsetDateTime.now(LOGIN_TIMEZONE).toString());
            persistUserInfoMerge(user.getUserId(), user, onSuccess);
        } catch (JsonProcessingException e) {
            log.error("user_info 갱신 실패(성공), userId={}", uid, e);
            return AuthLoginResult.fail(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.ERR_INTERNAL, "error.internal");
        }

        log.info("로그인 성공, userId={}", uid);
        return AuthLoginResult.ok(user);
    }

    private AuthLoginResult onPasswordMismatch(OmUserM user) {
        int max = resolveMaxPasswordFailCount();
        int next = user.getPasswordFailCount() + 1;
        Map<String, Object> overrides = new LinkedHashMap<>();
        overrides.put("password_fail_cnt", next);
        boolean lock = next >= max;
        if (lock) {
            overrides.put("user_status", STATUS_LOCKED);
        }
        try {
            persistUserInfoMerge(user.getUserId(), user, overrides);
        } catch (JsonProcessingException e) {
            log.error("user_info 갱신 실패(실패 카운트), userId={}", user.getUserId(), e);
            return AuthLoginResult.fail(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.ERR_INTERNAL, "error.internal");
        }
        log.warn("로그인 실패 - 비밀번호 불일치, userId={}, failCnt={}, locked={}", user.getUserId(), next, lock);
        if (lock) {
            return AuthLoginResult.fail(HttpStatus.UNAUTHORIZED, ErrorCodes.ERR_ACCOUNT_LOCKED, "error.account_locked");
        }
        return AuthLoginResult.fail(HttpStatus.UNAUTHORIZED, ErrorCodes.ERR_UNAUTHORIZED, "error.login_failed");
    }

    private int resolveMaxPasswordFailCount() {
        try {
            Integer v = configMapper.selectMaxPasswordFailCount();
            if (v != null && v > 0) {
                return v;
            }
        } catch (Exception e) {
            log.warn("max_password_fail_count 조회 실패, 기본값 사용: {}", e.getMessage());
        }
        return DEFAULT_MAX_PASSWORD_FAIL;
    }

    private int resolveMaxInactiveLoginDays() {
        try {
            SystemConfigDto config = configMapper.selectSystemConfig();
            Integer v = config != null ? config.getMaxInactiveLoginDays() : null;
            if (v != null && v >= 0) {
                return v;
            }
        } catch (Exception e) {
            log.warn("max_inactive_login_days 조회 실패, 기본값 사용: {}", e.getMessage());
        }
        return DEFAULT_MAX_INACTIVE_LOGIN_DAYS;
    }

    private boolean isLongInactiveBlocked(OmUserM user) {
        int maxDays = resolveMaxInactiveLoginDays();
        if (maxDays <= 0) {
            return false;
        }
        Object raw = user.getUserInfoMap().get("last_login_dtm");
        if (raw == null || raw.toString().isBlank()) {
            return false;
        }
        try {
            OffsetDateTime lastLogin = OffsetDateTime.parse(raw.toString());
            long inactiveDays = ChronoUnit.DAYS.between(lastLogin.toLocalDate(), OffsetDateTime.now(LOGIN_TIMEZONE).toLocalDate());
            return inactiveDays > maxDays;
        } catch (Exception e) {
            log.warn("last_login_dtm 파싱 실패, userId={}, value={}", user.getUserId(), raw);
            return false;
        }
    }

    private void persistUserInfoMerge(String userId, OmUserM base, Map<String, Object> overrides) throws JsonProcessingException {
        Map<String, Object> m = new LinkedHashMap<>(base.getUserInfoMap());
        m.putAll(overrides);
        String json = objectMapper.writeValueAsString(m);
        userMapper.updateUserInfoJson(userId, json);
    }

    /**
     * 평문 비밀번호 → bcrypt 해시. 비밀번호 저장/변경 시 사용.
     */
    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
}
