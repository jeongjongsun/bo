package com.shopeasy.mapper;

import com.shopeasy.dto.OrderBulkItemRequest;
import com.shopeasy.dto.OrderBulkRequest;
import com.shopeasy.dto.OrderNoTriple;
import com.shopeasy.dto.OrderCountByStatusRow;
import com.shopeasy.dto.OrderItemDetail;
import com.shopeasy.dto.OrderItemInsertRow;
import com.shopeasy.dto.OrderMasterInsertRow;
import com.shopeasy.dto.OrderListItem;
import com.shopeasy.dto.OrderMasterDetail;
import com.shopeasy.dto.OrderProcessStatusRow;
import com.shopeasy.dto.OrderStatusLogItem;
import org.apache.ibatis.cursor.Cursor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;


/**
 * 주문 마스터(om_order_m) 조회. 라인 단위 목록.
 */
@Mapper
public interface OmOrderMMapper {

    /**
     * 주문 목록 (라인 단위). corporationCd 필수, storeId/orderProcessStatus 선택.
     * 정렬: order_id DESC, line_no ASC.
     */
    List<OrderListItem> selectOrderList(
            @Param("corporationCd") String corporationCd,
            @Param("storeId") Long storeId,
            @Param("salesTypeCd") String salesTypeCd,
            @Param("orderProcessStatus") String orderProcessStatus,
            @Param("dateType") String dateType,
            @Param("orderDtFrom") String orderDtFrom,
            @Param("orderDtTo") String orderDtTo,
            @Param("showDeletedOnly") Boolean showDeletedOnly,
            @Param("searchColumn") String searchColumn,
            @Param("searchKeyword") String searchKeyword,
            @Param("offset") int offset,
            @Param("size") int size);

    /**
     * 주문 목록(간편 보기): 최소 필드만 조회. 동일 WHERE/ORDER, 응답 용량 절감.
     */
    List<OrderListItem> selectOrderListMinimal(
            @Param("corporationCd") String corporationCd,
            @Param("storeId") Long storeId,
            @Param("salesTypeCd") String salesTypeCd,
            @Param("orderProcessStatus") String orderProcessStatus,
            @Param("dateType") String dateType,
            @Param("orderDtFrom") String orderDtFrom,
            @Param("orderDtTo") String orderDtTo,
            @Param("showDeletedOnly") Boolean showDeletedOnly,
            @Param("searchColumn") String searchColumn,
            @Param("searchKeyword") String searchKeyword,
            @Param("offset") int offset,
            @Param("size") int size);

    /** 주문 목록 엑셀 full export용 커서 조회 (LIMIT/OFFSET 없이 스트리밍). */
    Cursor<OrderListItem> selectOrderListCursorForExport(
            @Param("corporationCd") String corporationCd,
            @Param("storeId") Long storeId,
            @Param("salesTypeCd") String salesTypeCd,
            @Param("orderProcessStatus") String orderProcessStatus,
            @Param("dateType") String dateType,
            @Param("orderDtFrom") String orderDtFrom,
            @Param("orderDtTo") String orderDtTo,
            @Param("showDeletedOnly") Boolean showDeletedOnly,
            @Param("searchColumn") String searchColumn,
            @Param("searchKeyword") String searchKeyword);

    long selectOrderListCount(
            @Param("corporationCd") String corporationCd,
            @Param("storeId") Long storeId,
            @Param("salesTypeCd") String salesTypeCd,
            @Param("orderProcessStatus") String orderProcessStatus,
            @Param("dateType") String dateType,
            @Param("orderDtFrom") String orderDtFrom,
            @Param("orderDtTo") String orderDtTo,
            @Param("showDeletedOnly") Boolean showDeletedOnly,
            @Param("searchColumn") String searchColumn,
            @Param("searchKeyword") String searchKeyword);

    /**
     * 주문 상태별 라인 건수. storeId/corporationCd/salesTypeCd/기간 필터 적용.
     */
    List<OrderCountByStatusRow> selectOrderCountByStatus(
            @Param("corporationCd") String corporationCd,
            @Param("storeId") Long storeId,
            @Param("salesTypeCd") String salesTypeCd,
            @Param("dateType") String dateType,
            @Param("orderDtFrom") String orderDtFrom,
            @Param("orderDtTo") String orderDtTo);

    /** 삭제 주문 라인 건수 (is_deleted=true, 툴바 삭제주문 탭용). */
    long selectOrderDeletedCount(
            @Param("corporationCd") String corporationCd,
            @Param("storeId") Long storeId,
            @Param("salesTypeCd") String salesTypeCd,
            @Param("dateType") String dateType,
            @Param("orderDtFrom") String orderDtFrom,
            @Param("orderDtTo") String orderDtTo);

    /** 주문 마스터 1건 조회 (상세·수정용). corporation_cd 필수, store_cd 선택. */
    OrderMasterDetail selectOrderMaster(
            @Param("orderId") Long orderId,
            @Param("registDt") String registDt,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd);

