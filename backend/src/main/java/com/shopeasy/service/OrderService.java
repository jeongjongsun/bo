package com.shopeasy.service;

import com.shopeasy.api.PagedData;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.dto.OrderCountByStatusRow;
import com.shopeasy.dto.OrderCountsByStatusResponse;
import com.shopeasy.dto.OrderBulkItemRequest;
import com.shopeasy.dto.OrderBulkCountResult;
import com.shopeasy.dto.OrderBulkProcessResult;
import com.shopeasy.dto.OrderBulkRequest;
import com.shopeasy.dto.OrderDetailResponse;
import com.shopeasy.dto.OrderItemDetail;
import com.shopeasy.dto.OrderListItem;
import com.shopeasy.dto.OrderMasterDetail;
import com.shopeasy.dto.OrderProcessStatusRow;
import com.shopeasy.dto.OrderStatusLogItem;
import com.shopeasy.dto.OrderUpdateRequest;
import com.shopeasy.dto.ManualOrderCreateRequest;
import com.shopeasy.dto.ManualOrderCreateResponse;
import com.shopeasy.dto.OrderNoTriple;
import com.shopeasy.dto.MallStoreListItem;
import com.shopeasy.dto.OrderMasterInsertRow;
import com.shopeasy.dto.OrderItemInsertRow;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.dto.OrderBulkImportResult;
import com.shopeasy.entity.OmUserM;
import com.shopeasy.mapper.OmMallMMapper;
import com.shopeasy.mapper.OmOrderMMapper;
import com.shopeasy.mapper.OmProductMMapper;
import com.shopeasy.mapper.OmUserMMapper;
import org.apache.ibatis.cursor.Cursor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 주문(om_order_m) 도메인 서비스.
 * <ul>
 * <li>목록/상세 조회: 법인·상점·판매유형·처리상태·날짜 필터, 페이징, 삭제주문 필터</li>
 * <li>주문 수정: 마스터 + 라인 단위 UPDATE</li>
 * <li>일괄 처리: 출고보류(HOLD), 보류해제(ORDER_RECEIVED), 주문서 처리(PROCESSING+합포장번호), 라인
 * 삭제</li>
 * <li>주문서 처리: 상점+수령인 동일 주문끼리 동일 합포장번호 부여, 시퀀스 채번, 배치 UPDATE</li>
 * </ul>
 * 파티션(om_order_m_yyyy_mm) 체크는 주문서 등록(INSERT) 시에만 필요하며, 수정/일괄처리에서는 호출하지 않음.
 */
@Service
public class OrderService {

    /** 합포장번호 + 처리상태 일괄 UPDATE 시 배치 크기. 크면 DB round-trip 감소 (2000 권장). */
    private static final int BULK_ORDER_PROCESS_BATCH_SIZE = 2000;
    /** 마스터 조회 시 키 목록이 이 크기 초과면 청크 단위로 나누어 조회 (파라미터/결과 크기 완화). */
    private static final int MASTER_SELECT_CHUNK_SIZE = 2000;
    /** order_info.registrationType: 수기/수집/엑셀업로드 */
    public static final String REGISTRATION_TYPE_MANUAL = "MANUAL";
    public static final String REGISTRATION_TYPE_COLLECTION = "COLLECTION";
    public static final String REGISTRATION_TYPE_EXCEL_UPLOAD = "EXCEL_UPLOAD";

    private final OmOrderMMapper orderMapper;
    private final OmUserMMapper userMapper;
    private final OmProductMMapper productMapper;
    private final OmMallMMapper mallMapper;
    private final OrderExcelParser orderExcelParser;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderService(OmOrderMMapper orderMapper, OmUserMMapper userMapper, OmProductMMapper productMapper,
                        OmMallMMapper mallMapper, OrderExcelParser orderExcelParser) {
        this.orderMapper = orderMapper;
        this.userMapper = userMapper;
        this.productMapper = productMapper;
        this.mallMapper = mallMapper;
        this.orderExcelParser = orderExcelParser;
    }

    /**
     * 주문 목록 (라인 단위) 페이징 조회.
     * 정렬: order_id DESC, line_no ASC. 날짜 필터는 dateType에 따라 등록일(REGIST_DT) 또는
     * 주문일(ORDER_DT) 적용.
     *
     * @param corporationCd      법인코드 (필수, blank면 빈 목록 반환)
     * @param storeId            상점 PK (선택, null이면 전체)
     * @param salesTypeCd        판매유형 (선택, null/blank면 전체)
     * @param orderProcessStatus 주문처리상태 (선택, null/blank면 전체)
     * @param dateType           "REGIST_DT"면 등록일 기준, 그 외는 주문일 기준
     * @param orderDtFrom        날짜 범위 시작 (yyyy-MM-dd)
     * @param orderDtTo          날짜 범위 종료 (yyyy-MM-dd)
     * @param showDeletedOnly    true면 삭제된 라인만, false면 미삭제만
     * @param page               0-based 페이지 번호
     * @param size               페이지 크기 (최대 10000으로 제한)
     * @return PagedData (items, total, totalPages, first, last 등)
     */
    public PagedData<OrderListItem> getOrderList(
            String corporationCd,
            Long storeId,
            String salesTypeCd,
            String orderProcessStatus,
            String dateType,
            String orderDtFrom,
            String orderDtTo,
            Boolean showDeletedOnly,
            String searchColumn,
            String searchKeyword,
            int page,
            int size,
            Boolean minimalColumns) {

        if (corporationCd == null || corporationCd.isBlank()) {
            return new PagedData<>(List.of(), page, size, 0L, 0, true, true, null);
        }
        if (size > 10000)
            size = 10000; // DB/메모리 부담 방지

        String resolvedDateType = resolveDateType(dateType);
        int offset = page * size;
        boolean deletedOnly = Boolean.TRUE.equals(showDeletedOnly); // null이면 false
        String trimmedSalesTypeCd = (salesTypeCd != null && !salesTypeCd.isBlank()) ? salesTypeCd.trim() : null;
        String trimmedStatus = (orderProcessStatus != null && !orderProcessStatus.isBlank()) ? orderProcessStatus.trim()
                : null;
        String trimmedSearchColumn = (searchColumn != null && !searchColumn.isBlank()) ? searchColumn.trim() : null;
        String trimmedSearchKeyword = (searchKeyword != null && !searchKeyword.isBlank()) ? searchKeyword.trim() : null;

        long total = orderMapper.selectOrderListCount(corporationCd.trim(), storeId, trimmedSalesTypeCd,
                trimmedStatus, resolvedDateType, orderDtFrom, orderDtTo, deletedOnly, trimmedSearchColumn,
                trimmedSearchKeyword);
        boolean useMinimal = Boolean.TRUE.equals(minimalColumns);
        List<OrderListItem> items = useMinimal
                ? orderMapper.selectOrderListMinimal(
                        corporationCd.trim(), storeId, trimmedSalesTypeCd, trimmedStatus,
                        resolvedDateType, orderDtFrom, orderDtTo, deletedOnly, trimmedSearchColumn, trimmedSearchKeyword,
                        offset, size)
                : orderMapper.selectOrderList(
                        corporationCd.trim(), storeId, trimmedSalesTypeCd, trimmedStatus,
                        resolvedDateType, orderDtFrom, orderDtTo, deletedOnly, trimmedSearchColumn, trimmedSearchKeyword,
                        offset, size);

        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PagedData<>(items, page, size, total, totalPages,
                page == 0, page >= Math.max(0, totalPages - 1), null); // first, last
    }

