package com.shopeasy.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 사용자 메인 테이블(OM_USER_M) 매핑 VO.
 * user_info JSONB 안에 password, grade_cd, auth_group 등이 들어 있음.
 */
public class OmUserM {

    private static final ObjectMapper OM = new ObjectMapper();

    private String userId;
    private String userNm;
    private String userInfo;

    private transient Map<String, Object> userInfoMap;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserNm() { return userNm; }
    public void setUserNm(String userNm) { this.userNm = userNm; }

    public String getUserInfo() { return userInfo; }
    public void setUserInfo(String userInfo) {
        this.userInfo = userInfo;
        this.userInfoMap = null;
    }

    /**
     * user_info JSONB를 Map으로 파싱.
     */
    public Map<String, Object> getUserInfoMap() {
        if (userInfoMap == null && userInfo != null) {
            try {
                userInfoMap = OM.readValue(userInfo, new TypeReference<>() {});
            } catch (Exception e) {
                userInfoMap = new HashMap<>();
            }
        }
        return userInfoMap != null ? userInfoMap : new HashMap<>();
    }

    public String getPassword() {
        Object pw = getUserInfoMap().get("password");
        return pw != null ? pw.toString() : null;
    }

    public String getUserStatus() {
        Object s = getUserInfoMap().get("user_status");
        return s != null ? s.toString() : null;
    }

    public String getAuthGroup() {
        Object g = getUserInfoMap().get("auth_group");
        return g != null ? g.toString() : null;
    }

    public Object getPasswordFailCnt() {
        return getUserInfoMap().get("password_fail_cnt");
    }

    public String getGradeCd() {
        Object g = getUserInfoMap().get("grade_cd");
        return g != null ? g.toString() : null;
    }

    public String getAccessIpLimit() {
        Object v = getUserInfoMap().get("access_ip_limit");
        return v != null ? v.toString() : null;
    }

    /**
     * user_info.access_ip — JSON 배열 또는 콤마 구분 문자열을 규칙 목록으로 변환.
     */
    @SuppressWarnings("unchecked")
    public List<String> getAccessIpRules() {
        Object v = getUserInfoMap().get("access_ip");
        if (v == null) {
            return List.of();
        }
        if (v instanceof List<?> list) {
            List<String> out = new ArrayList<>();
            for (Object o : list) {
                if (o == null) {
                    continue;
                }
                String s = o.toString().trim();
                if (!s.isEmpty()) {
                    out.add(s);
                }
            }
            return out;
        }
        String s = v.toString().trim();
        if (s.isEmpty()) {
            return List.of();
        }
        String[] parts = s.split(",");
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            String t = p.trim();
            if (!t.isEmpty()) {
                out.add(t);
            }
        }
        return out;
    }

    /** 비밀번호 연속 실패 횟수 (없거나 파싱 불가 시 0). */
    public int getPasswordFailCount() {
        Object o = getPasswordFailCnt();
        if (o instanceof Number n) {
            return n.intValue();
        }
        if (o == null) {
            return 0;
        }
        try {
            return Integer.parseInt(o.toString().trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
