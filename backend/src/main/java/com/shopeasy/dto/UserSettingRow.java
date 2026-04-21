package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * om_user_setting_m 조회 행 (user_id + setting_values JSONB).
 * Service에서 JSON 파싱 후 UserSettingDto로 변환.
 */
@Getter
@Setter
public class UserSettingRow {

    private String userId;
    /** JSONB 컬럼 값 (JSON 문자열). */
    private String settingValues;

}
