package com.shopeasy.mapper;

import com.shopeasy.dto.CorporationDetailResponse;
import com.shopeasy.dto.CorporationItem;
import com.shopeasy.dto.CorporationManageRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** OM_CORPORATION_M 조회·수정. */
@Mapper
public interface OmCorporationMMapper {

    /** 활성 법인 목록 (corporation_cd, corporation_nm) */
    List<CorporationItem> selectCorporationList();

    long selectManageListCount(@Param("keyword") String keyword);

    List<CorporationManageRow> selectManageList(
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") int offset);

    List<CorporationManageRow> selectManageExportList(@Param("keyword") String keyword);

    CorporationManageRow selectManageRow(@Param("corporationCd") String corporationCd);

    CorporationDetailResponse selectCorporationDetail(@Param("corporationCd") String corporationCd);

    int updateCorporationNm(
            @Param("corporationCd") String corporationCd,
            @Param("corporationNm") String corporationNm,
            @Param("updatedBy") String updatedBy);

    int updateCorporationInfoJson(
            @Param("corporationCd") String corporationCd,
            @Param("corporationInfoJson") String corporationInfoJson,
            @Param("updatedBy") String updatedBy);

    int updateCorporationRow(
            @Param("corporationCd") String corporationCd,
            @Param("corporationNm") String corporationNm,
            @Param("corporationInfoJson") String corporationInfoJson,
            @Param("updatedBy") String updatedBy);

    int insertCorporation(
            @Param("corporationCd") String corporationCd,
            @Param("corporationNm") String corporationNm,
            @Param("corporationInfoJson") String corporationInfoJson,
            @Param("userId") String userId);

    /** corporation_info JSON 원문 (병합 수정용). 없으면 null. */
    String selectCorporationInfoJson(@Param("corporationCd") String corporationCd);

    /**
     * 채번용: {@code CORP-####} 형식(4자리 숫자) 중 최대 일련번호. 없으면 0.
     */
    int selectMaxCorpSerial();
}
