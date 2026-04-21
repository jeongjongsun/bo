package com.shopeasy.mapper;

import com.shopeasy.dto.CodeItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** OM_CODE_M 조회 fallback 매퍼 (운영/레거시 DB 호환). */
@Mapper
public interface OmCodeMMapper {

    List<CodeItem> selectByMainCd(@Param("mainCd") String mainCd, @Param("lang") String lang);
}
