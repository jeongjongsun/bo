package com.shopeasy.service;

import com.shopeasy.dto.ProductBulkInsertRow;
import com.shopeasy.dto.ProductExportRow;
import com.shopeasy.dto.SetComponentExcelRow;
import com.shopeasy.dto.UnitExcelRow;
import com.shopeasy.api.MessageKeys;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 상품 엑셀 업로드 파서. 시트 "Products", "Units", "SetComponents" 읽기.
 * 법인코드는 양식에 없으며, 등록 시 선택된 법인으로 일괄 적용.
 * docs/menu/상품관리_엑셀업로드.md 양식 준수.
 */
@Component
public class ProductExcelParser {

    private static final String SHEET_PRODUCTS = "Products";
    private static final String SHEET_UNITS = "Units";
    private static final String SHEET_SET_COMPONENTS = "SetComponents";

    /** 헤더 문자열(한/영/키) → 컬럼 id 매핑. 괄호 안 힌트 제거 후 매칭 */
    private static final Map<String, String> HEADER_TO_ID = new LinkedHashMap<>();
    static {
        // Products (법인코드 없음)
        putHeader("product_cd", "상품코드", "Product Code");
        putHeader("product_nm", "상품명", "Product Name");
        putHeader("product_type", "상품유형", "Product Type");
        putHeader("base_unit_cd", "기본단위코드", "Base Unit Code");
        putHeader("is_sale", "판매여부", "Is Sale");
        putHeader("is_display", "전시여부", "Is Display");
        putHeader("product_en_nm", "상품영문명", "Product Name (EN)");
        putHeader("category_cd", "카테고리코드", "Category Code");
        putHeader("brand_cd", "브랜드코드", "Brand Code");
        putHeader("cost_price", "원가", "Cost Price");
        putHeader("supply_price", "공급가", "Supply Price");
        putHeader("tax_type", "과세유형", "Tax Type");
        putHeader("safety_stock_qty", "안전재고", "Safety Stock Qty");
        putHeader("min_order_qty", "최소주문수량", "Min Order Qty");
        putHeader("max_order_qty", "최대주문수량", "Max Order Qty");
        putHeader("sort_order", "정렬순서", "Sort Order");
        putHeader("description", "상품설명", "Description");
        putHeader("image_url", "이미지URL", "Image URL");
        putHeader("remark", "비고", "Remark");
        // Units
        putHeader("product_cd", "상품코드", "Product Code");
        putHeader("unit_cd", "단위코드", "Unit Code");
        putHeader("barcode", "바코드", "Barcode");
        putHeader("pack_qty", "입수량", "Pack Qty");
        putHeader("is_base_unit", "기본단위", "Is Base Unit");
        // SetComponents
        putHeader("parent_product_cd", "세트상품코드", "Parent Product Code");
        putHeader("component_product_cd", "구성품상품코드", "Component Product Code");
        putHeader("component_qty", "구성품수량", "Component Qty");
    }
    private static void putHeader(String id, String ko, String en) {
        HEADER_TO_ID.put(id.toLowerCase(), id);
        HEADER_TO_ID.put(ko.trim().toLowerCase(), id);
        HEADER_TO_ID.put(en.trim().toLowerCase(), id);
    }

    /** 양식 헤더 라벨 (ko/en). product_type, is_* 에는 힌트 포함 */
    private static final String[][] PRODUCTS_HEADERS_KO = {
        {"상품코드", "상품명", "상품유형 (SINGLE 또는 SET)", "기본단위코드", "판매여부 (Y 또는 N)", "전시여부 (Y 또는 N)",
         "상품영문명", "카테고리코드", "브랜드코드", "원가", "공급가", "과세유형", "안전재고", "최소주문수량", "최대주문수량",
         "정렬순서", "상품설명", "이미지URL", "비고"}
    };
    private static final String[][] PRODUCTS_HEADERS_EN = {
        {"Product Code", "Product Name", "Product Type (SINGLE or SET)", "Base Unit Code", "Is Sale (Y or N)", "Is Display (Y or N)",
         "Product Name (EN)", "Category Code", "Brand Code", "Cost Price", "Supply Price", "Tax Type", "Safety Stock Qty",
         "Min Order Qty", "Max Order Qty", "Sort Order", "Description", "Image URL", "Remark"}
    };
    private static final String[][] UNITS_HEADERS_KO = {
        {"상품코드", "단위코드", "바코드", "입수량", "기본단위 (Y 또는 N)"}
    };
    private static final String[][] UNITS_HEADERS_EN = {
        {"Product Code", "Unit Code", "Barcode", "Pack Qty", "Is Base Unit (Y or N)"}
    };
    private static final String[][] SET_HEADERS_KO = {
        {"세트상품코드", "구성품상품코드", "구성품수량"}
    };
    private static final String[][] SET_HEADERS_EN = {
        {"Parent Product Code", "Component Product Code", "Component Qty"}
    };

