package com.shopeasy.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.dto.UserSettingDto;
import com.shopeasy.dto.UserSettingRow;
import com.shopeasy.mapper.OmUserSettingMMapper;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자별 환경설정 서비스 (om_user_setting_m).
 * 설정 항목은 setting_values JSONB로 관리.
 */
@Service
public class UserSettingService {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final OmUserSettingMMapper userSettingMapper;

    public UserSettingService(OmUserSettingMMapper userSettingMapper) {
        this.userSettingMapper = userSettingMapper;
    }

    /** 현재 사용자 환경설정 조회. 없으면 기본값 DTO 반환. */
    @Transactional(readOnly = true)
    public UserSettingDto getSettings(String userId) {
        UserSettingRow row = userSettingMapper.selectByUserId(userId);
        if (row == null) {
            return defaultDto(userId);
        }
        return rowToDto(userId, row.getSettingValues());
    }

    /** 현재 사용자 환경설정 저장. 행 없으면 INSERT, 있으면 UPDATE. */
    @Transactional
    public UserSettingDto saveSettings(String userId, String defaultCorporationCd) {
        UserSettingRow existing = userSettingMapper.selectByUserId(userId);
        Map<String, Object> map = new HashMap<>();
        map.put("defaultCorporationCd", defaultCorporationCd != null && defaultCorporationCd.isBlank() ? null : defaultCorporationCd);

        String settingValuesJson;
        try {
            settingValuesJson = JSON.writeValueAsString(map);
        } catch (Exception e) {
            throw new RuntimeException("user settings JSON build failed", e);
        }

        UserSettingRow row = new UserSettingRow();
        row.setUserId(userId);
        row.setSettingValues(settingValuesJson);

        if (existing == null) {
            userSettingMapper.insert(row);
        } else {
            userSettingMapper.update(row);
        }
        return getSettings(userId);
    }

    private static UserSettingDto defaultDto(String userId) {
        UserSettingDto dto = new UserSettingDto();
        dto.setUserId(userId);
        dto.setDefaultCorporationCd(null);
        return dto;
    }

    private static UserSettingDto rowToDto(String userId, String settingValues) {
        UserSettingDto dto = new UserSettingDto();
        dto.setUserId(userId);
        if (settingValues == null || settingValues.isBlank()) {
            dto.setDefaultCorporationCd(null);
            return dto;
        }
        try {
            Map<String, Object> map = JSON.readValue(settingValues, MAP_TYPE);
            Object corp = map.get("defaultCorporationCd");
            dto.setDefaultCorporationCd(corp != null && !corp.toString().isBlank() ? corp.toString().trim() : null);
        } catch (Exception e) {
            dto.setDefaultCorporationCd(null);
        }
        return dto;
    }
}
