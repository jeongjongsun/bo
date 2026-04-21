package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.ErrorCodes;
import com.shopeasy.api.PagedData;
import com.shopeasy.dto.OrderBulkItemRequest;
import com.shopeasy.dto.OrderBulkProcessByFilterRequest;
import com.shopeasy.dto.OrderBulkCountResult;
import com.shopeasy.dto.OrderBulkProcessResult;
import com.shopeasy.dto.OrderBulkRequest;
import com.shopeasy.dto.OrderCountsByStatusResponse;
import com.shopeasy.dto.OrderDetailResponse;
import com.shopeasy.dto.OrderListItem;
import com.shopeasy.dto.OrderStatusLogItem;
import com.shopeasy.dto.OrderUpdateRequest;
import com.shopeasy.dto.ManualOrderCreateRequest;
import com.shopeasy.dto.ManualOrderCreateResponse;
import com.shopeasy.dto.OrderBulkImportResult;
import com.shopeasy.service.OrderService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.LocalDateTime;

import com.shopeasy.config.SessionAuthInterceptor;
import java.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 주문(발주) 목록 API. docs/02-개발-표준.md, docs/menu/주문관리.md.
 */
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * 주문 목록 (라인 단위) 페이징. 법인코드 필수.
     *
     * @param corporationCd 법인코드 (필수)
     * @param storeId 상점 PK (선택)
     * @param orderProcessStatus 주문처리상태 (선택)
     * @param page 0-based
     * @param size 기본 50, 최대 10000
     * @return ApiResponse.data = PagedData&lt;OrderListItem&gt;
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedData<OrderListItem>>> list(
            @RequestParam(required = false) String corporationCd,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) String salesTypeCd,
            @RequestParam(required = false) String orderProcessStatus,
            @RequestParam(required = false) String dateType,
            @RequestParam(required = false) String orderDtFrom,
            @RequestParam(required = false) String orderDtTo,
            @RequestParam(required = false) Boolean showDeletedOnly,
            @RequestParam(required = false) String searchColumn,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Boolean minimalColumns) {

        if (corporationCd == null || corporationCd.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }

        PagedData<OrderListItem> result = orderService.getOrderList(
                corporationCd, storeId, salesTypeCd, orderProcessStatus, dateType, orderDtFrom, orderDtTo, showDeletedOnly, searchColumn, searchKeyword, page, size, minimalColumns);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    /**
     * 주문 목록 전체 엑셀 다운로드. 현재 필터 조건의 전체 데이터를 파일로 반환.
     */
    @GetMapping("/export-full")
    public ResponseEntity<StreamingResponseBody> exportFull(
            @RequestParam(required = false) String corporationCd,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) String salesTypeCd,
            @RequestParam(required = false) String orderProcessStatus,
            @RequestParam(required = false) String dateType,
            @RequestParam(required = false) String orderDtFrom,
            @RequestParam(required = false) String orderDtTo,
            @RequestParam(required = false) Boolean showDeletedOnly,
            @RequestParam(required = false) String searchColumn,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String lang) {
        if (corporationCd == null || corporationCd.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        StreamingResponseBody body = outputStream -> orderService.streamOrderListExcel(
                corporationCd, storeId, salesTypeCd, orderProcessStatus, dateType, orderDtFrom, orderDtTo,
                showDeletedOnly, searchColumn, searchKeyword, lang, outputStream);
        HttpHeaders headers = new HttpHeaders();
        String fileName = "orders_full_export_" +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(
                org.springframework.http.ContentDisposition.attachment()
                        .filename(fileName)
                        .build());
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }

    /**
     * 주문 상태별 건수 (툴바 탭 표시용). 법인 필수, 상점 선택.
     */
    @GetMapping("/counts-by-status")
    public ResponseEntity<ApiResponse<OrderCountsByStatusResponse>> countsByStatus(
            @RequestParam(required = false) String corporationCd,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) String salesTypeCd,
            @RequestParam(required = false) String dateType,
            @RequestParam(required = false) String orderDtFrom,
            @RequestParam(required = false) String orderDtTo) {

        if (corporationCd == null || corporationCd.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        OrderCountsByStatusResponse result = orderService.getOrderCountsByStatus(
                corporationCd, storeId, salesTypeCd, dateType, orderDtFrom, orderDtTo);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 주문 상세 조회 (마스터 + 라인 + JSONB 문자열). corporation_cd 필수, store_cd 선택.
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> getDetail(
            @PathVariable Long orderId,
            @RequestParam String registDt,
            @RequestParam String corporationCd,
            @RequestParam(required = false) String storeCd) {
        if (corporationCd == null || corporationCd.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        OrderDetailResponse detail = orderService.getOrderDetail(orderId, registDt, corporationCd, storeCd);
        if (detail == null) {
            return ResponseEntity.status(404).body(ApiResponse.fail(ErrorCodes.ERR_NOT_FOUND, "orders.not_found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    /**
     * 주문 상태 변경 이력(감사 로그) 조회. corporation_cd 필수, store_cd 선택. 해당 주문에 대한 권한이 있을 때만 반환.
     */
    @GetMapping("/{orderId}/status-log")
    public ResponseEntity<ApiResponse<java.util.List<OrderStatusLogItem>>> getStatusLog(
            @PathVariable Long orderId,
            @RequestParam String registDt,
            @RequestParam String corporationCd,
            @RequestParam(required = false) String storeCd) {
        if (corporationCd == null || corporationCd.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        java.util.List<OrderStatusLogItem> list = orderService.getOrderStatusLog(orderId, registDt, corporationCd, storeCd);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * 주문 수정 (마스터 + 라인 + JSONB).
     */
    @PutMapping("/{orderId}")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long orderId,
            @RequestBody OrderUpdateRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getRegistDt() == null || request.getRegistDt().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.regist_dt_required"));
        }
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        orderService.updateOrder(orderId, request, userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * 선택 주문 일괄 출고보류 (order_process_status = HOLD). body에 corporationCd 필수.
     */
    @PostMapping("/bulk-hold")
    public ResponseEntity<ApiResponse<OrderBulkCountResult>> bulkHold(
            @RequestBody OrderBulkRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.bulk_empty"));
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        OrderBulkCountResult result = orderService.bulkSetOrderStatusHold(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 선택 주문 일괄 보류 해제 (order_process_status = ORDER_RECEIVED). body에 corporationCd 필수.
     */
    @PostMapping("/bulk-unhold")
    public ResponseEntity<ApiResponse<OrderBulkCountResult>> bulkUnhold(
            @RequestBody OrderBulkRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.bulk_empty"));
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        OrderBulkCountResult result = orderService.bulkSetOrderStatusOrderReceived(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 선택 주문 일괄 주문서 처리 (order_process_status = PROCESSING, 합포장 번호 부여).
     * 상점코드·수령인 동일 주문끼리 동일 합포장번호 부여. body에 corporationCd 필수.
     */
    @PostMapping("/bulk-order-process")
    public ResponseEntity<ApiResponse<OrderBulkProcessResult>> bulkOrderProcess(
            @RequestBody OrderBulkRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.bulk_empty"));
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String orderProcessStatusBy = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        if (orderProcessStatusBy == null || orderProcessStatusBy.isBlank()) {
            log.warn("bulkOrderProcess: missing userId in request attribute (audit/processor required)");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail(ErrorCodes.ERR_UNAUTHORIZED, "orders.processor_required"));
        }
        OrderBulkProcessResult result = orderService.bulkOrderProcess(request, orderProcessStatusBy);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 수기 주문 등록. order_info.registrationType = MANUAL 저장.
     * body: corporationCd, mallCd, storeCd, salesTypeCd, orderDt, registDt, 수령인 등, items(상품 라인).
     */
    @PostMapping("/manual")
    public ResponseEntity<ApiResponse<ManualOrderCreateResponse>> createManualOrder(
            @RequestBody ManualOrderCreateRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.bulk_empty"));
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        if (userId == null || userId.isBlank()) {
            log.warn("createManualOrder: missing userId in request attribute");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail(ErrorCodes.ERR_UNAUTHORIZED, "orders.processor_required"));
        }
        try {
            ManualOrderCreateResponse result = orderService.createManualOrder(request, userId);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, e.getMessage()));
        }
    }

    /**
     * 주문 엑셀 일괄등록. multipart: file, corporationCd(필수), salesTypeCd(선택, 선택 메뉴의 판매유형).
     */
    @PostMapping(value = "/bulk-import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OrderBulkImportResult>> bulkImportOrders(
            @RequestParam("file") MultipartFile file,
            @RequestParam("corporationCd") String corporationCd,
            @RequestParam(value = "salesTypeCd", required = false) String salesTypeCd,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        if (userId == null || userId.isBlank()) {
            log.warn("bulkImportOrders: missing userId in request attribute");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail(ErrorCodes.ERR_UNAUTHORIZED, "orders.processor_required"));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "error.bad_request"));
        }
        if (corporationCd == null || corporationCd.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        try {
            try (java.io.InputStream in = file.getInputStream()) {
                OrderBulkImportResult result = orderService.bulkImportOrders(in, corporationCd, salesTypeCd, userId);
                return ResponseEntity.ok(ApiResponse.ok(result));
            }
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.excel_parse_error"));
        } catch (IllegalArgumentException e) {
            String msgKey = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "error.bad_request";
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, msgKey));
        } catch (com.shopeasy.api.OrderBulkImportRollbackException e) {
            return ResponseEntity.ok(ApiResponse.ok(e.getResult()));
        }
    }

    /**
     * 필터 조건에 맞는 발주(접수) 주문 전체 일괄 주문서 처리.
     * body: corporationCd(필수), storeId, salesTypeCd, dateType, orderDtFrom, orderDtTo.
     */
    @PostMapping("/bulk-order-process-by-filter")
    public ResponseEntity<ApiResponse<OrderBulkProcessResult>> bulkOrderProcessByFilter(
            @RequestBody OrderBulkProcessByFilterRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String orderProcessStatusBy = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        if (orderProcessStatusBy == null || orderProcessStatusBy.isBlank()) {
            log.warn("bulkOrderProcessByFilter: missing userId in request attribute (audit/processor required)");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail(ErrorCodes.ERR_UNAUTHORIZED, "orders.processor_required"));
        }
        OrderBulkProcessResult result = orderService.bulkOrderProcessByFilter(
                request.getCorporationCd(), request.getStoreId(), request.getSalesTypeCd(),
                request.getDateType(), request.getOrderDtFrom(), request.getOrderDtTo(),
                request.getSearchColumn(), request.getSearchKeyword(), orderProcessStatusBy);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 선택 주문 이전단계 처리 (order_process_status = ORDER_RECEIVED, combined_ship_no = NULL).
     * body에 corporationCd 필수.
     */
    @PostMapping("/bulk-order-received-process")
    public ResponseEntity<ApiResponse<OrderBulkCountResult>> bulkOrderReceivedProcess(
            @RequestBody OrderBulkRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.bulk_empty"));
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        OrderBulkCountResult result = orderService.bulkRollbackToOrderReceived(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 필터 조건에 맞는 합포장 처리(PROCESSING) 주문 전체 이전단계 처리.
     * 상태를 ORDER_RECEIVED로 변경하고 combined_ship_no를 NULL로 초기화.
     */
    @PostMapping("/bulk-order-received-process-by-filter")
    public ResponseEntity<ApiResponse<OrderBulkCountResult>> bulkOrderReceivedProcessByFilter(
            @RequestBody OrderBulkProcessByFilterRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        OrderBulkCountResult result = orderService.bulkRollbackToOrderReceivedByFilter(
                request.getCorporationCd(), request.getStoreId(), request.getSalesTypeCd(),
                request.getDateType(), request.getOrderDtFrom(), request.getOrderDtTo(),
                request.getSearchColumn(), request.getSearchKeyword(), userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 선택 합포장 처리 주문 다음단계 처리 (order_process_status = SHIP_READY).
     * body에 corporationCd 필수.
     */
    @PostMapping("/bulk-ship-order-process")
    public ResponseEntity<ApiResponse<OrderBulkCountResult>> bulkShipOrderProcess(
            @RequestBody OrderBulkRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.bulk_empty"));
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        OrderBulkCountResult result = orderService.bulkSetOrderStatusShipReady(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 필터 조건에 맞는 합포장 처리(PROCESSING) 주문 전체 다음단계 처리 (SHIP_READY).
     */
    @PostMapping("/bulk-ship-order-process-by-filter")
    public ResponseEntity<ApiResponse<OrderBulkCountResult>> bulkShipOrderProcessByFilter(
            @RequestBody OrderBulkProcessByFilterRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        OrderBulkCountResult result = orderService.bulkShipOrderProcessByFilter(
                request.getCorporationCd(), request.getStoreId(), request.getSalesTypeCd(),
                request.getDateType(), request.getOrderDtFrom(), request.getOrderDtTo(),
                request.getSearchColumn(), request.getSearchKeyword(), userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 선택 출고준비 주문을 합포장처리(PROCESSING) 단계로 이동.
     * body에 corporationCd 필수.
     */
    @PostMapping("/bulk-processing-process")
    public ResponseEntity<ApiResponse<OrderBulkCountResult>> bulkProcessingProcess(
            @RequestBody OrderBulkRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.bulk_empty"));
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        OrderBulkCountResult result = orderService.bulkSetOrderStatusProcessing(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 선택 주문 라인 일괄 삭제 (라인 단위 is_deleted = true). body에 corporationCd 필수.
     */
    @PostMapping("/bulk-delete")
    public ResponseEntity<ApiResponse<Integer>> bulkDelete(
            @RequestBody OrderBulkItemRequest request,
            HttpServletRequest httpRequest) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.bulk_empty"));
        }
        if (request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ErrorCodes.ERR_BAD_REQUEST, "orders.corporation_required"));
        }
        String userId = (String) httpRequest.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        int count = orderService.bulkSetOrderItemsDeleted(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }
}
