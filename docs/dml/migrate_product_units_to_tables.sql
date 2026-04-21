-- 기존 product_info JSONB의 units, set_components를 OM_PRODUCT_UNIT, OM_PRODUCT_SET_COMPONENT 테이블로 이전.
-- 새 테이블 생성 후 1회 실행.
-- (docs/ddl: OM_PRODUCT_UNIT, OM_PRODUCT_SET_COMPONENT 테이블이 이미 있어야 함.)

-- 1) 단위/바코드 이전 (product_info -> 'units' 배열)
INSERT INTO om_product_unit (product_id, unit_cd, barcode, pack_qty, is_base_unit, sort_order)
SELECT p.product_id,
       COALESCE(elem ->> 'unit_cd', elem ->> 'unitCd', 'EA'),
       NULLIF(TRIM(elem ->> 'barcode'), ''),
       COALESCE((elem ->> 'pack_qty')::int, (elem ->> 'packQty')::int, 1),
       COALESCE((elem ->> 'is_base_unit')::boolean, (elem ->> 'isBaseUnit')::boolean, false),
       (ord.idx - 1)
  FROM om_product_m p,
       jsonb_array_elements(
         CASE WHEN p.product_info IS NOT NULL
                AND jsonb_typeof(COALESCE(p.product_info -> 'units', 'null'::jsonb)) = 'array'
              THEN p.product_info -> 'units'
              ELSE '[]'::jsonb
         END
       ) WITH ORDINALITY AS ord(elem, idx)
 WHERE NOT EXISTS (SELECT 1 FROM om_product_unit u WHERE u.product_id = p.product_id);

-- 2) 세트 구성품 이전 (product_info -> 'set_components' 배열)
INSERT INTO om_product_set_component (product_id, component_product_id, component_qty, sort_order)
SELECT p.product_id,
       COALESCE(elem ->> 'component_product_id', elem ->> 'componentProductId', ''),
       COALESCE((elem ->> 'component_qty')::int, (elem ->> 'componentQty')::int, 1),
       (ord.idx - 1)
  FROM om_product_m p,
       jsonb_array_elements(
         CASE WHEN p.product_info IS NOT NULL
                AND jsonb_typeof(COALESCE(p.product_info -> 'set_components', 'null'::jsonb)) = 'array'
              THEN p.product_info -> 'set_components'
              ELSE '[]'::jsonb
         END
       ) WITH ORDINALITY AS ord(elem, idx)
 WHERE p.product_type = 'SET'
   AND COALESCE(elem ->> 'component_product_id', elem ->> 'componentProductId', '') != ''
   AND NOT EXISTS (SELECT 1 FROM om_product_set_component s WHERE s.product_id = p.product_id);

-- 3) (선택) product_info에서 units, set_components 키 제거
-- UPDATE om_product_m SET product_info = product_info - 'units' - 'set_components' WHERE product_info ? 'units' OR product_info ? 'set_components';
