# 주문 관련 쿼리·인덱스 분석

> 기준: `docs/ddl/om_order_m.sql`, `docs/ddl/om_order_item_m.sql`, `OmOrderMMapper.xml` 전체 쿼리

---

## 1. 현재 인덱스 요약

### om_order_m (파티션: regist_dt)

| 인덱스 | 컬럼 | 용도 |
|--------|------|------|
| PK | (order_id, regist_dt) | 단건/배치 키 조회, JOIN 키 |
| UNIQUE | (regist_dt, corporation_cd, mall_cd, store_cd, order_no) | 주문번호 중복 방지 |
| idx_order_m_corporation_regist | (corporation_cd, regist_dt DESC) | 법인+등록일 |
| idx_order_m_regist_dt | (regist_dt DESC) | 등록일 범위 |
| idx_order_m_order_dt | (order_dt DESC) | 주문일 범위 |
| idx_order_m_order_process_status | (order_process_status) | 상태 필터 |
| idx_order_m_mall_store | (mall_cd, store_cd) | 상점 조인/필터 |
| idx_order_m_combined_ship_no | (combined_ship_no) WHERE NOT NULL | 합포장번호 검색 |
| idx_order_m_corp_sales_regist | (corporation_cd, sales_type_cd, regist_dt DESC) | 목록·건수(등록일 기준) |
| idx_order_m_corp_sales_order_dt | (corporation_cd, sales_type_cd, order_dt DESC) | 목록·건수(주문일 기준) |

### om_order_item_m

| 인덱스 | 컬럼 | 용도 |
|--------|------|------|
| PK | (order_id, line_no) | 라인 단건 조회/수정 |
| idx_order_item_m_order_regist | (order_id, regist_dt) | 주문별 라인, JOIN |
| idx_order_item_m_product_cd | (product_cd) WHERE NOT NULL | 상품코드 검색 |
| idx_order_item_m_is_deleted | (is_deleted) WHERE is_deleted = false | 비삭제 라인 (is_deleted 컬럼: om_order_item_m.sql) |
| idx_order_item_m_deleted | (order_id, regist_dt) WHERE is_deleted = true | 삭제주문 탭 건수 (is_deleted 컬럼: om_order_item_m.sql) |

---

## 2. 쿼리별 사용 조건·인덱스 적합성

| 쿼리 ID | 테이블 | WHERE / JOIN 조건 | ORDER BY | 기존 인덱스로 커버 |
|---------|--------|-------------------|-----------|--------------------|
| selectOrderList / Count / Cursor | om_order_m o, om_order_item_m i | o: corporation_cd, sales_type_cd, order_process_status, regist_dt/order_dt 범위, store(조인). i: is_deleted=false | o.combined_ship_no, o.order_no, o.order_id DESC, o.regist_dt DESC, i.line_no | corp_sales_regist/order_dt + order_process_status 단일 인덱스. **상태가 복합 인덱스에 없어 스캔 후 필터 가능** |
| selectOrderKeysForProcessByFilter | om_order_m o, om_order_item_m i | o: corporation_cd, **order_process_status='ORDER_RECEIVED'**, sales_type_cd, regist_dt/order_dt 범위, store(조인), 검색조건 | order_id, regist_dt | corp_sales_regist만으로는 상태 필터가 인덱스에 없음 → **추가 추천** |
| selectOrderKeysForRollbackByFilter | 동일 | o: **order_process_status='PROCESSING'**, 그 외 동일 | 동일 | 위와 동일 → **추가 추천** |
| selectOrderMastersByKeys | om_order_m o | (order_id, regist_dt) IN (VALUES...), corporation_cd [, store_cd] | - | **PK로 해결** |
| selectOrderProcessStatusByKeys | om_order_m o | 동일 | - | **PK로 해결** |
| updateOrderProcessStatusAndCombinedShipNoBulk | om_order_m | (order_id, regist_dt) + corporation_cd [, store_cd] + expectedCurrentStatus | - | **PK로 해결** |
| updateOrderProcessStatusBulk 등 | om_order_m | (order_id, regist_dt) + corporation_cd [, store_cd] + status | - | **PK로 해결** |
| selectOrderMaster | om_order_m | order_id, regist_dt, corporation_cd [, store_cd] | - | **PK로 해결** |
| selectOrderItems | om_order_item_m | order_id, regist_dt, **is_deleted=false** | line_no | (order_id, regist_dt) 인덱스 있음. is_deleted는 테이블 필터 → **부분 인덱스로 보강 추천** |
| countOrderItemLinesByOrderKeys | om_order_item_m i, om_order_m o | (order_id, regist_dt) IN (VALUES...), i.is_deleted=false | - | 동일 → **부분 인덱스 보강** |
| selectOrderCountByStatus | om_order_m o, om_order_item_m i | corporation_cd, sales_type_cd, date 범위, store(조인), i.is_deleted=false | - | corp_sales_regist/order_dt |
| selectOrderDeletedCount | 동일 | i.is_deleted=true | - | idx_order_item_m_deleted |
| updateOrderItemSetDeleted(Bulk) | om_order_item_m | (order_id, regist_dt, line_no) + EXISTS(om_order_m) | - | PK (order_id, line_no) 또는 order_regist |

