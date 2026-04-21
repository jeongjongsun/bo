package com.shopeasy.mapper;

import org.apache.ibatis.annotations.Mapper;

/** OM_CONFIG_M 단일 행 설정 조회. */
@Mapper
public interface OmConfigMapper {

    /** id=1 행의 max_password_fail_count. 없으면 null. */
    Integer selectMaxPasswordFailCount();
}