    /**
     * 파싱 결과. productId는 서비스에서 설정. corporationCd는 parse 시 파라미터로 일괄 적용.
     */
    public static class ParsedBulkData {
        public List<ProductBulkInsertRow> products = new ArrayList<>();
        public List<UnitExcelRow> units = new ArrayList<>();
        public List<SetComponentExcelRow> setComponents = new ArrayList<>();
    }

    /** 등록 모드: 상품 일괄(full), 단위/바코드만(unitsOnly), 세트 구성만(setOnly) */
    public static final String MODE_FULL = "full";
    public static final String MODE_UNITS_ONLY = "unitsOnly";
    public static final String MODE_SET_ONLY = "setOnly";

    /**
     * 엑셀 스트림 파싱. mode에 따라 읽는 시트만 다름.
     *
     * @param in             엑셀 입력 (.xlsx)
     * @param corporationCd 등록할 법인코드 (현재 선택된 법인)
     * @param mode           full=Products 필수+Units/Set 선택, unitsOnly=Units 시트만, setOnly=SetComponents 시트만
     * @return 파싱된 상품·단위·세트구성 목록 (productId는 null)
     */
    public ParsedBulkData parse(InputStream in, String corporationCd, String mode) {
        ParsedBulkData result = new ParsedBulkData();
        String m = (mode != null && !mode.isEmpty()) ? mode : MODE_FULL;
        try (XSSFWorkbook wb = new XSSFWorkbook(in)) {
            if (MODE_UNITS_ONLY.equalsIgnoreCase(m)) {
                Sheet unitsSheet = wb.getSheet(SHEET_UNITS);
                if (unitsSheet == null) throw new IllegalArgumentException(MessageKeys.PRODUCTS_SHEET_UNITS_REQUIRED);
                parseUnitsSheet(unitsSheet, corporationCd, result.units);
                return result;
            }
            if (MODE_SET_ONLY.equalsIgnoreCase(m)) {
                Sheet setSheet = wb.getSheet(SHEET_SET_COMPONENTS);
                if (setSheet == null) throw new IllegalArgumentException(MessageKeys.PRODUCTS_SHEET_SET_REQUIRED);
                parseSetComponentsSheet(setSheet, corporationCd, result.setComponents);
                return result;
            }
            // full 모드: 3개 시트 모두 확인, 데이터 있는 시트만 파싱. Products 시트 없어도 Units/SetComponents만 처리 가능
            Sheet productsSheet = wb.getSheet(SHEET_PRODUCTS);
            if (productsSheet != null) parseProductsSheet(productsSheet, corporationCd, result.products);

            Sheet unitsSheet = wb.getSheet(SHEET_UNITS);
            if (unitsSheet != null) parseUnitsSheet(unitsSheet, corporationCd, result.units);

            Sheet setSheet = wb.getSheet(SHEET_SET_COMPONENTS);
            if (setSheet != null) parseSetComponentsSheet(setSheet, corporationCd, result.setComponents);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException(MessageKeys.PRODUCTS_EXCEL_PARSE_ERROR, e);
        }
        return result;
    }

