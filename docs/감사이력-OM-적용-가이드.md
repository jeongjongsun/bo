# 감사이력 OM 적용 가이드

## 1. 목적

- BO에서 확정한 감사이력 정책을 OM 시스템에 동일하게 적용하기 위한 개발 지시서다.
- 본 문서만으로 OM 개발자가 구현/검증/배포 준비를 수행할 수 있도록 작성한다.

## 2. 필수 원칙

- 공통 테이블: `om_audit_log_h` 사용
- 시스템 구분: `system_sub_cd = 'OM'`
- 대상 액션: `CREATE`, `UPDATE`, `DELETE`
- 서비스 트랜잭션 내에서 본 변경 + 감사 저장을 함께 처리
- 실패 시도는 감사 미기록

## 3. 구현 템플릿

OM 서비스의 C/U/D 메서드마다 아래 순서를 적용한다.

1. 입력 검증
2. 변경 전 데이터 조회(`before_data`)
3. 본 데이터 변경
4. 변경 후 데이터 구성(`after_data`)
5. `AuditService.record(...)` 호출

## 4. 필수 파라미터 매핑

- `domain_type`: OM 도메인명 (예: `ORDER`, `PRODUCT`, `MALL`)
- `system_main_cd`: `SYSTEM`
- `system_sub_cd`: `OM`
- `menu_code`: OM 메뉴 ID (`om_menu_m.menu_id`와 동일 권장)
- `menu_name_ko`: OM 한글 메뉴명
- `action_code`: `CREATE`/`UPDATE`/`DELETE`
- `entity_type`: 실제 테이블명 (예: `om_order_m`)
- `entity_id`: 엔터티 식별자(PK/복합키 직렬화)
- `before_data`: 변경 전 JSON
- `after_data`: 변경 후 JSON
- `actor_user_id`: 수행 사용자 ID

## 5. changed_fields 한글 통일 규칙

- 기본: `before_data` vs `after_data` diff로 자동 계산
- 저장 값: 한글 라벨 배열(JSONB)
- 메뉴별 라벨은 `AuditServiceImpl` 사전에 추가한다.
- OM 신규 화면 추가 시 반드시 사전에 라벨을 등록한다.

## 6. before_data / after_data 구조 통일 규칙 (중요)

- `UPDATE`는 반드시 **동일한 JSON 스키마**로 `before_data`, `after_data`를 저장한다.
- `field/value` 같은 단건 이벤트 포맷은 사용하지 않는다.
- 한 메서드 내 CUD에서 스냅샷 빌더 메서드를 공통으로 사용해 키 누락/형식 불일치를 방지한다.
- `CREATE`는 `before_data = {}`, `after_data = 신규 스냅샷` 형태를 기본으로 한다.
- `DELETE`는 `before_data = 삭제 전 스냅샷`, `after_data = 동일 스냅샷 + 삭제표시 필드` 형태를 권장한다.

### 6.1 스냅샷 키 설계 예시

- 사용자성 엔터티: `userNm`, `emailId`, `gradeCd`, `authGroup`, `userStatus`, `mobileNo`, `corporationCd`
- 메뉴성 엔터티: `menuId`, `parentMenuId`, `systemMainCd`, `systemSubCd`, `menuNmKo`, `menuUrl`, `isActive`, `dispSeq`, `icon`, `menuType`
- 코드성 엔터티: `mainCd`, `subCd`, `codeNm`, `codeInfo`

### 6.2 구현 체크포인트

- `before_data`를 raw DB row 직렬화로 저장하지 말고, 감사용 표준 스키마로 정규화한다.
- `after_data`도 동일한 빌더를 사용해 생성한다.
- `changed_fields`는 서비스에서 수동 지정하지 않고(`[]` 고정 금지), 공통 Audit 로직의 자동 diff 결과를 사용한다.

## 7. OM 적용 우선순위(권장)

1. 권한/사용자 관리
2. 주문 상태 변경
3. 상품/매칭 정보 변경
4. 쇼핑몰/연동 설정 변경
5. 기타 운영설정

## 8. QA 시나리오(최소)

- 메뉴별 등록 1건 -> 감사 1건 생성 확인
- 메뉴별 수정 1건 -> `before_data`/`after_data`의 키셋이 동일한지 확인
- 메뉴별 삭제 1건 -> `action_code=DELETE` 확인
- 전체 항목에서 `system_sub_cd='OM'` 확인
- `changed_fields`가 한글 라벨로 저장되는지 확인
- 단건 그리드 수정에서도 `field/value` 포맷이 아닌 도메인 스냅샷 포맷인지 확인

## 9. 운영 전 점검

- `om_audit_log_h` 파티션/아카이브 함수 반영
- 인덱스/쿼리 플랜 점검
- 대량 수정 API의 `before/after` 용량 점검(필요 시 축약)
- 감사 저장 실패 시 롤백 동작 검증
