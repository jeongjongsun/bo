package com.shopeasy.mapper;

import com.shopeasy.dto.ProductSetComponent;
import com.shopeasy.dto.SetComponentBulkInsertRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 상품 세트 구성품 테이블(OM_PRODUCT_SET_COMPONENT) MyBatis 매퍼.
 * <p>product_type=SET 인 상품의 구성품(자식 상품) 목록.</p>
 */
@Mapper
public interface OmProductSetComponentMapper {

    /** 세트 상품별 구성품 목록 */
    List<ProductSetComponent> selectByProductId(@Param("productId") String productId);

    /** 해당 세트 상품의 구성품 행 전체 삭제 (수정 시 교체 전 삭제용) */
    int deleteByProductId(@Param("productId") String productId);

    /** 구성품 목록 일괄 INSERT */
    int insertAll(@Param("productId") String productId, @Param("list") List<ProductSetComponent> list);

    /** 세트 구성품 bulk INSERT (엑셀 업로드). 여러 세트 상품의 구성품을 한 번에 */
    int insertBatch(@Param("list") List<SetComponentBulkInsertRow> list);

    /** 세트 구성품 bulk INSERT. PK 중복 시 스킵 (세트 구성만 추가 등록용) */
    int insertBatchOrIgnore(@Param("list") List<SetComponentBulkInsertRow> list);
}