    /**
     * 주문 목록 전체 엑셀 다운로드.
     * 페이지 크기와 무관하게 현재 필터 조건의 전체 라인을 배치 조회하여 xlsx를 출력 스트림으로 바로 쓴다.
     */
    @Transactional(readOnly = true)
    public void streamOrderListExcel(
            String corporationCd,
            Long storeId,
            String salesTypeCd,
            String orderProcessStatus,
            String dateType,
            String orderDtFrom,
            String orderDtTo,
            Boolean showDeletedOnly,
            String searchColumn,
            String searchKeyword,
            String lang,
            OutputStream outputStream) throws IOException {
        // TODO: 운영 이슈 발생 시 full export 동시 실행 1건 제한(락/큐) 적용 검토
        if (corporationCd == null || corporationCd.isBlank()) {
            throw new IllegalArgumentException("orders.corporation_required");
        }

        String corp = corporationCd.trim();
        String resolvedDateType = resolveDateType(dateType);
        boolean deletedOnly = Boolean.TRUE.equals(showDeletedOnly);
        String trimmedSalesTypeCd = (salesTypeCd != null && !salesTypeCd.isBlank()) ? salesTypeCd.trim() : null;
        String trimmedStatus = (orderProcessStatus != null && !orderProcessStatus.isBlank()) ? orderProcessStatus.trim()
                : null;
        String trimmedSearchColumn = (searchColumn != null && !searchColumn.isBlank()) ? searchColumn.trim() : null;
        String trimmedSearchKeyword = (searchKeyword != null && !searchKeyword.isBlank()) ? searchKeyword.trim() : null;

        boolean isKo = lang != null && lang.toLowerCase().startsWith("ko");
        String[] headers = isKo
                ? new String[] { "주문번호", "라인번호", "상품별주문번호", "합포장번호", "쇼핑몰코드", "쇼핑몰명", "상점코드", "상점명", "주문일",
                        "등록일", "주문처리상태", "판매구분", "주문타입", "상품코드", "상품명", "수량", "금액", "할인금액", "수령인",
                        "수령인 연락처", "수령인 휴대전화", "배송지 주소", "배송지 상세", "우편번호", "생성일시", "생성자" }
                : new String[] { "Order No", "Line No", "Item Order No", "Combined Ship No", "Mall Code", "Mall Name", "Store Code",
                        "Store Name", "Order Date", "Regist Date", "Order Process Status", "Sales Type", "Order Type", "Product Code",
                        "Product Name", "Qty", "Amount", "Discount Amount", "Receiver", "Receiver Tel", "Receiver Mobile",
                        "Receiver Address", "Receiver Address 2", "Receiver Zip", "Created At", "Created By" };

        try (SXSSFWorkbook wb = new SXSSFWorkbook(200);
                Cursor<OrderListItem> cursor = orderMapper.selectOrderListCursorForExport(
                        corp, storeId, trimmedSalesTypeCd, trimmedStatus, resolvedDateType,
                        orderDtFrom, orderDtTo, deletedOnly, trimmedSearchColumn, trimmedSearchKeyword)) {
            wb.setCompressTempFiles(true);
            Sheet sheet = wb.createSheet("orders");
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            int rowIndex = 1;
            for (OrderListItem item : cursor) {
                Row row = sheet.createRow(rowIndex++);
                int col = 0;
                writeCell(row, col++, item.getOrderNo());
                writeCell(row, col++, item.getLineNo());
                writeCell(row, col++, item.getItemOrderNo());
                writeCell(row, col++, item.getCombinedShipNo());
                writeCell(row, col++, item.getMallCd());
                writeCell(row, col++, item.getMallNm());
                writeCell(row, col++, item.getStoreCd());
                writeCell(row, col++, item.getStoreNm());
                writeCell(row, col++, item.getOrderDt());
                writeCell(row, col++, item.getRegistDt());
                writeCell(row, col++, item.getOrderProcessStatus());
                writeCell(row, col++, item.getSalesTypeCd());
                writeCell(row, col++, item.getOrderTypeCd());
                writeCell(row, col++, item.getProductCd());
                writeCell(row, col++, item.getProductNm());
                writeCell(row, col++, item.getLineQty());
                writeCell(row, col++, item.getLineAmount());
                writeCell(row, col++, item.getLineDiscountAmount());
                writeCell(row, col++, item.getReceiverNm());
                writeCell(row, col++, item.getReceiverTel());
                writeCell(row, col++, item.getReceiverMobile());
                writeCell(row, col++, item.getReceiverAddr());
                writeCell(row, col++, item.getReceiverAddr2());
                writeCell(row, col++, item.getReceiverZip());
                writeCell(row, col++, item.getCreatedAt());
                writeCell(row, col, item.getCreatedBy());
            }

            wb.write(outputStream);
            outputStream.flush();
            wb.dispose();
        }
    }

    /**
     * 주문 처리상태별 라인 건수 (목록 화면 툴바 탭 표시용).
     * 법인·상점·판매유형·날짜 필터 적용. 삭제된 라인 건수는 별도 조회하여 deletedCount로 설정.
     *
     * @return total(전체 라인 수), 상태별 counts, deletedCount
     */
    public OrderCountsByStatusResponse getOrderCountsByStatus(
            String corporationCd, Long storeId, String salesTypeCd, String dateType, String orderDtFrom,
            String orderDtTo) {
        if (corporationCd == null || corporationCd.isBlank()) {
            return new OrderCountsByStatusResponse(0L, new HashMap<>());
        }
        String resolvedDateType = resolveDateType(dateType);
        String trimmedSalesTypeCd = (salesTypeCd != null && !salesTypeCd.isBlank()) ? salesTypeCd.trim() : null;
        List<OrderCountByStatusRow> rows = orderMapper.selectOrderCountByStatus(
                corporationCd.trim(), storeId, trimmedSalesTypeCd, resolvedDateType, orderDtFrom, orderDtTo);
        long total = 0L;
        Map<String, Long> counts = new HashMap<>();
        for (OrderCountByStatusRow row : rows) {
            if (row.getOrderProcessStatus() != null && row.getCount() != null) {
                counts.put(row.getOrderProcessStatus(), row.getCount());
                total += row.getCount();
            }
        }
        // 삭제된 라인 건수는 별도 쿼리 (is_deleted = true)
        long deletedCount = orderMapper.selectOrderDeletedCount(
                corporationCd.trim(), storeId, trimmedSalesTypeCd, resolvedDateType, orderDtFrom, orderDtTo);
        OrderCountsByStatusResponse response = new OrderCountsByStatusResponse(total, counts);
        response.setDeletedCount(deletedCount);
        return response;
    }

    /**
     * 주문 상세 조회 (마스터 1건 + 라인 목록).
     * 복합키: order_id + regist_dt. corporation_cd 필수, store_cd는 선택(권한/스코프용).
     *
     * @return 마스터 없으면 null, 있으면 OrderDetailResponse(master, items)
     */
    public OrderDetailResponse getOrderDetail(Long orderId, String registDt, String corporationCd, String storeCd) {
        if (orderId == null || registDt == null || registDt.isBlank() || corporationCd == null
                || corporationCd.isBlank()) {
            return null;
        }
        String corp = corporationCd.trim();
        String store = (storeCd != null && !storeCd.isBlank()) ? storeCd.trim() : null; // 권한/스코프
        var master = orderMapper.selectOrderMaster(orderId, registDt.trim(), corp, store);
        if (master == null)
            return null;
        var items = orderMapper.selectOrderItems(orderId, registDt.trim(), corp, store);
        return new OrderDetailResponse(master, items != null ? items : List.of());
    }

