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
}
