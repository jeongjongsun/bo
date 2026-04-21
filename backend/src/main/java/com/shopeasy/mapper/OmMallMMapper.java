package com.shopeasy.mapper;

import com.shopeasy.dto.MallListItem;
import com.shopeasy.dto.MallOption;
import com.shopeasy.dto.MallStoreListItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 쇼핑몰 마스터(om_mall_m) MyBatis 매퍼. 상점 조인 목록 포함.
 */
@Mapper
public interface OmMallMMapper {

    List<MallListItem> selectMallList(
            @Param("keyword") String keyword,
            @Param("size") int size,
            @Param("offset") int offset);

    long selectMallListCount(@Param("keyword") String keyword);

    /** 쇼핑몰+상점 조인 목록 (상점 단위, 한 행당 한 상점). corporationCd 있으면 해당 법인만. */
    List<MallStoreListItem> selectMallStoreList(
            @Param("keyword") String keyword,
            @Param("corporationCd") String corporationCd,
            @Param("size") int size,
            @Param("offset") int offset);

    long selectMallStoreListCount(@Param("keyword") String keyword, @Param("corporationCd") String corporationCd);

    /** 상점명 수정 (om_mall_store_m). */
    int updateStoreNm(@Param("storeId") long storeId, @Param("storeNm") String storeNm, @Param("updatedBy") String updatedBy);

    /** 상점 수정 (mall_cd, store_nm, store_info, is_active). */
    int updateStore(@Param("storeId") long storeId, @Param("mallCd") String mallCd, @Param("storeNm") String storeNm,
                    @Param("storeInfoJson") String storeInfoJson, @Param("isActive") Boolean isActive,
                    @Param("updatedBy") String updatedBy);

    /** 쇼핑몰 옵션 목록 (드롭다운용, is_active=true). */
    List<MallOption> selectMallOptions();

    /** 동일 쇼핑몰·법인 내 상점 건수 (자동 채번용). */
    int selectStoreCountByMallAndCorporation(@Param("mallCd") String mallCd, @Param("corporationCd") String corporationCd);

    /** 상점 등록 (om_mall_store_m). */
    int insertStore(@Param("mallCd") String mallCd, @Param("corporationCd") String corporationCd,
                    @Param("storeCd") String storeCd, @Param("storeNm") String storeNm,
                    @Param("storeInfoJson") String storeInfoJson, @Param("isActive") boolean isActive,
                    @Param("createdBy") String createdBy);

    /** 법인+상점코드로 상점 1건 조회 (mall_cd 등록용). 동일 상점코드가 여러 쇼핑몰에 있으면 첫 건. */
    MallStoreListItem selectStoreByCorporationAndStoreCd(
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd);
}