    /**
     * 주문 상태 변경 이력 조회. 해당 주문에 대한 권한이 있을 때만 반환 (order_id + regist_dt로 마스터 존재 여부 확인).
     *
     * @return 권한 없으면 null, 있으면 이력 목록 (status_dt 내림차순)
     */
    public List<OrderStatusLogItem> getOrderStatusLog(Long orderId, String registDt, String corporationCd, String storeCd) {
        if (orderId == null || registDt == null || registDt.isBlank() || corporationCd == null
                || corporationCd.isBlank()) {
            return List.of();
        }
        String corp = corporationCd.trim();
        String store = (storeCd != null && !storeCd.isBlank()) ? storeCd.trim() : null;
        var master = orderMapper.selectOrderMaster(orderId, registDt.trim(), corp, store);
        if (master == null)
            return List.of();
        var list = orderMapper.selectOrderStatusLog(orderId, registDt.trim());
        return list != null ? list : List.of();
    }

    /**
     * 주문 수정 (마스터 + 라인). regist_dt는 변경되지 않는다고 가정(파티션 체크 없음).
     * 마스터/라인은 각각 UPDATE. JSONB 컬럼은 문자열로 전달.
     *
     * @param orderId 주문 PK
     * @param request registDt(필수), master, items (null이면 해당 부분 스킵)
     * @param statusBy 감사 로그용 처리자 (nullable)
     */
    public void updateOrder(Long orderId, OrderUpdateRequest request, String statusBy) {
        if (orderId == null || request == null || request.getRegistDt() == null || request.getRegistDt().isBlank()) {
            return;
        }
        String registDt = request.getRegistDt().trim();
        if (request.getMaster() != null) {
            String corp = request.getMaster().getCorporationCd() != null ? request.getMaster().getCorporationCd().trim() : null;
            String store = request.getMaster().getStoreCd() != null && !request.getMaster().getStoreCd().isBlank() ? request.getMaster().getStoreCd().trim() : null;
            OrderMasterDetail before = orderMapper.selectOrderMaster(orderId, registDt, corp, store);
            request.getMaster().setOrderId(orderId);
            request.getMaster().setRegistDt(registDt);
            orderMapper.updateOrderMaster(request.getMaster());
            // 감사: 주문처리상태가 실제로 변경된 경우에만 ORDER_PROCESS, 그 외 수정은 ETC/UPDATED
            String newProcessStatus = request.getMaster().getOrderProcessStatus();
            String beforeProcessStatus = before != null ? before.getOrderProcessStatus() : null;
            boolean statusChanged = newProcessStatus != null && !newProcessStatus.isBlank()
                    && !newProcessStatus.trim().equals(beforeProcessStatus != null ? beforeProcessStatus.trim() : "");
            if (statusChanged) {
                orderMapper.insertOrderStatusLog(orderId, registDt, "ORDER_PROCESS", (newProcessStatus != null ? newProcessStatus : "").trim(), statusBy);
            } else {
                orderMapper.insertOrderStatusLog(orderId, registDt, "ETC", "UPDATED", statusBy);
            }
        }
        // 라인 수정 시 corp/store는 마스터 기준(권한·파티션 조건)
        if (request.getItems() != null && request.getMaster() != null) {
            String corp = request.getMaster().getCorporationCd() != null ? request.getMaster().getCorporationCd().trim()
                    : null;
            String store = request.getMaster().getStoreCd() != null && !request.getMaster().getStoreCd().isBlank()
                    ? request.getMaster().getStoreCd().trim()
                    : null;
            for (OrderItemDetail item : request.getItems()) {
                item.setOrderId(orderId);
                item.setRegistDt(registDt);
                orderMapper.updateOrderItem(item, corp, store);
            }
        }
    }

