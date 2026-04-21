package com.shopeasy.mapper;

import com.shopeasy.dto.UserSettingRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * om_user_setting_m 매퍼. 사용자별 환경설정 (1사용자 1행). 설정 항목은 setting_values JSONB로 관리.
 */
@Mapper
public interface OmUserSettingMMapper {

    /** 사용자 환경설정 1건 조회 (user_id, setting_values). 없으면 null. */
    UserSettingRow selectByUserId(@Param("userId") String userId);

    /** 사용자 환경설정 행 삽입. */
    int insert(UserSettingRow row);

    /** 사용자 환경설정 행 수정 (setting_values, updated_at 갱신). */
    int update(UserSettingRow row);
}