    /**
     * 업로드 양식 엑셀 생성. 현재 선택 언어(ko/en)로 헤더 표시. 법인코드 컬럼 없음.
     * product_type, is_sale, is_display, is_base_unit 헤더에 입력 가능한 값 힌트 포함.
     *
     * @param lang 언어 코드 (ko, en). 기본 en
     */
    public byte[] createTemplate(String lang) {
        boolean ko = "ko".equalsIgnoreCase(lang != null ? lang : "");
        String[] pCols = ko ? PRODUCTS_HEADERS_KO[0] : PRODUCTS_HEADERS_EN[0];
        String[] uCols = ko ? UNITS_HEADERS_KO[0] : UNITS_HEADERS_EN[0];
        String[] sCols = ko ? SET_HEADERS_KO[0] : SET_HEADERS_EN[0];

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet productsSheet = wb.createSheet(SHEET_PRODUCTS);
            Row pHeader = productsSheet.createRow(0);
            for (int i = 0; i < pCols.length; i++) pHeader.createCell(i).setCellValue(pCols[i]);

            Sheet unitsSheet = wb.createSheet(SHEET_UNITS);
            Row uHeader = unitsSheet.createRow(0);
            for (int i = 0; i < uCols.length; i++) uHeader.createCell(i).setCellValue(uCols[i]);

            Sheet setSheet = wb.createSheet(SHEET_SET_COMPONENTS);
            Row sHeader = setSheet.createRow(0);
            for (int i = 0; i < sCols.length; i++) sHeader.createCell(i).setCellValue(sCols[i]);

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException(MessageKeys.PRODUCTS_EXCEL_PARSE_ERROR, e);
        }
    }

    /** 전체 엑셀 다운로드 헤더 (한글) */
    private static final String[] FULL_EXPORT_HEADERS_KO = {
        "상품 ID", "법인코드", "상품코드", "상품명", "상품유형",
        "판매가", "재고수량", "사은품여부", "판매여부", "전시여부", "기본단위",
        "상품영문명", "카테고리코드", "브랜드코드", "원가", "공급가", "과세유형",
        "안전재고", "최소주문수량", "최대주문수량", "정렬순서",
        "상품설명", "이미지URL", "비고",
        "생성일시", "수정일시", "생성자", "수정자"
    };
    /** 전체 엑셀 다운로드 헤더 (영문) */
    private static final String[] FULL_EXPORT_HEADERS_EN = {
        "Product ID", "Corporation Code", "Product Code", "Product Name", "Product Type",
        "Sale Price", "Stock Qty", "Is Gift", "Is Sale", "Is Display", "Base Unit Code",
        "Product Name (EN)", "Category Code", "Brand Code", "Cost Price", "Supply Price", "Tax Type",
        "Safety Stock Qty", "Min Order Qty", "Max Order Qty", "Sort Order",
        "Description", "Image URL", "Remark",
        "Created At", "Updated At", "Created By", "Updated By"
    };

    /**
     * OM_PRODUCT_M 전체 컬럼 엑셀 생성. 한 시트 "Products"에 모든 행·컬럼 출력.
     * 헤더는 lang(ko/en)에 따라 한글/영문 표시.
     *
     * @param rows 법인별 조회 결과 (selectProductListForExport)
     * @param lang 언어 코드 (ko, en). null/기타면 영문
     */
    public byte[] createFullExportExcel(List<ProductExportRow> rows, String lang) {
        boolean ko = lang != null && !lang.trim().isEmpty() && lang.trim().toLowerCase().startsWith("ko");
        String[] headers = ko ? FULL_EXPORT_HEADERS_KO : FULL_EXPORT_HEADERS_EN;
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Products");
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) headerRow.createCell(i).setCellValue(headers[i]);
            int rowIdx = 1;
            for (ProductExportRow r : rows) {
                Row row = sheet.createRow(rowIdx++);
                setCell(row, 0, r.getProductId());
                setCell(row, 1, r.getCorporationCd());
                setCell(row, 2, r.getProductCd());
                setCell(row, 3, r.getProductNm());
                setCell(row, 4, r.getProductType());
                setCellNumeric(row, 5, r.getSalePrice());
                setCellInt(row, 6, r.getStockQty());
                setCellBool(row, 7, r.getIsGift());
                setCellBool(row, 8, r.getIsSale());
                setCellBool(row, 9, r.getIsDisplay());
                setCell(row, 10, r.getBaseUnitCd());
                setCell(row, 11, r.getProductEnNm());
                setCell(row, 12, r.getCategoryCd());
                setCell(row, 13, r.getBrandCd());
                setCellNumeric(row, 14, r.getCostPrice());
                setCellNumeric(row, 15, r.getSupplyPrice());
                setCell(row, 16, r.getTaxType());
                setCellInt(row, 17, r.getSafetyStockQty());
                setCellInt(row, 18, r.getMinOrderQty());
                setCellInt(row, 19, r.getMaxOrderQty());
                setCellInt(row, 20, r.getSortOrder());
                setCell(row, 21, r.getDescription());
                setCell(row, 22, r.getImageUrl());
                setCell(row, 23, r.getRemark());
                setCell(row, 24, r.getCreatedAt());
                setCell(row, 25, r.getUpdatedAt());
                setCell(row, 26, r.getCreatedBy());
                setCell(row, 27, r.getUpdatedBy());
            }
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException(MessageKeys.PRODUCTS_EXCEL_PARSE_ERROR, e);
        }
    }

    private static void setCell(Row row, int col, String value) {
        if (value != null) row.createCell(col).setCellValue(value);
        else row.createCell(col);
    }

    private static void setCellNumeric(Row row, int col, java.math.BigDecimal value) {
        if (value != null) row.createCell(col).setCellValue(value.doubleValue());
        else row.createCell(col);
    }

    private static void setCellInt(Row row, int col, Integer value) {
        if (value != null) row.createCell(col).setCellValue(value);
        else row.createCell(col);
    }

    private static void setCellBool(Row row, int col, Boolean value) {
        if (value != null) row.createCell(col).setCellValue(value);
        else row.createCell(col);
    }

    private void parseProductsSheet(Sheet sheet, String corporationCd, List<ProductBulkInsertRow> out) {
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) return;
        Map<String, Integer> colIndex = columnIndexMapFromHeaderRow(headerRow);
        requireColumns(colIndex, "product_cd", "product_nm", "product_type");

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            String productCd = getCellString(row, colIndex.get("product_cd"));
            String productNm = getCellString(row, colIndex.get("product_nm"));
            String productType = getCellString(row, colIndex.get("product_type"));
            if (isBlank(productCd) && isBlank(productNm)) continue;

            ProductBulkInsertRow r = new ProductBulkInsertRow();
            r.setCorporationCd(corporationCd);
            r.setProductCd(trim(productCd));
            r.setProductNm(trim(productNm));
            // 상품유형: 지정 코드가 아니면 기본값 SINGLE
            String type = trim(productType);
            r.setProductType("SET".equalsIgnoreCase(type) ? "SET" : "SINGLE");
            r.setIsSale(parseBoolean(getCellString(row, colIndex.get("is_sale")), true));
            r.setIsDisplay(parseBoolean(getCellString(row, colIndex.get("is_display")), true));
            r.setProductInfoJson(buildProductInfoJson(row, colIndex));
            out.add(r);
        }
    }

    private String buildProductInfoJson(Row row, Map<String, Integer> colIndex) {
        Map<String, Object> info = new HashMap<>();
        putIfPresent(info, "product_en_nm", getCellString(row, colIndex.get("product_en_nm")));
        putIfPresent(info, "category_cd", getCellString(row, colIndex.get("category_cd")));
        putIfPresent(info, "brand_cd", getCellString(row, colIndex.get("brand_cd")));
        putIfPresent(info, "cost_price", getCellNumeric(row, colIndex.get("cost_price")));
        putIfPresent(info, "supply_price", getCellNumeric(row, colIndex.get("supply_price")));
        putIfPresent(info, "tax_type", getCellString(row, colIndex.get("tax_type")));
        putIfPresent(info, "safety_stock_qty", getCellInt(row, colIndex.get("safety_stock_qty")));
        putIfPresent(info, "min_order_qty", getCellInt(row, colIndex.get("min_order_qty")));
        putIfPresent(info, "max_order_qty", getCellInt(row, colIndex.get("max_order_qty")));
        putIfPresent(info, "sort_order", getCellInt(row, colIndex.get("sort_order")));
        putIfPresent(info, "description", getCellString(row, colIndex.get("description")));
        putIfPresent(info, "image_url", getCellString(row, colIndex.get("image_url")));
        putIfPresent(info, "remark", getCellString(row, colIndex.get("remark")));
        if (info.isEmpty()) return "{}";
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : info.entrySet()) {
            if (e.getValue() == null) continue;
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(e.getKey().replace("\"", "\\\"")).append("\":");
            if (e.getValue() instanceof Number) sb.append(e.getValue());
            else sb.append("\"").append(String.valueOf(e.getValue()).replace("\\", "\\\\").replace("\"", "\\\"")).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }

    private void putIfPresent(Map<String, Object> info, String key, Object value) {
        if (value != null && (value instanceof String ? !isBlank((String) value) : true)) {
            info.put(key, value);
        }
    }

    private void parseUnitsSheet(Sheet sheet, String corporationCd, List<UnitExcelRow> out) {
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) return;
        Map<String, Integer> colIndex = columnIndexMapFromHeaderRow(headerRow);
        requireColumns(colIndex, "product_cd", "unit_cd");

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            String productCd = getCellString(row, colIndex.get("product_cd"));
            String unitCd = getCellString(row, colIndex.get("unit_cd"));
            if (isBlank(unitCd)) continue;

            UnitExcelRow r = new UnitExcelRow();
            r.setCorporationCd(corporationCd);
            r.setProductCd(trim(productCd));
            r.setUnitCd(trim(unitCd));
            r.setBarcode(trim(getCellString(row, colIndex.get("barcode"))));
            r.setPackQty(getCellInt(row, colIndex.get("pack_qty")));
            r.setIsBaseUnit(parseBoolean(getCellString(row, colIndex.get("is_base_unit")), false));
            if (r.getPackQty() == null) r.setPackQty(1);
            out.add(r);
        }
    }

    private void parseSetComponentsSheet(Sheet sheet, String corporationCd, List<SetComponentExcelRow> out) {
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) return;
        Map<String, Integer> colIndex = columnIndexMapFromHeaderRow(headerRow);
        requireColumns(colIndex, "parent_product_cd", "component_product_cd");

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            String parentCd = getCellString(row, colIndex.get("parent_product_cd"));
            String compCd = getCellString(row, colIndex.get("component_product_cd"));
            if (isBlank(parentCd) || isBlank(compCd)) continue;

            SetComponentExcelRow r = new SetComponentExcelRow();
            r.setParentCorporationCd(corporationCd);
            r.setParentProductCd(trim(parentCd));
            r.setComponentCorporationCd(corporationCd);
            r.setComponentProductCd(trim(compCd));
            r.setComponentQty(getCellInt(row, colIndex.get("component_qty")));
            if (r.getComponentQty() == null) r.setComponentQty(1);
            out.add(r);
        }
    }

    /** 헤더 셀 값에서 괄호 앞까지 정규화 후 HEADER_TO_ID로 컬럼 id 조회 */
    private Map<String, Integer> columnIndexMapFromHeaderRow(Row headerRow) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            String raw = getCellString(headerRow, i);
            if (raw == null || raw.isEmpty()) continue;
            String normalized = raw.trim();
            int paren = normalized.indexOf(" (");
            if (paren > 0) normalized = normalized.substring(0, paren).trim();
            String id = HEADER_TO_ID.get(normalized.toLowerCase());
            if (id != null) map.put(id, i);
        }
        return map;
    }

    private void requireColumns(Map<String, Integer> colIndex, String... names) {
        for (String name : names) {
            if (!colIndex.containsKey(name)) {
                throw new IllegalArgumentException(MessageKeys.PRODUCTS_EXCEL_COLUMN_REQUIRED);
            }
        }
    }

    private static final DataFormatter DATA_FORMATTER = new DataFormatter();

    /** 셀을 표시 문자열로 읽음. 타입/재저장에 따른 불일치 방지(상품코드 등). */
    private static String getCellString(Row row, Integer col) {
        if (col == null) return null;
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        String raw = DATA_FORMATTER.formatCellValue(cell);
        return (raw == null || raw.isEmpty()) ? null : raw;
    }

    private static Double getCellNumeric(Row row, Integer col) {
        if (col == null) return null;
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) return cell.getNumericCellValue();
        if (cell.getCellType() == CellType.STRING) {
            String s = cell.getStringCellValue();
            if (s == null || s.isEmpty()) return null;
            try { return Double.parseDouble(s.trim()); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private static Integer getCellInt(Row row, Integer col) {
        Double n = getCellNumeric(row, col);
        if (n == null) return null;
        return n.intValue();
    }

    /** Y/N, true/false, 1/0 외 값이면 defaultValue 사용 (헤더에 입력 가능한 값만 적어둠) */
    private static boolean parseBoolean(String v, boolean defaultValue) {
        if (v == null || v.isEmpty()) return defaultValue;
        String t = v.trim().toLowerCase();
        if ("y".equals(t) || "true".equals(t) || "1".equals(t)) return true;
        if ("n".equals(t) || "false".equals(t) || "0".equals(t)) return false;
        return defaultValue;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }
}
