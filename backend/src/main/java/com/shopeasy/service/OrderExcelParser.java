package com.shopeasy.service;

import com.shopeasy.api.MessageKeys;
import com.shopeasy.dto.ManualOrderCreateRequest;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * 주문 일괄등록 엑셀 파서. 시트 "주문일괄등록" 읽어 주문번호(같은 값=한 주문)별로 ManualOrderCreateRequest 목록 생성.
 * 법인·판매유형·등록일은 양식에 없으며, API에서 화면 선택값/업로드일로 적용. docs/menu/주문관리.md 3.3 양식 준수.
 */
@Component
public class OrderExcelParser {

    private static final String SHEET_NAME = "주문일괄등록";

    /** 한글 헤더(괄호 힌트 제거) → 컬럼 id. 주문번호/주문그룹 둘 다 order_no로 매핑(구 양식 호환) */
    private static final Map<String, String> HEADER_TO_ID = new LinkedHashMap<>();
    static {
        put("order_no", "주문번호");
        put("order_no", "주문그룹");
    put("store_cd", "상점코드");
        put("order_dt", "주문일");
        put("receiver_nm", "수령인명");
        put("receiver_tel", "수령인연락처");
        put("receiver_mobile", "수령인휴대폰");
        put("receiver_zip", "수령인우편번호");
        put("receiver_addr", "수령인주소");
        put("receiver_addr2", "수령인상세주소");
        put("orderer_nm", "주문자명");
        put("orderer_tel", "주문자연락처");
        put("orderer_mobile", "주문자휴대폰");
        put("memo", "메모");
        put("delivery_fee", "배송비");
        put("payment_method_cd", "결제방법코드");
        put("product_cd", "상품코드");
        put("product_nm", "상품명");
        put("line_qty", "수량");
        put("line_amount", "금액");
        put("line_discount_amount", "할인금액");
    }
    private static void put(String id, String ko) {
        HEADER_TO_ID.put(ko.trim().toLowerCase(), id);
    }

    public static class ParsedOrderBulk {
        private final List<ManualOrderCreateRequest> orders = new ArrayList<>();
        /** 필수값 누락 등 검증 오류. 비어 있지 않으면 등록하지 않음 (orders는 비어 있을 수 있음) */
        private final List<String> validationErrors = new ArrayList<>();
        /** 필수값 오류로 등록 대상에서 제외된 주문(주문번호) 건수 */
        private int excludedOrderCount;
        public List<ManualOrderCreateRequest> getOrders() { return orders; }
        public List<String> getValidationErrors() { return validationErrors; }
        public int getExcludedOrderCount() { return excludedOrderCount; }
        public void setExcludedOrderCount(int excludedOrderCount) { this.excludedOrderCount = excludedOrderCount; }
    }

    /** 필수값 누락 메시지: orders.bulkImport.requiredFieldMissing|행번호|필드키 (클라이언트에서 번역) */
    private static final String REQUIRED_MISSING_PREFIX = "orders.bulkImport.requiredFieldMissing|";
    private static final String FIELD_ORDER_NO = "order_no";
    private static final String FIELD_STORE_CD = "store_cd";
    private static final String FIELD_PRODUCT_CD = "product_cd";
    private static final String FIELD_LINE_QTY = "line_qty";
    private static final String FIELD_LINE_AMOUNT = "line_amount";