---

## 3. 추가 권장 인덱스 요약

| 추천 인덱스 | 테이블 | 용도 |
|-------------|--------|------|
| idx_order_m_corp_sales_status_regist | om_order_m | 일괄 주문서 처리 키 조회 (ORDER_RECEIVED + 등록일 범위) |
| idx_order_m_corp_sales_status_order_dt | om_order_m | 일괄 이전단계 키 조회 (PROCESSING + 주문일 범위) |
| idx_order_item_m_order_regist_not_deleted | om_order_item_m | 주문별 비삭제 라인 조회 (selectOrderItems, 목록 JOIN 등) |

- **om_order_m**: 기존 `idx_order_m_corp_sales_regist` / `idx_order_m_corp_sales_order_dt`에는 `order_process_status`가 없어, "발주(접수)만" / "합포장처리만" 키 조회 시 인덱스만으로 상태 필터가 되지 않음. 위 두 개(status 포함) 추가 시 스캔 범위·비용 감소.
- **om_order_item_m**: "해당 주문의 비삭제 라인만" 조회가 빈번하므로, `(order_id, regist_dt) WHERE is_deleted = false` 부분 인덱스로 `selectOrderItems`·`countOrderItemLinesByOrderKeys` 및 목록 JOIN 성능 보강.

**적용**: 위 인덱스는 각 테이블 DDL 파일에 포함됨. `om_order_m.sql`, `om_order_item_m.sql` 참고.

---

## 4. 추가 권장 인덱스 생성 쿼리

아래 쿼리는 **추가로 권장한 3개 인덱스**만 생성합니다. `om_order_item_m`의 `is_deleted` 컬럼 및 테이블 정의는 `om_order_item_m.sql`에 있으므로, 해당 DDL 적용 후 아래 인덱스를 생성할 것.

```sql
-- om_order_m: 일괄 주문서 처리 키 조회 (ORDER_RECEIVED + 등록일 범위)
CREATE INDEX IF NOT EXISTS idx_order_m_corp_sales_status_regist
  ON om_order_m (corporation_cd, sales_type_cd, order_process_status, regist_dt DESC);

-- om_order_m: 일괄 이전단계 키 조회 (PROCESSING + 주문일 범위)
CREATE INDEX IF NOT EXISTS idx_order_m_corp_sales_status_order_dt
  ON om_order_m (corporation_cd, sales_type_cd, order_process_status, order_dt DESC);

-- om_order_item_m: 주문별 비삭제 라인 조회 (selectOrderItems, 목록 JOIN 등)
CREATE INDEX IF NOT EXISTS idx_order_item_m_order_regist_not_deleted
  ON om_order_item_m (order_id, regist_dt) WHERE is_deleted = false;
```
