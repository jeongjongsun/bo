package com.shopeasy.mapper;

import com.shopeasy.dto.SystemConfigDto;
import org.apache.ibatis.annotations.Mapper;

/** OM_CONFIG_M 단일 행 설정 조회. */
@Mapper
public interface OmConfigMapper {

    /** id=1 행의 max_password_fail_count. 없으면 null. */
    Integer selectMaxPasswordFailCount();

    /** id=1 행의 환경설정 전체 조회. */
    SystemConfigDto selectSystemConfig();

    /** id=1 행 기본값 보장. */
    int insertDefaultRowIfAbsent();

    /** id=1 행 환경설정 저장. */
    int updateSystemConfig(SystemConfigDto dto);
}