    /**
     * 엑셀 스트림 파싱. 시트 "주문일괄등록"에서 데이터 행을 읽어 주문그룹별로 묶어 ManualOrderCreateRequest 목록 반환.
     *
     * @param in 엑셀 입력 (.xlsx)
     * @return 주문그룹별 주문 목록 (데이터 없으면 빈 목록)
     */
    public ParsedOrderBulk parse(InputStream in) {
        ParsedOrderBulk result = new ParsedOrderBulk();
        try (XSSFWorkbook wb = new XSSFWorkbook(in)) {
            Sheet sheet = wb.getSheet(SHEET_NAME);
            if (sheet == null) {
                throw new IllegalArgumentException(MessageKeys.ORDERS_EXCEL_SHEET_REQUIRED);
            }
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException(MessageKeys.ORDERS_EXCEL_COLUMN_REQUIRED);
            }
            Map<String, Integer> colIndex = columnIndexMapFromHeaderRow(headerRow);
            requireColumns(colIndex, "order_no", "store_cd", "product_cd", "line_qty", "line_amount");

            // 데이터 행 수집. 필수값 누락 시 validationErrors 추가 및 해당 주문번호는 등록 제외(orderNosWithErrors)
            List<Map<String, Object>> rows = new ArrayList<>();
            Set<String> orderNosWithErrors = new HashSet<>();
            int excelRowOneBased = 2;
            for (int i = 2; i <= sheet.getLastRowNum(); i++) {
                excelRowOneBased = i + 1;
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String orderNoVal = getCellString(row, colIndex.get("order_no"));
                if (isBlank(orderNoVal)) {
                    String productCdVal = trim(getCellString(row, colIndex.get("product_cd")));
                    String storeCdVal = trim(getCellString(row, colIndex.get("store_cd")));
                    Integer lineQtyVal = getCellInt(row, colIndex.get("line_qty"));
                    Double lineAmountVal = getCellNumeric(row, colIndex.get("line_amount"));
                    boolean hasAnyData = !isBlank(productCdVal) || !isBlank(storeCdVal)
                            || lineQtyVal != null || lineAmountVal != null;
                    if (hasAnyData) {
                        result.getValidationErrors().add(REQUIRED_MISSING_PREFIX + excelRowOneBased + "|" + FIELD_ORDER_NO);
                    }
                    continue;
                }
                String productCd = trim(getCellString(row, colIndex.get("product_cd")));
                String storeCd = trim(getCellString(row, colIndex.get("store_cd")));
                Integer lineQty = getCellInt(row, colIndex.get("line_qty"));
                Double lineAmount = getCellNumeric(row, colIndex.get("line_amount"));
                boolean rowOk = true;
                if (isBlank(productCd)) { result.getValidationErrors().add(REQUIRED_MISSING_PREFIX + excelRowOneBased + "|" + FIELD_PRODUCT_CD); orderNosWithErrors.add(orderNoVal.trim()); rowOk = false; }
                if (isBlank(storeCd)) { result.getValidationErrors().add(REQUIRED_MISSING_PREFIX + excelRowOneBased + "|" + FIELD_STORE_CD); orderNosWithErrors.add(orderNoVal.trim()); rowOk = false; }
                if (lineQty == null) { result.getValidationErrors().add(REQUIRED_MISSING_PREFIX + excelRowOneBased + "|" + FIELD_LINE_QTY); orderNosWithErrors.add(orderNoVal.trim()); rowOk = false; }
                if (lineAmount == null) { result.getValidationErrors().add(REQUIRED_MISSING_PREFIX + excelRowOneBased + "|" + FIELD_LINE_AMOUNT); orderNosWithErrors.add(orderNoVal.trim()); rowOk = false; }
                if (!rowOk) continue;
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("order_no", orderNoVal.trim());
                r.put("store_cd", storeCd);
                r.put("order_dt", trim(getCellString(row, colIndex.get("order_dt"))));
                r.put("receiver_nm", trim(getCellString(row, colIndex.get("receiver_nm"))));
                r.put("receiver_tel", trim(getCellString(row, colIndex.get("receiver_tel"))));
                r.put("receiver_mobile", trim(getCellString(row, colIndex.get("receiver_mobile"))));
                r.put("receiver_zip", trim(getCellString(row, colIndex.get("receiver_zip"))));
                r.put("receiver_addr", trim(getCellString(row, colIndex.get("receiver_addr"))));
                r.put("receiver_addr2", trim(getCellString(row, colIndex.get("receiver_addr2"))));
                r.put("orderer_nm", trim(getCellString(row, colIndex.get("orderer_nm"))));
                r.put("orderer_tel", trim(getCellString(row, colIndex.get("orderer_tel"))));
                r.put("orderer_mobile", trim(getCellString(row, colIndex.get("orderer_mobile"))));
                r.put("memo", trim(getCellString(row, colIndex.get("memo"))));
                r.put("delivery_fee", getCellNumeric(row, colIndex.get("delivery_fee")));
                r.put("payment_method_cd", trim(getCellString(row, colIndex.get("payment_method_cd"))));
                r.put("product_cd", trim(productCd));
                r.put("product_nm", trim(getCellString(row, colIndex.get("product_nm"))));
                r.put("line_qty", lineQty);
                r.put("line_amount", lineAmount);
                r.put("line_discount_amount", getCellNumeric(row, colIndex.get("line_discount_amount")));
                rows.add(r);
            }
            if (rows.isEmpty() && result.getValidationErrors().isEmpty()) {
                throw new IllegalArgumentException(MessageKeys.ORDERS_EXCEL_NO_DATA);
            }

            // 주문번호(같은 값=한 주문)별로 묶기. 필수값 오류가 있는 주문번호는 등록 대상에서 제외
            Map<String, List<Map<String, Object>>> byOrderNo = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
            for (Map<String, Object> r : rows) {
                String on = (String) r.get("order_no");
                byOrderNo.computeIfAbsent(on, k -> new ArrayList<>()).add(r);
            }

            for (Map.Entry<String, List<Map<String, Object>>> e : byOrderNo.entrySet()) {
                if (orderNosWithErrors.contains(e.getKey())) continue;
                ManualOrderCreateRequest req = buildRequest(e.getValue());
                if (req != null && req.getItems() != null && !req.getItems().isEmpty()) {
                    result.getOrders().add(req);
                }
            }
            result.setExcludedOrderCount(orderNosWithErrors.size());
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException(MessageKeys.ORDERS_EXCEL_PARSE_ERROR, e);
        }
        return result;
    }

    private ManualOrderCreateRequest buildRequest(List<Map<String, Object>> groupRows) {
        if (groupRows.isEmpty()) return null;
        Map<String, Object> first = groupRows.get(0);
        ManualOrderCreateRequest req = new ManualOrderCreateRequest();
        req.setOrderNo(str(first.get("order_no")));
        req.setMallCd(str(first.get("mall_cd")));
        req.setStoreCd(str(first.get("store_cd")));
        req.setOrderDt(str(first.get("order_dt")));
        req.setReceiverNm(str(first.get("receiver_nm")));
        req.setReceiverTel(str(first.get("receiver_tel")));
        req.setReceiverMobile(str(first.get("receiver_mobile")));
        req.setReceiverZip(str(first.get("receiver_zip")));
        req.setReceiverAddr(str(first.get("receiver_addr")));
        req.setReceiverAddr2(str(first.get("receiver_addr2")));
        req.setOrdererNm(str(first.get("orderer_nm")));
        req.setOrdererTel(str(first.get("orderer_tel")));
        req.setOrdererMobile(str(first.get("orderer_mobile")));
        req.setMemo(str(first.get("memo")));
        Object df = first.get("delivery_fee");
        if (df instanceof Number) req.setDeliveryFee(BigDecimal.valueOf(((Number) df).doubleValue()));
        req.setPaymentMethodCd(str(first.get("payment_method_cd")));

        List<ManualOrderCreateRequest.LineItem> items = new ArrayList<>();
        for (Map<String, Object> r : groupRows) {
            ManualOrderCreateRequest.LineItem line = new ManualOrderCreateRequest.LineItem();
            line.setProductCd(str(r.get("product_cd")));
            line.setProductNm(str(r.get("product_nm")));
            Integer qty = r.get("line_qty") instanceof Number ? ((Number) r.get("line_qty")).intValue() : 1;
            line.setLineQty(qty != null && qty > 0 ? qty : 1);
            Object amt = r.get("line_amount");
            line.setLineAmount(amt instanceof Number ? BigDecimal.valueOf(((Number) amt).doubleValue()) : BigDecimal.ZERO);
            Object disc = r.get("line_discount_amount");
            line.setLineDiscountAmount(disc instanceof Number ? BigDecimal.valueOf(((Number) disc).doubleValue()) : BigDecimal.ZERO);
            items.add(line);
        }
        req.setItems(items);
        return req;
    }

    private static String str(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private Map<String, Integer> columnIndexMapFromHeaderRow(Row headerRow) {
        Map<String, Integer> map = new LinkedHashMap<>();
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
                throw new IllegalArgumentException(MessageKeys.ORDERS_EXCEL_COLUMN_REQUIRED);
            }
        }
    }

    private static final DataFormatter DATA_FORMATTER = new DataFormatter();

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

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }
    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