    /** 발주(접수) 필터 조건에 맞는 주문 키 목록 (일괄 주문서 처리용). order_process_status=ORDER_RECEIVED, is_deleted=false. 날짜·검색조건·검색어 적용. */
    List<OrderBulkRequest.OrderKey> selectOrderKeysForProcessByFilter(
            @Param("corporationCd") String corporationCd,
            @Param("storeId") Long storeId,
            @Param("salesTypeCd") String salesTypeCd,
            @Param("dateType") String dateType,
            @Param("orderDtFrom") String orderDtFrom,
            @Param("orderDtTo") String orderDtTo,
            @Param("searchColumn") String searchColumn,
            @Param("searchKeyword") String searchKeyword);

    /** 합포장 처리(PROCESSING) 필터 조건에 맞는 주문 키 목록 (이전단계 일괄 처리용). */
    List<OrderBulkRequest.OrderKey> selectOrderKeysForRollbackByFilter(
            @Param("corporationCd") String corporationCd,
            @Param("storeId") Long storeId,
            @Param("salesTypeCd") String salesTypeCd,
            @Param("dateType") String dateType,
            @Param("orderDtFrom") String orderDtFrom,
            @Param("orderDtTo") String orderDtTo,
            @Param("searchColumn") String searchColumn,
            @Param("searchKeyword") String searchKeyword);

    /** 주문서 처리 일괄: (orderId, registDt) 목록에 해당하는 마스터만 조회 (그룹핑용 store_cd, 수령인 정보). */
    List<OrderMasterDetail> selectOrderMastersByKeys(
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd,
            @Param("items") List<OrderBulkRequest.OrderKey> items);

    /** (orderId, registDt) 목록에 해당하는 주문의 처리상태·처리자 조회 (동시 처리 제외 건 표시용). */
    List<OrderProcessStatusRow> selectOrderProcessStatusByKeys(
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd,
            @Param("items") List<OrderBulkRequest.OrderKey> items);

    /** seq_combined_ship_no 시퀀스에서 count개 nextval 조회 (합포장 번호 채번). */
    List<Long> getNextCombinedShipNoValues(@Param("count") int count);

    /** 수기 주문 등록: order_id 채번 (seq_order_id). */
    long getNextOrderId();

    /** 일괄등록: order_id N개 채번 (seq_order_id). */
    List<Long> getNextOrderIds(@Param("count") int count);

    /** 수기 주문 등록: order_no 채번. 형식 M-YYYYMMDD-NNNN. (regist_dt, corporation_cd, mall_cd, store_cd) 당 일별 순번. */
    String getNextManualOrderNo(@Param("registDt") String registDt,
                                @Param("corporationCd") String corporationCd,
                                @Param("mallCd") String mallCd,
                                @Param("storeCd") String storeCd);

    /** 일괄등록: 마스터 N건 일괄 INSERT. */
    int insertOrderMasterBulk(@Param("list") List<OrderMasterInsertRow> list);

    /** 수기 주문 등록: 마스터 1건 INSERT. */
    int insertOrderMaster(
            @Param("orderId") long orderId,
            @Param("corporationCd") String corporationCd,
            @Param("mallCd") String mallCd,
            @Param("storeCd") String storeCd,
            @Param("orderDt") String orderDt,
            @Param("registDt") String registDt,
            @Param("orderNo") String orderNo,
            @Param("salesTypeCd") String salesTypeCd,
            @Param("orderTypeCd") String orderTypeCd,
            @Param("orderInfo") String orderInfo,
            @Param("createdBy") String createdBy,
            @Param("updatedBy") String updatedBy);

    /** 일괄등록: 라인 N건 일괄 INSERT. */
    int insertOrderItemBulk(@Param("list") List<OrderItemInsertRow> list);

    /** 수기 주문 등록: 라인 1건 INSERT. */
    int insertOrderItem(
            @Param("orderId") long orderId,
            @Param("registDt") String registDt,
            @Param("lineNo") int lineNo,
            @Param("itemOrderNo") String itemOrderNo,
            @Param("productCd") String productCd,
            @Param("productNm") String productNm,
            @Param("lineQty") int lineQty,
            @Param("lineAmount") java.math.BigDecimal lineAmount,
            @Param("lineDiscountAmount") java.math.BigDecimal lineDiscountAmount,
            @Param("linePayload") String linePayload,
            @Param("createdBy") String createdBy,
            @Param("updatedBy") String updatedBy);

    /** 주문 다건 처리상태 + 합포장번호 일괄 변경 (주문서 처리). */
    int updateOrderProcessStatusAndCombinedShipNoBulk(
            @Param("items") List<OrderBulkRequest.OrderKeyWithShipNo> items,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd,
            @Param("orderProcessStatus") String orderProcessStatus,
            @Param("orderProcessStatusBy") String orderProcessStatusBy,
            @Param("expectedCurrentStatus") String expectedCurrentStatus);

