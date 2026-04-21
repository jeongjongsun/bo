package com.shopeasy.mapper;

import com.shopeasy.dto.ProductBulkInsertRow;
import com.shopeasy.dto.ProductDetail;
import com.shopeasy.dto.ProductExportRow;
import com.shopeasy.dto.ProductListItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 상품 메인 테이블(OM_PRODUCT_M) MyBatis 매퍼.
 * <p>부가정보만 product_info JSONB 사용. 단위/바코드·세트구성품은 OmProductUnitMapper, OmProductSetComponentMapper.</p>
 */
@Mapper
public interface OmProductMMapper {

    /** 상품 목록 (법인별, base_unit_cd는 om_product_unit 서브쿼리. 정렬: sort_order ASC, created_at DESC) */
    List<ProductListItem> selectProductList(@Param("corporationCd") String corporationCd);

    /** 상품 상세 (메인 + product_info 스칼라만, units/setComponents 제외) */
    ProductDetail selectProductDetail(@Param("productId") String productId);

    /** OM_PRODUCT_M 전체 + product_info 스칼라. 엑셀 전체 다운로드용 (법인별) */
    List<ProductExportRow> selectProductListForExport(@Param("corporationCd") String corporationCd);

    /** 법인코드+상품코드로 product_id 조회 (엑셀 업로드 시 구성품 해석용). 없으면 null */
    String selectProductIdByCorporationAndCode(@Param("corporationCd") String corporationCd, @Param("productCd") String productCd);

    /** 상품 필드 단건 수정 (productCd, productNm, productType, isSale, isDisplay. baseUnitCd는 서비스에서 OmProductUnitMapper 호출) */
    int updateProductField(@Param("productId") String productId,
                           @Param("field") String field,
                           @Param("value") Object value,
                           @Param("updatedBy") String updatedBy);

    /** 상품 수정 (메인 컬럼 + product_info 부가정보만. units/setComponents는 서비스에서 별도 테이블 처리) */
    int updateProduct(@Param("productId") String productId,
                      @Param("req") com.shopeasy.dto.ProductUpdateRequest req,
                      @Param("updatedBy") String updatedBy);

    /** 상품 등록 (OM_PRODUCT_M INSERT). product_id는 서비스에서 생성 후 전달 */
    int insertProduct(@Param("productId") String productId,
                      @Param("req") com.shopeasy.dto.ProductCreateRequest req,
                      @Param("createdBy") String createdBy);

    /** 상품 bulk 등록 (엑셀 업로드 등). 한 번에 여러 행 INSERT */
    int insertBatch(@Param("list") List<ProductBulkInsertRow> list);
}
