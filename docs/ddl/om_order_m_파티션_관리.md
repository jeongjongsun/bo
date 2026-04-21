# om_order_m 파티션 관리

주문 마스터는 `regist_dt` 기준 **월별 RANGE 파티션**입니다.  
PostgreSQL은 **파티션을 자동으로 만들지 않습니다**. 해당 월 파티션이 없으면 INSERT 시 에러가 납니다.

---

## 1. 파티션 등록 방법

### 1.1 수동 등록 (DDL 스크립트)

- **최초 구축 시**: `docs/ddl/om_order_m.sql` 에서 해당 월 파티션 `CREATE TABLE ... PARTITION OF` 한 줄 추가 후 실행.
- **이미 운영 중인 DB에 추가**: `docs/ddl/add_partition_om_order_m_YYYY_MM.sql` 형태로 스크립트 만들어 실행.

예 (2026년 3월):

```sql
CREATE TABLE IF NOT EXISTS om_order_m_2026_03
    PARTITION OF om_order_m FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
```

### 1.2 자동 생성 불가

- **주문이 수정될 때마다** DB가 알아서 새 파티션을 만드는 기능은 **없습니다**.
- 대신 아래 두 가지 방식으로 “필요한 파티션을 미리/직전에 만들기”를 할 수 있습니다.

---

## 2. 자동 대응 방법

### 방식 A: 스케줄로 미리 생성 (권장)

매월(또는 매주) 한 번, **다음 달(또는 당월) 파티션이 없으면 생성**하는 스크립트를 cron/스케줄러로 실행합니다.

- **장점**: INSERT 시점에 DDL 부담 없음, 운영이 단순함.
- **단점**: 스케줄 설정 필요.

예: 매월 1일 00:05에 `docs/ddl/ensure_om_order_m_partition_next_month.sql` 실행 (또는 아래 함수 호출).

### 방식 B: INSERT/UPDATE 직전에 “해당 월 파티션 없으면 생성”

주문 저장/수정 직전에, **해당 `regist_dt`의 월 파티션이 있는지 확인하고 없으면 생성**하는 함수를 호출합니다.

- **장점**: 새 월 첫 주문이 들어와도 에러 없이 처리 가능.
- **단점**: 저장 로직에 DDL 호출이 섞임, 동시성 시 같은 파티션 생성 시도 가능 (아래 함수는 `IF NOT EXISTS`로 안전하게 처리).

**적용**: 주문 수정 API 호출 시 `OrderService.updateOrder()`에서 `orderMapper.ensurePartitionFor(registDt)`를 수정 직전에 호출함. DB에 `ensure_om_order_m_partition_for` 함수 생성 필요 (`docs/ddl/ensure_om_order_m_partition_for.sql`).

---

## 3. “해당 월 파티션 없으면 생성” 함수

아래 함수를 DB에 한 번 만들어 두면, **스케줄 작업**에서 호출하거나 **애플리케이션에서 주문 저장 전**에 호출할 수 있습니다.

- **함수**: `ensure_om_order_m_partition_for(regist_dt DATE)`
- **동작**: `regist_dt`가 속한 월의 파티션(예: 2026-03 → `om_order_m_2026_03`)이 없으면 생성, 있으면 아무 것도 하지 않음.
- **파일**: `docs/ddl/ensure_om_order_m_partition_for.sql`

사용 예:

```sql
-- 2026-03-01 주문 저장 전
SELECT ensure_om_order_m_partition_for('2026-03-01'::date);
```

스케줄 예 (매월 1일 다음 달 파티션 생성):

```sql
SELECT ensure_om_order_m_partition_for((date_trunc('month', CURRENT_DATE) + interval '1 month')::date);
```

---

## 4. 정리

| 구분 | 내용 |
|------|------|
| **등록** | 파티션은 반드시 `CREATE TABLE ... PARTITION OF` 로 수동 등록 (또는 아래 함수로 등록). |
| **자동 생성** | “주문 수정 시마다 자동 생성”은 없음. 스케줄(A) 또는 저장 전 함수 호출(B)으로 대체. |
| **권장** | 매월 스케줄로 다음 달 파티션을 `ensure_om_order_m_partition_for` 로 생성해 두는 방식 권장. |