    /**
     * 수기 주문 등록. order_info.registrationType = MANUAL 저장.
     * order_no: M-YYYYMMDD-NNNN, item_order_no: orderNo + "-" + lineNo.
     *
     * @param request corporationCd, mallCd, storeCd, salesTypeCd, orderDt, registDt, 수령인 등, items(상품 라인)
     * @param userId  등록자 (created_by, updated_by)
     * @return 생성된 orderId, registDt, orderNo, 라인별 lineNo·itemOrderNo
     */
    @Transactional
    public ManualOrderCreateResponse createManualOrder(ManualOrderCreateRequest request, String userId) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("orders.bulk_empty");
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            throw new IllegalArgumentException("orders.corporation_required");
        }
        if (request.getMallCd() == null || request.getMallCd().isBlank() || request.getStoreCd() == null || request.getStoreCd().isBlank()) {
            throw new IllegalArgumentException("orders.mall_store_required");
        }
        Set<String> productIdsSeen = new HashSet<>();
        for (ManualOrderCreateRequest.LineItem line : request.getItems()) {
            if (line.getProductId() != null && !line.getProductId().isBlank()) {
                if (!productIdsSeen.add(line.getProductId().trim())) {
                    throw new IllegalArgumentException("orders.manualOrder.duplicateProduct");
                }
            }
        }
        String corp = request.getCorporationCd().trim();
        String mallCd = request.getMallCd().trim();
        String storeCd = request.getStoreCd().trim();
        String salesTypeCd = request.getSalesTypeCd() != null && !request.getSalesTypeCd().isBlank() ? request.getSalesTypeCd().trim() : "B2C_DOMESTIC";
        String orderDt = request.getOrderDt() != null && !request.getOrderDt().isBlank() ? request.getOrderDt().trim() : LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String registDt = request.getRegistDt() != null && !request.getRegistDt().isBlank() ? request.getRegistDt().trim() : LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        orderMapper.ensurePartitionFor(registDt);
        return createManualOrderInternal(request, corp, mallCd, storeCd, salesTypeCd, orderDt, registDt, userId);
    }

    /** 파티션 확인은 호출부에서 이미 했을 때 사용 (일괄등록에서 1회만 ensurePartitionFor 호출). */
    private ManualOrderCreateResponse createManualOrderInternal(ManualOrderCreateRequest request,
            String corp, String mallCd, String storeCd, String salesTypeCd, String orderDt, String registDt, String userId) {
        long orderId = orderMapper.getNextOrderId();
        String orderNo = request.getOrderNo() != null && !request.getOrderNo().isBlank()
                ? request.getOrderNo().trim()
                : orderMapper.getNextManualOrderNo(registDt, corp, mallCd, storeCd);

        Map<String, Object> orderInfoMap = new HashMap<>();
        orderInfoMap.put("receiverNm", request.getReceiverNm());
        orderInfoMap.put("receiverTel", request.getReceiverTel());
        orderInfoMap.put("receiverMobile", request.getReceiverMobile());
        orderInfoMap.put("receiverAddr", request.getReceiverAddr());
        orderInfoMap.put("receiverAddr2", request.getReceiverAddr2());
        orderInfoMap.put("receiverZip", request.getReceiverZip());
        orderInfoMap.put("ordererNm", request.getOrdererNm());
        orderInfoMap.put("ordererTel", request.getOrdererTel());
        orderInfoMap.put("ordererMobile", request.getOrdererMobile());
        orderInfoMap.put("memo", request.getMemo());
        if (request.getDeliveryFee() != null) {
            orderInfoMap.put("deliveryFee", request.getDeliveryFee());
        }
        if (request.getPaymentMethodCd() != null && !request.getPaymentMethodCd().isBlank()) {
            orderInfoMap.put("paymentMethodCd", request.getPaymentMethodCd().trim());
        }
        orderInfoMap.put("registrationType", REGISTRATION_TYPE_MANUAL);
        String orderInfoJson;
        try {
            orderInfoJson = objectMapper.writeValueAsString(orderInfoMap);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("order_info build failed", e);
        }

        orderMapper.insertOrderMaster(orderId, corp, mallCd, storeCd, orderDt, registDt, orderNo,
                salesTypeCd, "NORMAL", orderInfoJson, userId, userId);
        orderMapper.insertOrderStatusLog(orderId, registDt, "ORDER_PROCESS", "ORDER_RECEIVED", userId);

        List<ManualOrderCreateResponse.LineResult> lineResults = new ArrayList<>();
        int lineNo = 1;
        for (ManualOrderCreateRequest.LineItem line : request.getItems()) {
            String productCd = line.getProductCd();
            String productNm = line.getProductNm();
            if (line.getProductId() != null && !line.getProductId().isBlank() && (productCd == null || productCd.isBlank() || productNm == null || productNm.isBlank())) {
                var product = productMapper.selectProductDetail(line.getProductId().trim());
                if (product != null) {
                    productCd = product.getProductCd();
                    productNm = product.getProductNm();
                }
            }
            if (productCd == null) productCd = "";
            if (productNm == null) productNm = "";
            Integer qty = line.getLineQty() != null ? line.getLineQty() : 1;
            java.math.BigDecimal amount = line.getLineAmount() != null ? line.getLineAmount() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal discount = line.getLineDiscountAmount() != null ? line.getLineDiscountAmount() : java.math.BigDecimal.ZERO;
            String itemOrderNo = orderNo + "-" + lineNo;
            orderMapper.insertOrderItem(orderId, registDt, lineNo, itemOrderNo, productCd, productNm,
                    qty, amount, discount, "{}", userId, userId);
            lineResults.add(new ManualOrderCreateResponse.LineResult(lineNo, itemOrderNo));
            lineNo++;
        }

        ManualOrderCreateResponse response = new ManualOrderCreateResponse();
        response.setOrderId(orderId);
        response.setRegistDt(registDt);
        response.setOrderNo(orderNo);
        response.setItems(lineResults);
        return response;
    }

    /**
     * 주문 엑셀 일괄등록. 엑셀 파싱 후 주문번호(같은 값=한 주문)별로 createManualOrder 호출.
     * 법인·판매유형·등록일은 화면 선택/업로드일로 적용.
     *
     * @param excelInput 엑셀 입력 스트림
     * @param corporationCd 법인코드 (필수, 모든 주문에 적용)
     * @param salesTypeCd 판매유형코드 (선택, 선택 메뉴의 코드 적용. null이면 B2C_DOMESTIC)
     * @param userId 등록자
     * @return 성공/실패 건수 및 오류 메시지 목록
     */
    @Transactional(rollbackFor = Exception.class)
    public OrderBulkImportResult bulkImportOrders(InputStream excelInput, String corporationCd, String salesTypeCd, String userId) {
        OrderBulkImportResult result = new OrderBulkImportResult();
        if (corporationCd == null || corporationCd.isBlank()) {
            result.getErrors().add("orders.corporation_required");
            return result;
        }
        String corp = corporationCd.trim();
        String salesType = (salesTypeCd != null && !salesTypeCd.isBlank()) ? salesTypeCd.trim() : "B2C_DOMESTIC";
        String registDt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        OrderExcelParser.ParsedOrderBulk parsed = orderExcelParser.parse(excelInput);

        List<ManualOrderCreateRequest> orders = parsed.getOrders();
        if (orders.isEmpty()) {
            result.getErrors().addAll(parsed.getValidationErrors());
            return result;
        }

        // 상점코드 유효성: 해당 법인에 등록된 상점인지 조회하고, mall_cd 설정(엑셀에는 쇼핑몰코드 없음)
        Set<String> uniqueStoreCds = orders.stream()
                .map(o -> o.getStoreCd() != null ? o.getStoreCd().trim() : null)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.toSet());
        Map<String, String> storeCdToMallCd = new HashMap<>();
        List<String> invalidStoreCds = new ArrayList<>();
        for (String storeCd : uniqueStoreCds) {
            MallStoreListItem store = mallMapper.selectStoreByCorporationAndStoreCd(corp, storeCd);
            if (store == null) {
                invalidStoreCds.add(storeCd);
            } else {
                storeCdToMallCd.put(storeCd, store.getMallCd());
            }
        }
        if (!invalidStoreCds.isEmpty()) {
            result.getErrors().add(MessageKeys.ORDERS_BULK_IMPORT_INVALID_STORE_CD + "|" + String.join(",", invalidStoreCds));
            return result;
        }
        for (ManualOrderCreateRequest req : orders) {
            String sc = req.getStoreCd() != null ? req.getStoreCd().trim() : "";
            req.setMallCd(storeCdToMallCd.getOrDefault(sc, ""));
        }

        // 주문번호 중복 검사: 이미 존재하는 (regist_dt, corporation_cd, mall_cd, store_cd, order_no)가 있으면 전체 롤백(저장 안 함)
        List<OrderNoTriple> keys = orders.stream()
                .map(o -> new OrderNoTriple(o.getMallCd(), o.getStoreCd(), o.getOrderNo()))
                .collect(Collectors.toList());
        List<String> existingOrderNos = orderMapper.selectExistingOrderNosForBulk(registDt, corp, salesType, keys);
        if (!existingOrderNos.isEmpty()) {
            result.getErrors().add(MessageKeys.ORDERS_BULK_IMPORT_DUPLICATE_ORDER_NO + "|" + String.join(",", existingOrderNos));
            return result;
        }

        orderMapper.ensurePartitionFor(registDt);

        int n = orders.size();
        List<Long> orderIds = orderMapper.getNextOrderIds(n);

        List<OrderMasterInsertRow> masterRows = new ArrayList<>(n);
        String defaultOrderDt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        for (int i = 0; i < n; i++) {
            ManualOrderCreateRequest req = orders.get(i);
            req.setCorporationCd(corp);
            req.setSalesTypeCd(salesType);
            req.setRegistDt(registDt);
            String orderNo = req.getOrderNo() != null && !req.getOrderNo().isBlank() ? req.getOrderNo().trim() : null;
            if (orderNo == null) {
                orderNo = orderMapper.getNextManualOrderNo(registDt, corp, req.getMallCd().trim(), req.getStoreCd().trim());
            }
            String orderDt = req.getOrderDt() != null && !req.getOrderDt().isBlank() ? req.getOrderDt().trim() : defaultOrderDt;
            String orderInfoJson = buildOrderInfoJson(req);
            OrderMasterInsertRow row = new OrderMasterInsertRow();
            row.setOrderId(orderIds.get(i));
            row.setCorporationCd(corp);
            row.setMallCd(req.getMallCd().trim());
            row.setStoreCd(req.getStoreCd().trim());
            row.setOrderDt(orderDt);
            row.setRegistDt(registDt);
            row.setOrderNo(orderNo);
            row.setSalesTypeCd(salesType);
            row.setOrderTypeCd("NORMAL");
            row.setOrderInfo(orderInfoJson);
            row.setCreatedBy(userId);
            row.setUpdatedBy(userId);
            masterRows.add(row);
        }
        orderMapper.insertOrderMasterBulk(masterRows);

        List<OrderBulkRequest.OrderKey> statusLogKeys = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            OrderBulkRequest.OrderKey k = new OrderBulkRequest.OrderKey();
            k.setOrderId(orderIds.get(i));
            k.setRegistDt(registDt);
            statusLogKeys.add(k);
        }
        orderMapper.insertOrderStatusLogBulk(statusLogKeys, "ORDER_PROCESS", "ORDER_RECEIVED", userId);

        List<OrderItemInsertRow> itemRows = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            ManualOrderCreateRequest req = orders.get(i);
            long orderId = orderIds.get(i);
            String orderNo = req.getOrderNo() != null && !req.getOrderNo().isBlank() ? req.getOrderNo().trim() : "";
            int lineNo = 1;
            for (ManualOrderCreateRequest.LineItem line : req.getItems()) {
                String productCd = line.getProductCd();
                String productNm = line.getProductNm();
                if (line.getProductId() != null && !line.getProductId().isBlank()
                        && (productCd == null || productCd.isBlank() || productNm == null || productNm.isBlank())) {
                    var product = productMapper.selectProductDetail(line.getProductId().trim());
                    if (product != null) {
                        productCd = product.getProductCd();
                        productNm = product.getProductNm();
                    }
                }
                if (productCd == null) productCd = "";
                if (productNm == null) productNm = "";
                Integer qty = line.getLineQty() != null ? line.getLineQty() : 1;
                java.math.BigDecimal amount = line.getLineAmount() != null ? line.getLineAmount() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal discount = line.getLineDiscountAmount() != null ? line.getLineDiscountAmount() : java.math.BigDecimal.ZERO;
                OrderItemInsertRow ir = new OrderItemInsertRow();
                ir.setOrderId(orderId);
                ir.setRegistDt(registDt);
                ir.setLineNo(lineNo);
                ir.setItemOrderNo(orderNo + "-" + lineNo);
                ir.setProductCd(productCd);
                ir.setProductNm(productNm);
                ir.setLineQty(qty);
                ir.setLineAmount(amount);
                ir.setLineDiscountAmount(discount);
                ir.setLinePayload("{}");
                ir.setCreatedBy(userId);
                ir.setUpdatedBy(userId);
                itemRows.add(ir);
                lineNo++;
            }
        }
        if (!itemRows.isEmpty()) {
            orderMapper.insertOrderItemBulk(itemRows);
        }

        result.setSuccessOrderCount(n);
        result.setSuccessLineCount(itemRows.size());
        result.setFailOrderCount(parsed.getExcludedOrderCount());
        result.getErrors().addAll(parsed.getValidationErrors());
        return result;
    }

    private String buildOrderInfoJson(ManualOrderCreateRequest request) {
        Map<String, Object> orderInfoMap = new HashMap<>();
        orderInfoMap.put("receiverNm", request.getReceiverNm());
        orderInfoMap.put("receiverTel", request.getReceiverTel());
        orderInfoMap.put("receiverMobile", request.getReceiverMobile());
        orderInfoMap.put("receiverAddr", request.getReceiverAddr());
        orderInfoMap.put("receiverAddr2", request.getReceiverAddr2());
        orderInfoMap.put("receiverZip", request.getReceiverZip());
        orderInfoMap.put("ordererNm", request.getOrdererNm());
        orderInfoMap.put("ordererTel", request.getOrdererTel());
        orderInfoMap.put("ordererMobile", request.getOrdererMobile());
        orderInfoMap.put("memo", request.getMemo());
        if (request.getDeliveryFee() != null) {
            orderInfoMap.put("deliveryFee", request.getDeliveryFee());
        }
        if (request.getPaymentMethodCd() != null && !request.getPaymentMethodCd().isBlank()) {
            orderInfoMap.put("paymentMethodCd", request.getPaymentMethodCd().trim());
        }
        orderInfoMap.put("registrationType", REGISTRATION_TYPE_MANUAL);
        try {
            return objectMapper.writeValueAsString(orderInfoMap);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("order_info build failed", e);
        }
    }

    /**
     * 선택 주문 일괄 출고보류. order_process_status를 HOLD로 일괄 UPDATE.
     *
     * @param request corporationCd(필수), storeCd(선택), items(orderId+registDt)
     * @param statusBy 감사 로그용 처리자 (nullable)
     * @return 실제 처리된 주문 건수·라인 수
     */
    public OrderBulkCountResult bulkSetOrderStatusHold(OrderBulkRequest request, String statusBy) {
        OrderBulkCountResult out = new OrderBulkCountResult();
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return out;
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return out;
        }
        String corp = request.getCorporationCd().trim();
        String store = (request.getStoreCd() != null && !request.getStoreCd().isBlank()) ? request.getStoreCd().trim()
                : null;
        Set<String> seen = new HashSet<>();
        List<OrderBulkRequest.OrderKey> valid = request.getItems().stream()
                .filter(k -> k.getOrderId() != null && k.getRegistDt() != null && !k.getRegistDt().isBlank())
                .peek(k -> k.setRegistDt(k.getRegistDt().trim()))
                .filter(k -> seen.add(k.getOrderId() + "-" + k.getRegistDt()))
                .collect(Collectors.toList());
        if (valid.isEmpty())
            return out;
        int orderCount = orderMapper.updateOrderProcessStatusBulk(valid, corp, store, "HOLD", "ORDER_RECEIVED");
        if (orderCount <= 0) return out;
        orderMapper.insertOrderStatusLogBulk(valid, "ORDER_PROCESS", "HOLD", statusBy);
        long lineCount = orderMapper.countOrderItemLinesByOrderKeysAndStatus(valid, corp, store, "HOLD");
        out.setOrderCount(orderCount);
        out.setLineCount((int) lineCount);
        return out;
    }

    /**
     * 선택 주문 일괄 보류 해제. order_process_status를 ORDER_RECEIVED로 일괄 UPDATE.
     *
     * @param request corporationCd(필수), storeCd(선택), items(orderId+registDt)
     * @param statusBy 감사 로그용 처리자 (nullable)
     * @return 실제 처리된 주문 건수·라인 수
     */
    public OrderBulkCountResult bulkSetOrderStatusOrderReceived(OrderBulkRequest request, String statusBy) {
        OrderBulkCountResult out = new OrderBulkCountResult();
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return out;
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return out;
        }
        String corp = request.getCorporationCd().trim();
        String store = (request.getStoreCd() != null && !request.getStoreCd().isBlank()) ? request.getStoreCd().trim()
                : null;
        Set<String> seen = new HashSet<>();
        List<OrderBulkRequest.OrderKey> valid = request.getItems().stream()
                .filter(k -> k.getOrderId() != null && k.getRegistDt() != null && !k.getRegistDt().isBlank())
                .peek(k -> k.setRegistDt(k.getRegistDt().trim()))
                .filter(k -> seen.add(k.getOrderId() + "-" + k.getRegistDt()))
                .collect(Collectors.toList());
        if (valid.isEmpty())
            return out;
        int orderCount = orderMapper.updateOrderProcessStatusBulk(valid, corp, store, "ORDER_RECEIVED", "HOLD");
        if (orderCount <= 0) return out;
        orderMapper.insertOrderStatusLogBulk(valid, "ORDER_PROCESS", "ORDER_RECEIVED", statusBy);
        long lineCount = orderMapper.countOrderItemLinesByOrderKeysAndStatus(valid, corp, store, "ORDER_RECEIVED");
        out.setOrderCount(orderCount);
        out.setLineCount((int) lineCount);
        return out;
    }

    /**
     * 선택 주문 이전단계 처리: 상태를 ORDER_RECEIVED로 변경하고 합포장번호를 NULL로 초기화.
     *
     * @param request corporationCd(필수), storeCd(선택), items(orderId+registDt)
     * @param statusBy 감사 로그용 처리자 (nullable)
     * @return 실제 처리된 주문 건수·라인 수
     */
    @Transactional
    public OrderBulkCountResult bulkRollbackToOrderReceived(OrderBulkRequest request, String statusBy) {
        OrderBulkCountResult out = new OrderBulkCountResult();
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return out;
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return out;
        }
        String corp = request.getCorporationCd().trim();
        String store = (request.getStoreCd() != null && !request.getStoreCd().isBlank()) ? request.getStoreCd().trim()
                : null;
        Set<String> seen = new HashSet<>();
        List<OrderBulkRequest.OrderKey> valid = request.getItems().stream()
                .filter(k -> k.getOrderId() != null && k.getRegistDt() != null && !k.getRegistDt().isBlank())
                .peek(k -> k.setRegistDt(k.getRegistDt().trim()))
                .filter(k -> seen.add(k.getOrderId() + "-" + k.getRegistDt()))
                .collect(Collectors.toList());
        if (valid.isEmpty()) {
            return out;
        }
        int orderCount = orderMapper.updateOrderToReceivedAndClearCombinedShipNoBulk(valid, corp, store, null);
        if (orderCount <= 0) return out;
        orderMapper.insertOrderStatusLogBulk(valid, "ORDER_PROCESS", "ORDER_RECEIVED", statusBy);
        long lineCount = orderMapper.countOrderItemLinesByOrderKeysAndStatus(valid, corp, store, "ORDER_RECEIVED");
        out.setOrderCount(orderCount);
        out.setLineCount((int) lineCount);
        return out;
    }

    /**
     * 선택 합포장 처리 주문 다음단계 처리: 상태를 SHIP_READY로 변경.
     *
     * @param request corporationCd(필수), storeCd(선택), items(orderId+registDt)
     * @param statusBy 감사 로그용 처리자 (nullable)
     * @return 실제 처리된 주문 건수·라인 수
     */
    @Transactional
    public OrderBulkCountResult bulkSetOrderStatusShipReady(OrderBulkRequest request, String statusBy) {
        OrderBulkCountResult out = new OrderBulkCountResult();
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return out;
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return out;
        }
        String corp = request.getCorporationCd().trim();
        String store = (request.getStoreCd() != null && !request.getStoreCd().isBlank()) ? request.getStoreCd().trim()
                : null;
        Set<String> seen = new HashSet<>();
        List<OrderBulkRequest.OrderKey> valid = request.getItems().stream()
                .filter(k -> k.getOrderId() != null && k.getRegistDt() != null && !k.getRegistDt().isBlank())
                .peek(k -> k.setRegistDt(k.getRegistDt().trim()))
                .filter(k -> seen.add(k.getOrderId() + "-" + k.getRegistDt()))
                .collect(Collectors.toList());
        if (valid.isEmpty()) {
            return out;
        }
        int orderCount = orderMapper.updateOrderProcessStatusBulk(valid, corp, store, "SHIP_READY", "PROCESSING");
        if (orderCount <= 0) {
            return out;
        }
        orderMapper.insertOrderStatusLogBulk(valid, "ORDER_PROCESS", "SHIP_READY", statusBy);
        long lineCount = orderMapper.countOrderItemLinesByOrderKeysAndStatus(valid, corp, store, "SHIP_READY");
        out.setOrderCount(orderCount);
        out.setLineCount((int) lineCount);
        return out;
    }

    /**
     * 선택 주문을 합포장처리(PROCESSING) 단계로 이동.
     * 합포장번호는 유지하며 상태만 변경.
     *
     * @param statusBy 감사 로그용 처리자 (nullable)
     * @return 실제 처리된 주문 건수·라인 수
     */
    @Transactional
    public OrderBulkCountResult bulkSetOrderStatusProcessing(OrderBulkRequest request, String statusBy) {
        OrderBulkCountResult out = new OrderBulkCountResult();
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return out;
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return out;
        }
        String corp = request.getCorporationCd().trim();
        String store = (request.getStoreCd() != null && !request.getStoreCd().isBlank()) ? request.getStoreCd().trim()
                : null;
        Set<String> seen = new HashSet<>();
        List<OrderBulkRequest.OrderKey> valid = request.getItems().stream()
                .filter(k -> k.getOrderId() != null && k.getRegistDt() != null && !k.getRegistDt().isBlank())
                .peek(k -> k.setRegistDt(k.getRegistDt().trim()))
                .filter(k -> seen.add(k.getOrderId() + "-" + k.getRegistDt()))
                .collect(Collectors.toList());
        if (valid.isEmpty()) {
            return out;
        }
        int orderCount = orderMapper.updateOrderProcessStatusBulk(valid, corp, store, "PROCESSING", "SHIP_READY");
        if (orderCount <= 0) return out;
        orderMapper.insertOrderStatusLogBulk(valid, "ORDER_PROCESS", "PROCESSING", statusBy);
        long lineCount = orderMapper.countOrderItemLinesByOrderKeysAndStatus(valid, corp, store, "PROCESSING");
        out.setOrderCount(orderCount);
        out.setLineCount((int) lineCount);
        return out;
    }

    /**
     * 선택 주문 일괄 주문서 처리: 상태를 PROCESSING으로 변경하고 합포장번호 부여.
     * <ul>
     * <li>상점코드(store_cd) + 수령인(이름·주소·연락처) 동일한 주문끼리 같은 합포장번호 부여</li>
     * <li>합포장번호: yyyyMMdd + '-' + 8자리 시퀀스 (예: 20260301-00000001),
     * seq_combined_ship_no 사용</li>
     * <li>마스터 조회는 2000건 초과 시 청크 단위로 분할, UPDATE는 2000건 단위 배치</li>
     * </ul>
     *
     * @param request              corporationCd(필수), items(orderId+registDt)
     * @param orderProcessStatusBy 처리자 식별 (order_process_status_by 컬럼)
     * @return 처리 건수·제외 건수·제외 건별 처리자(동시 처리 표시용)
     */
    @Transactional
    public OrderBulkProcessResult bulkOrderProcess(OrderBulkRequest request, String orderProcessStatusBy) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            OrderBulkProcessResult r = new OrderBulkProcessResult();
            r.setProcessedCount(0);
            r.setSkippedCount(0);
            r.setSkipped(List.of());
            return r;
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            OrderBulkProcessResult r = new OrderBulkProcessResult();
            r.setProcessedCount(0);
            r.setSkippedCount(0);
            r.setSkipped(List.of());
            return r;
        }
        String corp = request.getCorporationCd().trim();
        String store = (request.getStoreCd() != null && !request.getStoreCd().isBlank()) ? request.getStoreCd().trim()
                : null;

        // orderId+registDt 중복 제거 후 유효한 키만 수집 (seen.add로 첫 등장만 통과)
        Set<String> seen = new HashSet<>();
        List<OrderBulkRequest.OrderKey> valid = request.getItems().stream()
                .filter(k -> k.getOrderId() != null && k.getRegistDt() != null && !k.getRegistDt().isBlank())
                .peek(k -> k.setRegistDt(k.getRegistDt().trim()))
                .filter(k -> seen.add(k.getOrderId() + "-" + k.getRegistDt()))
                .collect(Collectors.toList());
        if (valid.isEmpty()) {
            OrderBulkProcessResult empty = new OrderBulkProcessResult();
            empty.setProcessedCount(0);
            empty.setSkippedCount(0);
            empty.setSkipped(List.of());
            return empty;
        }

        // 마스터 조회: 키가 MASTER_SELECT_CHUNK_SIZE 초과면 청크 단위로 여러 번 조회 후 병합
        List<OrderMasterDetail> masters = new ArrayList<>();
        if (valid.size() <= MASTER_SELECT_CHUNK_SIZE) {
            List<OrderMasterDetail> one = orderMapper.selectOrderMastersByKeys(corp, store, valid);
            if (one != null)
                masters.addAll(one);
        } else {
            for (int i = 0; i < valid.size(); i += MASTER_SELECT_CHUNK_SIZE) {
                int to = Math.min(i + MASTER_SELECT_CHUNK_SIZE, valid.size());
                List<OrderBulkRequest.OrderKey> chunk = valid.subList(i, to);
                List<OrderMasterDetail> part = orderMapper.selectOrderMastersByKeys(corp, store, chunk);
                if (part != null)
                    masters.addAll(part);
            }
        }
        if (masters.isEmpty()) {
            OrderBulkProcessResult empty = new OrderBulkProcessResult();
            empty.setProcessedCount(0);
            empty.setSkippedCount(0);
            empty.setSkipped(List.of());
            return empty; // 조회 결과 없음(권한/스코프 등)
        }

        // 수령인 기준 그룹핑: 상점코드 + 수령인명 + 주소 + 연락처가 같으면 같은 합포장
        Map<String, List<OrderMasterDetail>> groupByReceiver = new HashMap<>();
        for (OrderMasterDetail m : masters) {
            String key = receiverGroupKey(m.getStoreCd(), m.getReceiverNm(), m.getReceiverAddr(), m.getReceiverAddr2(),
                    m.getReceiverZip(), m.getReceiverTel());
            groupByReceiver.computeIfAbsent(key, k -> new ArrayList<>()).add(m);
        }

        // 그룹 수만큼 시퀀스 번호 일괄 채번 (seq_combined_ship_no, CYCLE 없음)
        int groupCount = groupByReceiver.size();
        List<Long> nextvals = orderMapper.getNextCombinedShipNoValues(groupCount);
        if (nextvals == null || nextvals.size() < groupCount) {
            OrderBulkProcessResult empty = new OrderBulkProcessResult();
            empty.setProcessedCount(0);
            empty.setSkippedCount(0);
            empty.setSkipped(List.of());
            return empty; // 시퀀스 부족 시 중단
        }

        // 그룹별 합포장번호 부여 (yyyyMMdd-00000001 형식) 후 UPDATE 대상 리스트 생성
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")); // 당일 기준
        int idx = 0;
        List<OrderBulkRequest.OrderKeyWithShipNo> toUpdate = new ArrayList<>();
        for (List<OrderMasterDetail> group : groupByReceiver.values()) {
            String combinedShipNo = datePrefix + "-" + String.format("%08d", nextvals.get(idx++)); // 8자리 0 패딩
            for (OrderMasterDetail m : group) {
                OrderBulkRequest.OrderKeyWithShipNo row = new OrderBulkRequest.OrderKeyWithShipNo();
                row.setOrderId(m.getOrderId());
                row.setRegistDt(m.getRegistDt());
                row.setCombinedShipNo(combinedShipNo);
                toUpdate.add(row);
            }
        }

        // UPDATE 전에 이미 다른 사용자가 처리한 건(ORDER_RECEIVED 아님) 조회 → 제외 건 표시용
        List<OrderBulkRequest.OrderKey> keysToCheck = toUpdate.stream()
                .map(k -> {
                    OrderBulkRequest.OrderKey key = new OrderBulkRequest.OrderKey();
                    key.setOrderId(k.getOrderId());
                    key.setRegistDt(k.getRegistDt());
                    return key;
                })
                .collect(Collectors.toList());
        List<OrderProcessStatusRow> statusRows = new ArrayList<>();
        for (int i = 0; i < keysToCheck.size(); i += MASTER_SELECT_CHUNK_SIZE) {
            int to = Math.min(i + MASTER_SELECT_CHUNK_SIZE, keysToCheck.size());
            List<OrderBulkRequest.OrderKey> chunk = keysToCheck.subList(i, to);
            List<OrderProcessStatusRow> part = orderMapper.selectOrderProcessStatusByKeys(corp, store, chunk);
            if (part != null)
                statusRows.addAll(part);
        }
        List<OrderBulkProcessResult.OrderSkippedItem> skipped = statusRows.stream()
                .filter(r -> !"ORDER_RECEIVED".equals(r.getOrderProcessStatus()))
                .map(r -> {
                    OrderBulkProcessResult.OrderSkippedItem item = new OrderBulkProcessResult.OrderSkippedItem();
                    String userId = r.getOrderProcessStatusBy() != null ? r.getOrderProcessStatusBy().trim() : "";
                    item.setProcessedBy(userId);
                    item.setProcessedAt(r.getOrderProcessStatusDt());
                    return item;
                })
                .collect(Collectors.toList());
        // 처리자 ID → 사용자 이름 조회 (표시용). 일괄 1회 쿼리로 성능 유지
        Set<String> userIds = skipped.stream()
                .map(OrderBulkProcessResult.OrderSkippedItem::getProcessedBy)
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toSet());
        Map<String, String> userIdToNm = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<OmUserM> users = userMapper.selectByUserIds(new ArrayList<>(userIds));
            if (users != null) {
                for (OmUserM user : users) {
                    if (user.getUserNm() != null && !user.getUserNm().isBlank()) {
                        userIdToNm.put(user.getUserId(), user.getUserNm().trim());
                    }
                }
            }
        }
        for (OrderBulkProcessResult.OrderSkippedItem item : skipped) {
            String nm = item.getProcessedBy() != null ? userIdToNm.get(item.getProcessedBy()) : null;
            item.setProcessedByNm(nm != null ? nm : item.getProcessedBy());
        }

        // 배치 단위로 UPDATE (BULK_ORDER_PROCESS_BATCH_SIZE씩 나누어 round-trip 및 파라미터 크기 완화)
        int totalUpdated = 0;
        for (int i = 0; i < toUpdate.size(); i += BULK_ORDER_PROCESS_BATCH_SIZE) {
            int to = Math.min(i + BULK_ORDER_PROCESS_BATCH_SIZE, toUpdate.size());
            List<OrderBulkRequest.OrderKeyWithShipNo> batch = toUpdate.subList(i, to);
            totalUpdated += orderMapper.updateOrderProcessStatusAndCombinedShipNoBulk(
                    batch, corp, store, "PROCESSING", orderProcessStatusBy, "ORDER_RECEIVED");
        }
        if (totalUpdated > 0 && !keysToCheck.isEmpty()) {
            orderMapper.insertOrderStatusLogBulk(keysToCheck, "ORDER_PROCESS", "PROCESSING", orderProcessStatusBy);
        }

        OrderBulkProcessResult result = new OrderBulkProcessResult();
        result.setProcessedCount(totalUpdated);
        if (totalUpdated > 0) {
            long lineCount = orderMapper.countOrderItemLinesByOrderKeysAndStatus(keysToCheck, corp, store, "PROCESSING");
            result.setProcessedLineCount((int) lineCount);
        }
        result.setSkippedCount(skipped.size());
        result.setSkipped(skipped);
        return result;
    }

    /**
     * 필터 조건에 맞는 발주(접수) 주문 전체를 한 번에 주문서 처리 (선택 없이 일괄).
     * ORDER_RECEIVED 상태인 주문만 대상. 키 조회 후 bulkOrderProcess와 동일한 그룹핑·채번·UPDATE 수행.
     *
     * @param dateType     등록일(REGIST_DT) / 주문일(ORDER_DT) 기준
     * @param orderDtFrom, orderDtTo 날짜 범위 (yyyy-MM-dd)
     * @return 처리 건수·제외 건수·제외 건별 처리자
     */
    @Transactional
    public OrderBulkProcessResult bulkOrderProcessByFilter(
            String corporationCd, Long storeId, String salesTypeCd,
            String dateType, String orderDtFrom, String orderDtTo,
            String searchColumn, String searchKeyword,
            String orderProcessStatusBy) {
        if (corporationCd == null || corporationCd.isBlank()) {
            OrderBulkProcessResult empty = new OrderBulkProcessResult();
            empty.setProcessedCount(0);
            empty.setSkippedCount(0);
            empty.setSkipped(List.of());
            return empty;
        }
        String resolvedDateType = resolveDateType(dateType);
        String trimmedSearchColumn = (searchColumn != null && !searchColumn.isBlank()) ? searchColumn.trim() : null;
        String trimmedSearchKeyword = (searchKeyword != null && !searchKeyword.isBlank()) ? searchKeyword.trim() : null;
        // ORDER_RECEIVED(발주접수) 상태인 주문 키만 조회 (날짜·검색조건·검색어 적용)
        List<OrderBulkRequest.OrderKey> keys = orderMapper.selectOrderKeysForProcessByFilter(
                corporationCd.trim(), storeId, salesTypeCd, resolvedDateType, orderDtFrom, orderDtTo,
                trimmedSearchColumn, trimmedSearchKeyword);
        if (keys == null || keys.isEmpty()) {
            OrderBulkProcessResult empty = new OrderBulkProcessResult();
            empty.setProcessedCount(0);
            empty.setSkippedCount(0);
            empty.setSkipped(List.of());
            return empty;
        }
        OrderBulkRequest request = new OrderBulkRequest();
        request.setCorporationCd(corporationCd.trim());
        request.setStoreCd(null);
        request.setItems(keys);
        return bulkOrderProcess(request, orderProcessStatusBy);
    }

    /**
     * 필터 조건에 맞는 합포장 처리(PROCESSING) 주문 전체를 이전단계(ORDER_RECEIVED)로 일괄 이동.
     * 이동 시 combined_ship_no는 NULL로 초기화.
     *
     * @param statusBy 감사 로그용 처리자 (nullable)
     */
    @Transactional
    public OrderBulkCountResult bulkRollbackToOrderReceivedByFilter(
            String corporationCd, Long storeId, String salesTypeCd,
            String dateType, String orderDtFrom, String orderDtTo,
            String searchColumn, String searchKeyword,
            String statusBy) {
        if (corporationCd == null || corporationCd.isBlank()) {
            return new OrderBulkCountResult();
        }
        String resolvedDateType = resolveDateType(dateType);
        String trimmedSearchColumn = (searchColumn != null && !searchColumn.isBlank()) ? searchColumn.trim() : null;
        String trimmedSearchKeyword = (searchKeyword != null && !searchKeyword.isBlank()) ? searchKeyword.trim() : null;
        List<OrderBulkRequest.OrderKey> keys = orderMapper.selectOrderKeysForRollbackByFilter(
                corporationCd.trim(), storeId, salesTypeCd, resolvedDateType, orderDtFrom, orderDtTo,
                trimmedSearchColumn, trimmedSearchKeyword);
        if (keys == null || keys.isEmpty()) {
            return new OrderBulkCountResult();
        }
        OrderBulkRequest request = new OrderBulkRequest();
        request.setCorporationCd(corporationCd.trim());
        request.setStoreCd(null);
        request.setItems(keys);
        return bulkRollbackToOrderReceived(request, statusBy);
    }

    /**
     * 필터 조건에 맞는 합포장 처리(PROCESSING) 주문 전체를 다음단계(SHIP_READY)로 일괄 이동.
     *
     * @param statusBy 감사 로그용 처리자 (nullable)
     */
    @Transactional
    public OrderBulkCountResult bulkShipOrderProcessByFilter(
            String corporationCd, Long storeId, String salesTypeCd,
            String dateType, String orderDtFrom, String orderDtTo,
            String searchColumn, String searchKeyword,
            String statusBy) {
        if (corporationCd == null || corporationCd.isBlank()) {
            return new OrderBulkCountResult();
        }
        String resolvedDateType = resolveDateType(dateType);
        String trimmedSearchColumn = (searchColumn != null && !searchColumn.isBlank()) ? searchColumn.trim() : null;
        String trimmedSearchKeyword = (searchKeyword != null && !searchKeyword.isBlank()) ? searchKeyword.trim() : null;
        List<OrderBulkRequest.OrderKey> keys = orderMapper.selectOrderKeysForRollbackByFilter(
                corporationCd.trim(), storeId, salesTypeCd, resolvedDateType, orderDtFrom, orderDtTo,
                trimmedSearchColumn, trimmedSearchKeyword);
        if (keys == null || keys.isEmpty()) {
            return new OrderBulkCountResult();
        }
        OrderBulkRequest request = new OrderBulkRequest();
        request.setCorporationCd(corporationCd.trim());
        request.setStoreCd(null);
        request.setItems(keys);
        return bulkSetOrderStatusShipReady(request, statusBy);
    }

    /**
     * 합포장 그룹 키 생성: 상점코드 + 수령인(이름·주소·연락처). null은 빈 문자열로 통일.
     */
    private static String receiverGroupKey(String storeCd, String receiverNm, String receiverAddr, String receiverAddr2,
            String receiverZip, String receiverTel) {
        // 구분자 | 로 연결, null은 ""로 통일해 동일 수령인만 같은 키
        return (storeCd != null ? storeCd : "") + "|"
                + (receiverNm != null ? receiverNm : "") + "|"
                + (receiverAddr != null ? receiverAddr : "") + "|"
                + (receiverAddr2 != null ? receiverAddr2 : "") + "|"
                + (receiverZip != null ? receiverZip : "") + "|"
                + (receiverTel != null ? receiverTel : "");
    }

    /**
     * 선택 주문 라인 일괄 삭제. om_order_item_m.is_deleted = true로 soft delete (라인 단위 bulk
     * UPDATE). 감사: 삭제된 주문별로 om_order_status_log에 ETC/LINE_DELETED 1건 기록 (삭제주문 탭 타임라인용).
     *
     * @param request corporationCd(필수), items(orderId+registDt+lineNo)
     * @param statusBy 감사 로그용 처리자 (nullable)
     * @return 실제 UPDATE된 행 수
     */
    @Transactional
    public int bulkSetOrderItemsDeleted(OrderBulkItemRequest request, String statusBy) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return 0;
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return 0;
        }
        String corp = request.getCorporationCd().trim();
        String store = (request.getStoreCd() != null && !request.getStoreCd().isBlank()) ? request.getStoreCd().trim()
                : null;
        // orderId·registDt·lineNo 모두 있는 라인만 (라인 단위 키)
        List<OrderBulkItemRequest.ItemKey> valid = request.getItems().stream()
                .filter(k -> k.getOrderId() != null && k.getRegistDt() != null && !k.getRegistDt().isBlank()
                        && k.getLineNo() != null)
                .peek(k -> k.setRegistDt(k.getRegistDt().trim()))
                .collect(Collectors.toList());
        if (valid.isEmpty())
            return 0;
        int updated = orderMapper.updateOrderItemSetDeletedBulk(valid, corp, store, true); // is_deleted = true
        if (updated > 0) {
            // 감사: 삭제된 주문별 (orderId, registDt) 1건씩 타임라인 로그
            List<OrderBulkRequest.OrderKey> uniqueOrderKeys = valid.stream()
                    .collect(Collectors.toMap(k -> k.getOrderId() + "-" + k.getRegistDt(), k -> {
                        OrderBulkRequest.OrderKey key = new OrderBulkRequest.OrderKey();
                        key.setOrderId(k.getOrderId());
                        key.setRegistDt(k.getRegistDt());
                        return key;
                    }, (a, b) -> a))
                    .values().stream().toList();
            orderMapper.insertOrderStatusLogBulk(uniqueOrderKeys, "ETC", "LINE_DELETED", statusBy);
        }
        return updated;
    }

    /**
     * 날짜 필터 기준 해석: "REGIST_DT"면 등록일(regist_dt), 그 외는 주문일(order_dt).
     */
    private static String resolveDateType(String dateType) {
        // "REGIST_DT"만 등록일, 그 외(빈값 포함)는 주문일
        return (dateType != null && "REGIST_DT".equals(dateType.trim())) ? "REGIST_DT" : "ORDER_DT";
    }

    private static void writeCell(Row row, int colIdx, Object value) {
        Cell cell = row.createCell(colIdx);
        if (value == null) {
            cell.setCellValue("");
            return;
        }
        if (value instanceof Number num) {
            cell.setCellValue(num.doubleValue());
            return;
        }
        cell.setCellValue(value.toString());
    }

}
