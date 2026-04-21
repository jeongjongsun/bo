package com.shopeasy.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * bcrypt 해시 생성 유틸 (비밀번호 초기화·테스트용).
 * <p>실행: mvn exec:java -Dexec.mainClass="com.shopeasy.util.BcryptGenerator" -Dexec.args="비밀번호"</p>
 */
public class BcryptGenerator {

    public static void main(String[] args) {
        String raw = args.length > 0 ? args[0] : "1111";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println(encoder.encode(raw));
    }
}