    /** 주문 라인 목록 조회 (상세·수정용). corporation_cd 필수, store_cd 선택. */
    List<OrderItemDetail> selectOrderItems(
            @Param("orderId") Long orderId,
            @Param("registDt") String registDt,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd);

    /**
     * 해당 regist_dt가 속한 월의 om_order_m 파티션이 없으면 생성.
     * 저장/수정 직전 호출 (B타입 파티션 자동 생성).
     */
    void ensurePartitionFor(@Param("registDt") String registDt);

    /**
     * 여러 regist_dt에 대해 파티션 일괄 확인 (1회 호출로 N일 처리).
     * ensure_om_order_m_partition_for_dates(dates) 사용.
     */
    void ensurePartitionsFor(@Param("dates") List<String> dates);

    /** 주문 마스터 수정. order_id, regist_dt 기준. */
    int updateOrderMaster(OrderMasterDetail master);

    /** 주문 라인 1건 수정. order_id, line_no 기준. corporation_cd/store_cd 로 소속 검증. */
    int updateOrderItem(
            OrderItemDetail item,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd);

    /** 주문 1건 처리상태만 변경 (일괄 출고보류 등). corporation_cd 필수, store_cd 선택. */
    int updateOrderProcessStatus(
            @Param("orderId") Long orderId,
            @Param("registDt") String registDt,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd,
            @Param("orderProcessStatus") String orderProcessStatus);

    /**
     * 주문 다건 처리상태 일괄 변경 (출고보류/보류해제 등). 1회 UPDATE. corporation_cd 필수, store_cd 선택.
     */
    int updateOrderProcessStatusBulk(
            @Param("items") List<OrderBulkRequest.OrderKey> items,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd,
            @Param("orderProcessStatus") String orderProcessStatus,
            @Param("expectedCurrentStatus") String expectedCurrentStatus);

    /** 주문 다건 상태를 ORDER_RECEIVED로 변경하고 합포장번호를 NULL로 초기화 (이전단계 처리). */
    int updateOrderToReceivedAndClearCombinedShipNoBulk(
            @Param("items") List<OrderBulkRequest.OrderKey> items,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd,
            @Param("expectedCurrentStatus") String expectedCurrentStatus);

    /** 선택된 주문 키에 해당하는 실제 라인 수 조회 (is_deleted=false). */
    long countOrderItemLinesByOrderKeys(
            @Param("items") List<OrderBulkRequest.OrderKey> items,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd);

    /** 선택된 주문 키 중 특정 order_process_status 인 주문의 라인 수 (실제 처리된 라인 표시용). */
    long countOrderItemLinesByOrderKeysAndStatus(
            @Param("items") List<OrderBulkRequest.OrderKey> items,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd,
            @Param("orderProcessStatus") String orderProcessStatus);

    /** 주문 라인 1건 삭제 플래그 변경 (라인 단위). corporation_cd 필수, store_cd 선택. */
    int updateOrderItemSetDeleted(
            @Param("orderId") Long orderId,
            @Param("registDt") String registDt,
            @Param("lineNo") Integer lineNo,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd,
            @Param("isDeleted") boolean isDeleted);

    /**
     * 주문 라인 다건 삭제 플래그 일괄 변경. 1회 UPDATE. corporation_cd 필수, store_cd 선택.
     */
    int updateOrderItemSetDeletedBulk(
            @Param("items") List<OrderBulkItemRequest.ItemKey> items,
            @Param("corporationCd") String corporationCd,
            @Param("storeCd") String storeCd,
            @Param("isDeleted") boolean isDeleted);

    /** 감사: om_order_status_log 1건 INSERT (주문 등록/수정/상태 변경 시). */
    int insertOrderStatusLog(
            @Param("orderId") long orderId,
            @Param("registDt") String registDt,
            @Param("statusKind") String statusKind,
            @Param("statusValue") String statusValue,
            @Param("statusBy") String statusBy);

    /** 감사: om_order_status_log 다건 INSERT (일괄 상태 변경 시). */
    int insertOrderStatusLogBulk(
            @Param("items") List<OrderBulkRequest.OrderKey> items,
            @Param("statusKind") String statusKind,
            @Param("statusValue") String statusValue,
            @Param("statusBy") String statusBy);

    /** 주문 상태 변경 이력 조회 (order_id, regist_dt 기준, status_dt 내림차순). */
    List<OrderStatusLogItem> selectOrderStatusLog(
            @Param("orderId") Long orderId,
            @Param("registDt") String registDt);

    /**
     * 주문 일괄등록 시 이미 존재하는 (regist_dt, corporation_cd, sales_type_cd, mall_cd, store_cd, order_no)의 order_no 목록 조회.
     * B2C/B2B에 따라 동일 주문번호 허용하므로 sales_type_cd 포함.
     */
    List<String> selectExistingOrderNosForBulk(
            @Param("registDt") String registDt,
            @Param("corporationCd") String corporationCd,
            @Param("salesTypeCd") String salesTypeCd,
            @Param("list") List<OrderNoTriple> list);
}
