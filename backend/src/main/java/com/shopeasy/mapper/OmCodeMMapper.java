package com.shopeasy.mapper;

import com.shopeasy.dto.CodeItem;
import com.shopeasy.dto.CodeManageRow;
import com.shopeasy.dto.CodeRowRaw;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** OM_CODE_M 조회·공통코드 관리. */
@Mapper
public interface OmCodeMMapper {

    List<CodeItem> selectByMainCd(@Param("mainCd") String mainCd, @Param("lang") String lang);

    /** main_cd=CODE 대분류 그룹 목록 (등록일시 내림차순, 표시순서, sub_cd). */
    List<CodeManageRow> selectManageGroups(@Param("keyword") String keyword);

    /** 특정 그룹(main_cd) 하위 코드 전체 (관리 화면, use_yn 무관). */
    List<CodeManageRow> selectManageDetails(@Param("mainCd") String mainCd);

    CodeRowRaw selectRaw(@Param("mainCd") String mainCd, @Param("subCd") String subCd);

    int updateCodeJson(
            @Param("mainCd") String mainCd,
            @Param("subCd") String subCd,
            @Param("codeNm") String codeNm,
            @Param("codeInfo") String codeInfo,
            @Param("updatedBy") String updatedBy);

    int insertCode(
            @Param("mainCd") String mainCd,
            @Param("subCd") String subCd,
            @Param("codeNm") String codeNm,
            @Param("codeInfo") String codeInfo,
            @Param("createdBy") String createdBy);
}
