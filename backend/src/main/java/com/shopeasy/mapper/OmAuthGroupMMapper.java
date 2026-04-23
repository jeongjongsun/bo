package com.shopeasy.mapper;

import com.shopeasy.dto.AuthGroupOptionDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** OM_AUTH_GROUP_M 조회. */
@Mapper
public interface OmAuthGroupMMapper {

    List<AuthGroupOptionDto> selectActiveOptions();

    int countByCd(@Param("authGroupCd") String authGroupCd);

    /** 삭제된 행 포함 동일 PK 존재 여부 (신규 등록 시 PK 충돌 방지). */
    int countByCdAll(@Param("authGroupCd") String authGroupCd);
}
