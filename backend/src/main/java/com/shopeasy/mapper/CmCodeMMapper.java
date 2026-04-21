package com.shopeasy.mapper;

import com.shopeasy.dto.CodeItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * CM_CODE_M 조회. main_cd별 사용코드(use_yn='Y'), disp_seq 정렬, 언어별 code_nm.
 */
@Mapper
public interface CmCodeMMapper {

    /**
     * main_cd에 해당하는 공통코드 목록.
     * code_info.use_yn = 'Y', code_info.disp_seq ASC, code_nm은 lang 키 값.
     */
    List<CodeItem> selectByMainCd(@Param("mainCd") String mainCd, @Param("lang") String lang);
}
