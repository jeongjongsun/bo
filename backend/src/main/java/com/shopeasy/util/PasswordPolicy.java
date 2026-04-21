package com.shopeasy.util;

import java.util.regex.Pattern;

/**
 * 비밀번호 정책: 길이, 영문·숫자·특수문자 조합. docs/06-보안-표준.
 * 영문은 대소문자 구분 없이 1자 이상 포함하면 충족.
 */
public final class PasswordPolicy {

    /** 최소 길이 */
    public static final int MIN_LENGTH = 8;
    /** 최대 길이 (bcrypt 등 제한 고려) */
    public static final int MAX_LENGTH = 72;

    /** 영문 1자 이상 (대문자 또는 소문자) */
    private static final Pattern LETTER = Pattern.compile("[A-Za-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    /** 영문·숫자 이외 문자 1개 이상 (특수문자) */
    private static final Pattern SPECIAL = Pattern.compile("[^a-zA-Z0-9]");

    private PasswordPolicy() {}

    /**
     * 비밀번호 복잡도 검증.
     *
     * @param password 평문 비밀번호
     * @return 검증 실패 시 오류 메시지 키 (다국어용), 성공 시 null
     */
    public static String validate(String password) {
        if (password == null || password.isEmpty()) {
            return "settings.profile.password_required";
        }
        if (password.length() < MIN_LENGTH) {
            return "settings.profile.password_min_length";
        }
        if (password.length() > MAX_LENGTH) {
            return "settings.profile.password_max_length";
        }
        if (!LETTER.matcher(password).find()) {
            return "settings.profile.password_require_letter";
        }
        if (!DIGIT.matcher(password).find()) {
            return "settings.profile.password_require_digit";
        }
        if (!SPECIAL.matcher(password).find()) {
            return "settings.profile.password_require_special";
        }
        return null;
    }
}
