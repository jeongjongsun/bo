package com.shopeasy.service;

import com.shopeasy.api.MessageKeys;
import com.shopeasy.dto.ProductCreateRequest;
import com.shopeasy.dto.ProductDetail;
import com.shopeasy.dto.ProductExportRow;
import com.shopeasy.dto.ProductListItem;
import com.shopeasy.dto.ProductUpdateRequest;
import com.shopeasy.dto.SetComponentBulkInsertRow;
import com.shopeasy.dto.UnitBulkInsertRow;
import com.shopeasy.dto.BulkImportResult;
import com.shopeasy.dto.ProductBulkInsertRow;
import com.shopeasy.dto.SetComponentExcelRow;
import com.shopeasy.dto.UnitExcelRow;
import com.shopeasy.mapper.OmProductMMapper;
import com.shopeasy.mapper.OmProductSetComponentMapper;
import com.shopeasy.mapper.OmProductUnitMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * 상품 마스터 관리 서비스.
 *
 * <p><b>데이터 구조</b></p>
 * <ul>
 *   <li><b>메인·부가정보</b>: OM_PRODUCT_M. 기본 컬럼 + product_info JSONB(상품 영문명, 카테고리, 원가 등 스칼라만)</li>
 *   <li><b>단위/바코드</b>: OM_PRODUCT_UNIT. 상품별 복수 행(단위코드, 바코드, 입수량, 기본단위 여부)</li>
 *   <li><b>세트 구성품</b>: OM_PRODUCT_SET_COMPONENT. 세트 상품일 때만 사용, 구성 상품 ID + 수량</li>
 * </ul>
 *
 * <p><b>프로세스 요약</b></p>
 * <ul>
 *   <li>목록: 법인별 OM_PRODUCT_M 조회(등록일 역순, 번호 역순). 매퍼: selectProductList</li>
 *   <li>상세: OM_PRODUCT_M 1건 + OM_PRODUCT_UNIT/OM_PRODUCT_SET_COMPONENT 조회</li>
 *   <li>등록: product_id 생성 → OM_PRODUCT_M INSERT → 단위/세트 있으면 각 테이블 INSERT</li>
 *   <li>수정: OM_PRODUCT_M UPDATE + 단위/세트는 DELETE 후 일괄 INSERT(전체 교체)</li>
 *   <li>필드 단건 수정: 목록 그리드 셀 편집용. EDITABLE_FIELDS만 허용, baseUnitCd는 OM_PRODUCT_UNIT에서 처리</li>
 * </ul>
 *
 * <p>에러 메시지는 다국어 키(MessageKeys)로만 던지며, 컨트롤러/전역 핸들러에서 그대로 API message로 전달한다.</p>
 *
 * @see com.shopeasy.controller.v1.ProductController
 * @see com.shopeasy.api.MessageKeys
 */
@Service
public class ProductService {

    /**
     * 목록 그리드 등에서 단건 수정 가능한 필드명.
     * updateProductField() 호출 시 이 집합에 없는 필드면 ERROR_FIELD_NOT_EDITABLE 반환.
     * baseUnitCd는 OM_PRODUCT_UNIT의 기본단위 행만 갱신하므로 별도 분기.
     */
    private static final Set<String> EDITABLE_FIELDS =
            Set.of("productCd", "productNm", "productType", "baseUnitCd", "isSale", "isDisplay");

    private static String generateProductId() {
        return "PRD-" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }

    private final OmProductMMapper productMapper;
    private final OmProductUnitMapper productUnitMapper;
    private final OmProductSetComponentMapper productSetComponentMapper;
    private final ProductExcelParser excelParser;

    public ProductService(OmProductMMapper productMapper,
                          OmProductUnitMapper productUnitMapper,
                          OmProductSetComponentMapper productSetComponentMapper,
                          ProductExcelParser excelParser) {
        this.productMapper = productMapper;
        this.productUnitMapper = productUnitMapper;
        this.productSetComponentMapper = productSetComponentMapper;
        this.excelParser = excelParser;
    }

    // -------------------------------------------------------------------------
    // 목록 조회
    // -------------------------------------------------------------------------

