package com.shopeasy.service;

import com.shopeasy.entity.OmUserM;
import com.shopeasy.mapper.OmUserMMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 로그인·세션 서비스. docs/06-보안-표준 - 인증, docs/05-로깅-표준 - 로그인 성공/실패 로깅.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final OmUserMMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(OmUserMMapper userMapper) {
        this.userMapper = userMapper;
    }

    /**
     * 로그인 검증. bcrypt 해시 비교.
     */
    public OmUserM authenticate(String userId, String password) {
        OmUserM user = userMapper.selectByUserId(userId);

        if (user == null) {
            log.warn("로그인 실패 - 사용자 없음, userId={}", userId);
            return null;
        }

        String storedHash = user.getPassword();

        if (storedHash == null || !passwordEncoder.matches(password, storedHash)) {
            log.warn("로그인 실패 - 비밀번호 불일치, userId={}", userId);
            return null;
        }

        log.info("로그인 성공, userId={}", userId);
        return user;
    }

    /**
     * 평문 비밀번호 → bcrypt 해시. 비밀번호 저장/변경 시 사용.
     */
    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
}
