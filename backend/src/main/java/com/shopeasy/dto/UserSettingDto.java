package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 환경설정 조회/저장 DTO (om_user_setting_m).
 */
@Getter
@Setter
public class UserSettingDto {

    private String userId;
    private String defaultCorporationCd;

}