    /**
     * 상품 목록 조회 (법인별).
     *
     * <p><b>프로세스</b>: OM_PRODUCT_M에서 is_deleted=false, corporation_cd 조건으로 조회.
     * 매퍼(selectProductList)에서 product_info.sort_order ASC 정렬(동일 시 created_at DESC). sort_order 없으면 맨 뒤.</p>
     *
     * @param corporationCd 법인코드. null 또는 빈 문자열이면 해당 법인 조건 없이 조회(전체).
     * @return 상품 목록. 각 항목: rowNum, productId, productCd, productNm, productType, baseUnitCd, isSale, isDisplay, createdBy, createdAt
     */
    @Transactional(readOnly = true)
    public List<ProductListItem> getProductList(String corporationCd) {
        return productMapper.selectProductList(corporationCd);
    }

    /**
     * OM_PRODUCT_M 전체 컬럼 엑셀 다운로드용. 법인별 조회 후 엑셀 바이트 반환.
     * 헤더는 lang(ko/en)에 따라 한글/영문.
     *
     * @param corporationCd 법인코드 (필수)
     * @param lang 언어 (ko, en). null이면 영문
     * @return .xlsx 파일 바이트
     */
    @Transactional(readOnly = true)
    public byte[] exportProductsExcel(String corporationCd, String lang) {
        if (corporationCd == null || corporationCd.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.PRODUCTS_CORPORATION_CD_REQUIRED);
        }
        List<ProductExportRow> rows = productMapper.selectProductListForExport(corporationCd);
        return excelParser.createFullExportExcel(rows, lang);
    }

    // -------------------------------------------------------------------------
    // 상세 조회
    // -------------------------------------------------------------------------

    /**
     * 상품 상세 조회. 메인 + 부가정보 + 단위/바코드 + 세트 구성품을 한 번에 반환.
     *
     * <p><b>프로세스</b></p>
     * <ol>
     *   <li>OM_PRODUCT_M 1건 조회(selectProductDetail). 없으면 ERROR_NOT_FOUND</li>
     *   <li>OM_PRODUCT_UNIT에서 해당 product_id 목록 조회 → detail.units 설정</li>
     *   <li>OM_PRODUCT_SET_COMPONENT에서 해당 product_id 목록 조회 → detail.setComponents 설정</li>
     * </ol>
     *
     * @param productId 상품 ID (OM_PRODUCT_M.product_id)
     * @return ProductDetail (메인·product_info·units·setComponents 포함)
     * @throws IllegalArgumentException 상품이 없을 때. message=MessageKeys.ERROR_NOT_FOUND (다국어 키)
     */
    @Transactional(readOnly = true)
    public ProductDetail getProductDetail(String productId) {
        ProductDetail detail = productMapper.selectProductDetail(productId);
        if (detail == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_NOT_FOUND);
        }
        // 단위/바코드: OM_PRODUCT_UNIT
        detail.setUnits(productUnitMapper.selectByProductId(productId));
        // 세트 구성품: OM_PRODUCT_SET_COMPONENT (세트 상품일 때만 데이터 존재)
        detail.setSetComponents(productSetComponentMapper.selectByProductId(productId));
        return detail;
    }

    // -------------------------------------------------------------------------
    // 등록
    // -------------------------------------------------------------------------

    /**
     * 상품 신규 등록. product_id 자동 생성 후 OM_PRODUCT_M INSERT, 단위/세트 구성이 있으면 각 테이블 INSERT.
     *
     * <p><b>프로세스</b></p>
     * <ol>
     *   <li>필수값 검증: corporationCd, productCd, productNm. 없으면 해당 MessageKeys로 IllegalArgumentException</li>
     *   <li>product_id 생성: PRD- + UUID 32자(hex, 하이픈 제거). docs/menu/상품관리.md §6.1 참고</li>
     *   <li>OM_PRODUCT_M INSERT. rows=0이면 PRODUCTS_CREATE_FAILED (DB 제약 등)</li>
     *   <li>request.units가 있으면 OM_PRODUCT_UNIT에 insertAll</li>
     *   <li>request.setComponents가 있으면 OM_PRODUCT_SET_COMPONENT에 insertAll</li>
     *   <li>생성된 상품 상세를 getProductDetail()로 조회해 반환</li>
     * </ol>
     *
     * @param request   등록 내용. corporationCd, productCd, productNm, productType 필수. units/setComponents 선택
     * @param createdBy 생성자 사용자 ID (세션 등에서 전달)
     * @return 생성된 상품의 상세 (ProductDetail)
     * @throws IllegalArgumentException 필수값 누락 또는 INSERT 실패 시. message는 MessageKeys 상수(다국어 키)
     */
    @Transactional
    public ProductDetail createProduct(ProductCreateRequest request, String createdBy) {
        // 1) 필수값 검증 — API에서 받은 값만 검사. 프론트 검증과 이중화
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.PRODUCTS_CORPORATION_CD_REQUIRED);
        }
        if (request.getProductCd() == null || request.getProductCd().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.PRODUCTS_PRODUCT_CD_REQUIRED);
        }
        if (request.getProductNm() == null || request.getProductNm().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.PRODUCTS_PRODUCT_NM_REQUIRED);
        }

        // 2) product_id 생성 규칙: PRD- + UUID 32자(hex, 하이픈 제거). OM_PRODUCT_M.product_id VARCHAR(48)
        String productId = generateProductId();

        // 3) 메인 테이블 INSERT. sort_order는 시퀀스(nextval)로 DB에서 부여. 유니크(법인+상품코드) 위반 시 컨트롤러에서 DataIntegrityViolationException → products.duplicate_product_cd
        int rows = productMapper.insertProduct(productId, request, createdBy);
        if (rows == 0) {
            throw new IllegalArgumentException(MessageKeys.PRODUCTS_CREATE_FAILED);
        }

        // 4) 단위/바코드가 있으면 OM_PRODUCT_UNIT 일괄 INSERT
        if (request.getUnits() != null && !request.getUnits().isEmpty()) {
            productUnitMapper.insertAll(productId, request.getUnits());
        }
        // 5) 세트 구성품이 있으면 OM_PRODUCT_SET_COMPONENT 일괄 INSERT
        if (request.getSetComponents() != null && !request.getSetComponents().isEmpty()) {
            productSetComponentMapper.insertAll(productId, request.getSetComponents());
        }

        // 6) 생성된 상품 상세 반환 (메인+단위+세트구성 모두 포함)
        return getProductDetail(productId);
    }

    // -------------------------------------------------------------------------
    // 수정 (일괄)
    // -------------------------------------------------------------------------

    /**
     * 상품 수정. 메인·부가정보 갱신 후, units/setComponents가 요청에 포함되면 해당 테이블 전체 삭제 후 일괄 INSERT.
     *
     * <p><b>프로세스</b></p>
     * <ol>
     *   <li>OM_PRODUCT_M UPDATE (메인 컬럼 + product_info JSONB). 영향 행 0이면 ERROR_NOT_FOUND</li>
     *   <li>request.units != null 이면: OM_PRODUCT_UNIT 해당 product_id 전부 DELETE 후, 비어있지 않으면 INSERT</li>
     *   <li>request.setComponents != null 이면: OM_PRODUCT_SET_COMPONENT 해당 product_id 전부 DELETE 후, 비어있지 않으면 INSERT</li>
     * </ol>
     * <p>units/setComponents가 null이면 기존 데이터 유지. 빈 리스트면 기존 삭제만(0건 INSERT).</p>
     *
     * @param productId 상품 ID
     * @param request   수정 내용. units/setComponents는 null=유지, 비어있지 않으면 전체 교체
     * @param updatedBy 수정자 사용자 ID
     * @throws IllegalArgumentException 상품이 없을 때. message=MessageKeys.ERROR_NOT_FOUND
     */
    @Transactional
    public void updateProduct(String productId, ProductUpdateRequest request, String updatedBy) {
        int rows = productMapper.updateProduct(productId, request, updatedBy);
        if (rows == 0) {
            throw new IllegalArgumentException(MessageKeys.ERROR_NOT_FOUND);
        }

        // 단위/바코드: 요청에 포함되면 기존 전체 삭제 후 일괄 INSERT (전체 교체 정책)
        if (request.getUnits() != null) {
            productUnitMapper.deleteByProductId(productId);
            if (!request.getUnits().isEmpty()) {
                productUnitMapper.insertAll(productId, request.getUnits());
            }
        }
        // 세트 구성품: 요청에 포함되면 기존 전체 삭제 후 일괄 INSERT
        if (request.getSetComponents() != null) {
            productSetComponentMapper.deleteByProductId(productId);
            if (!request.getSetComponents().isEmpty()) {
                productSetComponentMapper.insertAll(productId, request.getSetComponents());
            }
        }
    }

    // -------------------------------------------------------------------------
    // 필드 단건 수정 (목록 그리드 셀 편집)
    // -------------------------------------------------------------------------

    /**
     * 상품 필드 단건 수정. 목록 그리드에서 셀 편집 시 호출. EDITABLE_FIELDS만 허용.
     *
     * <p><b>프로세스</b></p>
     * <ol>
     *   <li>field가 EDITABLE_FIELDS에 없으면 ERROR_FIELD_NOT_EDITABLE</li>
     *   <li>baseUnitCd인 경우: OM_PRODUCT_M이 아닌 OM_PRODUCT_UNIT의 기본단위(is_base_unit=true) 행만 unit_cd 갱신</li>
     *   <li>그 외: OM_PRODUCT_M의 해당 컬럼만 UPDATE. 영향 행 0이면 ERROR_NOT_FOUND</li>
     * </ol>
     *
     * @param productId 상품 ID
     * @param field     수정할 필드명. EDITABLE_FIELDS 중 하나 (productCd, productNm, productType, baseUnitCd, isSale, isDisplay)
     * @param value     새 값 (타입에 맞게 매퍼에서 처리)
     * @param updatedBy 수정자 사용자 ID
     * @throws IllegalArgumentException 허용되지 않은 필드 또는 상품 없음. message=MessageKeys 상수
     */
    @Transactional
    public void updateProductField(String productId, String field, Object value, String updatedBy) {
        if (!EDITABLE_FIELDS.contains(field)) {
            throw new IllegalArgumentException(MessageKeys.ERROR_FIELD_NOT_EDITABLE);
        }
        // baseUnitCd는 OM_PRODUCT_M 컬럼이 아니라 OM_PRODUCT_UNIT의 기본단위 행 unit_cd
        if ("baseUnitCd".equals(field)) {
            productUnitMapper.updateBaseUnitCd(productId, (String) value);
            return;
        }
        int rows = productMapper.updateProductField(productId, field, value, updatedBy);
        if (rows == 0) {
            throw new IllegalArgumentException(MessageKeys.ERROR_NOT_FOUND);
        }
    }

    // -------------------------------------------------------------------------
    // 엑셀 bulk 업로드
    // -------------------------------------------------------------------------

    /**
     * 엑셀 파일로 상품 일괄 등록. 3개 시트(Products, Units, SetComponents)를 모두 확인해 데이터 있는 시트만 순서대로 처리.
     * <p><b>프로세스</b></p>
     * <ul>
     *   <li><b>가. Products 시트</b> 데이터 있으면: 선택 법인과 상품코드 비교, 중복 스킵·신규만 등록. 중복된 상품코드는 결과로 반환.</li>
     *   <li><b>나. Units 시트</b> 데이터 있으면: Products 처리 후, 상품 테이블에 없는 상품코드 행은 스킵. 해당 상품의 기존 단위 삭제 후 엑셀 행 일괄 INSERT.</li>
     *   <li><b>다. SetComponents 시트</b> 데이터 있으면: Products 처리 후, 상품 테이블에 없는 행은 스킵. 해당 상품의 기존 세트 구성 삭제 후 엑셀 행 일괄 INSERT.</li>
     * </ul>
     *
     * @param excelInput    엑셀 입력 스트림 (.xlsx)
     * @param corporationCd 등록할 법인코드 (현재 선택된 법인)
     * @param createdBy     생성자 사용자 ID
     * @return 등록된 상품 수, 스킵된 상품코드 목록(중복)
     */
    @Transactional(rollbackFor = Exception.class)
    public BulkImportResult bulkImport(InputStream excelInput, String corporationCd, String createdBy, String mode) {
        if (isBlank(corporationCd)) {
            throw new IllegalArgumentException(MessageKeys.PRODUCTS_CORPORATION_CD_REQUIRED);
        }
        String m = (mode != null && !mode.isEmpty()) ? mode : ProductExcelParser.MODE_FULL;
        ProductExcelParser.ParsedBulkData parsed = excelParser.parse(excelInput, corporationCd, m);

        if (ProductExcelParser.MODE_UNITS_ONLY.equalsIgnoreCase(m)) {
            return bulkImportUnitsOnly(corporationCd, parsed.units);
        }
        if (ProductExcelParser.MODE_SET_ONLY.equalsIgnoreCase(m)) {
            return bulkImportSetOnly(corporationCd, parsed.setComponents);
        }

        // full: 3개 시트 중 데이터 있는 것만 순서대로 처리. (corpCd, productCd) → productId 조회용(신규+DB 캐시)
        // 키는 trim 통일로 재업로드 시(상품 스킵만 되어도) 단위/세트 행에서 동일 상품 조회 가능
        java.util.Map<String, String> productIdByCorpCode = new java.util.HashMap<>();
        java.util.function.BiFunction<String, String, String> toKey = (c, p) ->
            (c != null ? c.trim() : "") + "\t" + (p != null ? p.trim() : "");

        int productInsertCount = 0;
        List<String> skippedProductCodes = new ArrayList<>();

        // 가. Products 시트에 데이터가 있는 경우
        List<ProductBulkInsertRow> allProducts = parsed.products;
        if (!allProducts.isEmpty()) {
            Set<String> corpCodeKeys = new HashSet<>();
            for (ProductBulkInsertRow r : allProducts) {
                if (isBlank(r.getProductCd()) || isBlank(r.getProductNm())) {
                    throw new IllegalArgumentException(MessageKeys.PRODUCTS_EXCEL_COLUMN_REQUIRED);
                }
                String key = toKey.apply(r.getCorporationCd(), r.getProductCd());
                if (!corpCodeKeys.add(key)) {
                    throw new IllegalArgumentException(MessageKeys.PRODUCTS_EXCEL_DUPLICATE_PRODUCT);
                }
            }

            List<ProductBulkInsertRow> toInsert = new ArrayList<>();
            for (ProductBulkInsertRow r : allProducts) {
                String corpCd = r.getCorporationCd() != null ? r.getCorporationCd().trim() : null;
                String productCd = r.getProductCd() != null ? r.getProductCd().trim() : null;
                String existingId = productMapper.selectProductIdByCorporationAndCode(corpCd, productCd);
                if (existingId != null) {
                    skippedProductCodes.add(r.getProductCd());
                    productIdByCorpCode.put(toKey.apply(corpCd, productCd), existingId);
                    continue;
                }
                toInsert.add(r);
            }

            for (ProductBulkInsertRow r : toInsert) {
                r.setProductId(generateProductId());
                r.setCreatedBy(createdBy);
            }
            for (ProductBulkInsertRow r : toInsert) {
                productIdByCorpCode.put(toKey.apply(r.getCorporationCd(), r.getProductCd()), r.getProductId());
            }

            if (!toInsert.isEmpty()) {
                productMapper.insertBatch(toInsert);
                productInsertCount = toInsert.size();
            }
        }

        // (corpCd, productCd) → productId: 맵에 없으면 DB 조회 후 캐시. 키·DB 인자 모두 trim
        java.util.function.BiFunction<String, String, String> resolveProductId = (corpCd, productCd) -> {
            String c = corpCd != null ? corpCd.trim() : null;
            String p = productCd != null ? productCd.trim() : null;
            String key = toKey.apply(c, p);
            if (productIdByCorpCode.containsKey(key)) return productIdByCorpCode.get(key);
            String id = productMapper.selectProductIdByCorporationAndCode(c, p);
            if (id != null) productIdByCorpCode.put(key, id);
            return id;
        };

        // 나. Units 시트에 데이터가 있는 경우: 상품코드 없으면 스킵. 상품별 기존 단위 삭제 후 일괄 등록
        // 조회는 요청 법인(corporationCd)으로 통일해 재업로드 시 맵/DB 조회 일치
        if (!parsed.units.isEmpty()) {
            java.util.Map<String, List<UnitBulkInsertRow>> unitsByProductId = new java.util.LinkedHashMap<>();
            for (UnitExcelRow u : parsed.units) {
                String productId = resolveProductId.apply(corporationCd, u.getProductCd());
                if (productId == null) continue;
                UnitBulkInsertRow row = new UnitBulkInsertRow();
                row.setProductId(productId);
                row.setUnitCd(u.getUnitCd());
                row.setBarcode(u.getBarcode());
                row.setPackQty(u.getPackQty() != null ? u.getPackQty() : 1);
                row.setIsBaseUnit(Boolean.TRUE.equals(u.getIsBaseUnit()));
                unitsByProductId.computeIfAbsent(productId, k -> new ArrayList<>()).add(row);
            }
            for (java.util.Map.Entry<String, List<UnitBulkInsertRow>> e : unitsByProductId.entrySet()) {
                productUnitMapper.deleteByProductId(e.getKey());
                if (!e.getValue().isEmpty()) {
                    productUnitMapper.insertBatch(e.getValue());
                }
            }
        }

        // 다. SetComponents 시트에 데이터가 있는 경우: 상품코드 없으면 스킵. 상품별 기존 세트 삭제 후 일괄 등록
        // 조회는 요청 법인(corporationCd)으로 통일
        if (!parsed.setComponents.isEmpty()) {
            java.util.Map<String, List<SetComponentBulkInsertRow>> setByParentId = new java.util.LinkedHashMap<>();
            for (SetComponentExcelRow s : parsed.setComponents) {
                String parentId = resolveProductId.apply(corporationCd, s.getParentProductCd());
                if (parentId == null) continue;
                String componentId = resolveProductId.apply(corporationCd, s.getComponentProductCd());
                if (componentId == null) continue;
                SetComponentBulkInsertRow row = new SetComponentBulkInsertRow();
                row.setProductId(parentId);
                row.setComponentProductId(componentId);
                row.setComponentQty(s.getComponentQty() != null ? s.getComponentQty() : 1);
                setByParentId.computeIfAbsent(parentId, k -> new ArrayList<>()).add(row);
            }
            for (java.util.Map.Entry<String, List<SetComponentBulkInsertRow>> e : setByParentId.entrySet()) {
                productSetComponentMapper.deleteByProductId(e.getKey());
                if (!e.getValue().isEmpty()) {
                    productSetComponentMapper.insertBatch(e.getValue());
                }
            }
        }

        return new BulkImportResult(productInsertCount, skippedProductCodes.size(), skippedProductCodes);
    }

    /**
     * 기존 상품에 단위/바코드만 추가. Units 시트만 읽고, product_cd는 DB에 존재해야 함.
     */
    private BulkImportResult bulkImportUnitsOnly(String corporationCd, List<UnitExcelRow> units) {
        if (units == null || units.isEmpty()) {
            return new BulkImportResult(0);
        }
        List<UnitBulkInsertRow> unitRows = new ArrayList<>();
        for (UnitExcelRow u : units) {
            String productId = productMapper.selectProductIdByCorporationAndCode(corporationCd, u.getProductCd());
            if (productId == null) {
                throw new IllegalArgumentException(MessageKeys.PRODUCTS_EXCEL_PRODUCT_NOT_FOUND);
            }
            UnitBulkInsertRow row = new UnitBulkInsertRow();
            row.setProductId(productId);
            row.setUnitCd(u.getUnitCd());
            row.setBarcode(u.getBarcode());
            row.setPackQty(u.getPackQty() != null ? u.getPackQty() : 1);
            row.setIsBaseUnit(Boolean.TRUE.equals(u.getIsBaseUnit()));
            unitRows.add(row);
        }
        productUnitMapper.insertBatch(unitRows);
        return new BulkImportResult(unitRows.size());
    }

    /**
     * 기존 세트 상품에 구성품만 추가. SetComponents 시트만 읽고, parent/component는 DB에 존재해야 함. 중복 행은 스킵.
     */
    private BulkImportResult bulkImportSetOnly(String corporationCd, List<SetComponentExcelRow> setComponents) {
        if (setComponents == null || setComponents.isEmpty()) {
            return new BulkImportResult(0);
        }
        List<SetComponentBulkInsertRow> setRows = new ArrayList<>();
        for (SetComponentExcelRow s : setComponents) {
            String parentId = productMapper.selectProductIdByCorporationAndCode(corporationCd, s.getParentProductCd());
            if (parentId == null) {
                throw new IllegalArgumentException(MessageKeys.PRODUCTS_EXCEL_COMPONENT_NOT_FOUND);
            }
            String componentId = productMapper.selectProductIdByCorporationAndCode(
                    s.getComponentCorporationCd() != null ? s.getComponentCorporationCd() : corporationCd,
                    s.getComponentProductCd());
            if (componentId == null) {
                throw new IllegalArgumentException(MessageKeys.PRODUCTS_EXCEL_COMPONENT_NOT_FOUND);
            }
            SetComponentBulkInsertRow row = new SetComponentBulkInsertRow();
            row.setProductId(parentId);
            row.setComponentProductId(componentId);
            row.setComponentQty(s.getComponentQty() != null ? s.getComponentQty() : 1);
            setRows.add(row);
        }
        productSetComponentMapper.insertBatchOrIgnore(setRows);
        return new BulkImportResult(setRows.size());
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
