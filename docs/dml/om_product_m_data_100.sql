-- 상품정보 임시 데이터 100건
-- 법인: CORP01(50건), CORP02(50건) / 단일(SINGLE) 60건, 세트(SET) 40건
-- 포장단위: EA, CS, PLT (공통코드)
-- 실행 순서: OM_PRODUCT_M → OM_PRODUCT_UNIT → OM_PRODUCT_SET_COMPONENT

-- ============================================================
-- 1. OM_PRODUCT_M (100건)
--    CORP01: 0001~0030 SINGLE, 0031~0050 SET
--    CORP02: 0001~0030 SINGLE, 0031~0050 SET
-- ============================================================
INSERT INTO OM_PRODUCT_M (
    product_id, corporation_cd, product_cd, product_nm, product_type,
    sale_price, stock_qty, is_gift, is_sale, is_display, product_info, is_deleted
) VALUES
-- CORP01 SINGLE (30건)
('PRD-CORP01-0001', 'CORP01', 'P0001', '생수 500ml', 'SINGLE', 800, 1000, false, true, true, '{"category_cd":"BEV","sort_order":1}', false),
('PRD-CORP01-0002', 'CORP01', 'P0002', '주스 오렌지 1L', 'SINGLE', 2500, 500, false, true, true, '{"category_cd":"BEV","sort_order":2}', false),
('PRD-CORP01-0003', 'CORP01', 'P0003', '우유 1L', 'SINGLE', 2200, 600, false, true, true, '{"category_cd":"DAIRY","sort_order":3}', false),
('PRD-CORP01-0004', 'CORP01', 'P0004', '라면 5입', 'SINGLE', 3500, 800, false, true, true, '{"category_cd":"NOODLE","sort_order":4}', false),
('PRD-CORP01-0005', 'CORP01', 'P0005', '과자 80g', 'SINGLE', 1500, 1200, false, true, true, '{"category_cd":"SNACK","sort_order":5}', false),
('PRD-CORP01-0006', 'CORP01', 'P0006', '캔커피 250ml', 'SINGLE', 1200, 900, false, true, true, '{"category_cd":"BEV","sort_order":6}', false),
('PRD-CORP01-0007', 'CORP01', 'P0007', '물티슈 80매', 'SINGLE', 1800, 700, false, true, true, '{"category_cd":"LIVING","sort_order":7}', false),
('PRD-CORP01-0008', 'CORP01', 'P0008', '휴지 30롤', 'SINGLE', 12000, 300, false, true, true, '{"category_cd":"LIVING","sort_order":8}', false),
('PRD-CORP01-0009', 'CORP01', 'P0009', '세제 2.5L', 'SINGLE', 8500, 400, false, true, true, '{"category_cd":"LIVING","sort_order":9}', false),
('PRD-CORP01-0010', 'CORP01', 'P0010', '샴푸 500ml', 'SINGLE', 6500, 350, false, true, true, '{"category_cd":"BEAUTY","sort_order":10}', false),
('PRD-CORP01-0011', 'CORP01', 'P0011', '린스 500ml', 'SINGLE', 6500, 350, false, true, true, '{"category_cd":"BEAUTY","sort_order":11}', false),
('PRD-CORP01-0012', 'CORP01', 'P0012', '바디워시 1L', 'SINGLE', 7200, 280, false, true, true, '{"category_cd":"BEAUTY","sort_order":12}', false),
('PRD-CORP01-0013', 'CORP01', 'P0013', '치약 150g', 'SINGLE', 3200, 600, false, true, true, '{"category_cd":"BEAUTY","sort_order":13}', false),
('PRD-CORP01-0014', 'CORP01', 'P0014', '휴대폰케이스', 'SINGLE', 15000, 200, false, true, true, '{"category_cd":"DIGITAL","sort_order":14}', false),
('PRD-CORP01-0015', 'CORP01', 'P0015', 'USB케이블 1m', 'SINGLE', 5500, 450, false, true, true, '{"category_cd":"DIGITAL","sort_order":15}', false),
('PRD-CORP01-0016', 'CORP01', 'P0016', '건전지 4팩', 'SINGLE', 4800, 550, false, true, true, '{"category_cd":"DIGITAL","sort_order":16}', false),
('PRD-CORP01-0017', 'CORP01', 'P0017', '볼펜 12자루', 'SINGLE', 3000, 800, false, true, true, '{"category_cd":"OFFICE","sort_order":17}', false),
('PRD-CORP01-0018', 'CORP01', 'P0018', '노트 A4 5권', 'SINGLE', 4500, 600, false, true, true, '{"category_cd":"OFFICE","sort_order":18}', false),
('PRD-CORP01-0019', 'CORP01', 'P0019', '풀 3개입', 'SINGLE', 2000, 900, false, true, true, '{"category_cd":"OFFICE","sort_order":19}', false),
('PRD-CORP01-0020', 'CORP01', 'P0020', '참치캔 150g', 'SINGLE', 2800, 700, false, true, true, '{"category_cd":"CAN","sort_order":20}', false),
('PRD-CORP01-0021', 'CORP01', 'P0021', '돼지불고기 300g', 'SINGLE', 6500, 400, false, true, true, '{"category_cd":"MEAT","sort_order":21}', false),
('PRD-CORP01-0022', 'CORP01', 'P0022', '닭가슴살 200g', 'SINGLE', 4200, 500, false, true, true, '{"category_cd":"MEAT","sort_order":22}', false),
('PRD-CORP01-0023', 'CORP01', 'P0023', '두부 300g', 'SINGLE', 1800, 350, false, true, true, '{"category_cd":"FRESH","sort_order":23}', false),
('PRD-CORP01-0024', 'CORP01', 'P0024', '계란 10구', 'SINGLE', 4500, 250, false, true, true, '{"category_cd":"FRESH","sort_order":24}', false),
('PRD-CORP01-0025', 'CORP01', 'P0025', '빵 400g', 'SINGLE', 3800, 300, false, true, true, '{"category_cd":"BAKERY","sort_order":25}', false),
('PRD-CORP01-0026', 'CORP01', 'P0026', '잼 340g', 'SINGLE', 4200, 280, false, true, true, '{"category_cd":"CONDIMENT","sort_order":26}', false),
('PRD-CORP01-0027', 'CORP01', 'P0027', '케첩 500g', 'SINGLE', 3500, 320, false, true, true, '{"category_cd":"CONDIMENT","sort_order":27}', false),
('PRD-CORP01-0028', 'CORP01', 'P0028', '소스 250ml', 'SINGLE', 2800, 400, false, true, true, '{"category_cd":"CONDIMENT","sort_order":28}', false),
('PRD-CORP01-0029', 'CORP01', 'P0029', '드링크 250ml', 'SINGLE', 1500, 600, false, true, true, '{"category_cd":"BEV","sort_order":29}', false),
('PRD-CORP01-0030', 'CORP01', 'P0030', '껌 30입', 'SINGLE', 2200, 750, false, true, true, '{"category_cd":"SNACK","sort_order":30}', false),
-- CORP01 SET (20건)
('PRD-CORP01-0031', 'CORP01', 'P0031', '생수+주스 세트', 'SET', 3000, 0, false, true, true, '{"category_cd":"BEV","sort_order":31}', false),
('PRD-CORP01-0032', 'CORP01', 'P0032', '라면 3종 세트', 'SET', 9500, 0, false, true, true, '{"category_cd":"NOODLE","sort_order":32}', false),
('PRD-CORP01-0033', 'CORP01', 'P0033', '과자 5종 세트', 'SET', 6500, 0, false, true, true, '{"category_cd":"SNACK","sort_order":33}', false),
('PRD-CORP01-0034', 'CORP01', 'P0034', '커피 10입 세트', 'SET', 11000, 0, false, true, true, '{"category_cd":"BEV","sort_order":34}', false),
('PRD-CORP01-0035', 'CORP01', 'P0035', '생활용품 세트', 'SET', 22000, 0, false, true, true, '{"category_cd":"LIVING","sort_order":35}', false),
('PRD-CORP01-0036', 'CORP01', 'P0036', '욕실용품 세트', 'SET', 18000, 0, false, true, true, '{"category_cd":"BEAUTY","sort_order":36}', false),
('PRD-CORP01-0037', 'CORP01', 'P0037', '휴대용품 세트', 'SET', 24000, 0, false, true, true, '{"category_cd":"DIGITAL","sort_order":37}', false),
('PRD-CORP01-0038', 'CORP01', 'P0038', '사무용품 세트', 'SET', 8500, 0, false, true, true, '{"category_cd":"OFFICE","sort_order":38}', false),
('PRD-CORP01-0039', 'CORP01', 'P0039', '참치 3캔 세트', 'SET', 7800, 0, false, true, true, '{"category_cd":"CAN","sort_order":39}', false),
('PRD-CORP01-0040', 'CORP01', 'P0040', '고기 2종 세트', 'SET', 10000, 0, false, true, true, '{"category_cd":"MEAT","sort_order":40}', false),
('PRD-CORP01-0041', 'CORP01', 'P0041', '아침세트', 'SET', 8500, 0, false, true, true, '{"category_cd":"FRESH","sort_order":41}', false),
('PRD-CORP01-0042', 'CORP01', 'P0042', '조미료 세트', 'SET', 9500, 0, false, true, true, '{"category_cd":"CONDIMENT","sort_order":42}', false),
('PRD-CORP01-0043', 'CORP01', 'P0043', '음료 스낵 세트', 'SET', 5000, 0, false, true, true, '{"category_cd":"BEV","sort_order":43}', false),
('PRD-CORP01-0044', 'CORP01', 'P0044', '생수 대용량 세트', 'SET', 7200, 0, false, true, true, '{"category_cd":"BEV","sort_order":44}', false),
('PRD-CORP01-0045', 'CORP01', 'P0045', '다용도 클리너 세트', 'SET', 15000, 0, false, true, true, '{"category_cd":"LIVING","sort_order":45}', false),
('PRD-CORP01-0046', 'CORP01', 'P0046', '헤어케어 세트', 'SET', 12000, 0, false, true, true, '{"category_cd":"BEAUTY","sort_order":46}', false),
('PRD-CORP01-0047', 'CORP01', 'P0047', '배터리 케이블 세트', 'SET', 9000, 0, false, true, true, '{"category_cd":"DIGITAL","sort_order":47}', false),
('PRD-CORP01-0048', 'CORP01', 'P0048', '문구 4종 세트', 'SET', 12000, 0, false, true, true, '{"category_cd":"OFFICE","sort_order":48}', false),
('PRD-CORP01-0049', 'CORP01', 'P0049', '캔푸드 세트', 'SET', 15000, 0, false, true, true, '{"category_cd":"CAN","sort_order":49}', false),
('PRD-CORP01-0050', 'CORP01', 'P0050', '프리미엄 선물세트', 'SET', 35000, 0, true, true, true, '{"category_cd":"GIFT","sort_order":50}', false),
-- CORP02 SINGLE (30건)
('PRD-CORP02-0001', 'CORP02', 'P0001', '탄산수 350ml', 'SINGLE', 900, 800, false, true, true, '{"category_cd":"BEV","sort_order":1}', false),
('PRD-CORP02-0002', 'CORP02', 'P0002', '녹차 500ml', 'SINGLE', 1200, 650, false, true, true, '{"category_cd":"BEV","sort_order":2}', false),
('PRD-CORP02-0003', 'CORP02', 'P0003', '요거트 100g', 'SINGLE', 1800, 550, false, true, true, '{"category_cd":"DAIRY","sort_order":3}', false),
('PRD-CORP02-0004', 'CORP02', 'P0004', '짜장면 1인분', 'SINGLE', 4200, 400, false, true, true, '{"category_cd":"NOODLE","sort_order":4}', false),
('PRD-CORP02-0005', 'CORP02', 'P0005', '초코바 50g', 'SINGLE', 1300, 1100, false, true, true, '{"category_cd":"SNACK","sort_order":5}', false),
('PRD-CORP02-0006', 'CORP02', 'P0006', '원두커피 200g', 'SINGLE', 12000, 200, false, true, true, '{"category_cd":"BEV","sort_order":6}', false),
('PRD-CORP02-0007', 'CORP02', 'P0007', '마스크 50매', 'SINGLE', 9500, 350, false, true, true, '{"category_cd":"LIVING","sort_order":7}', false),
('PRD-CORP02-0008', 'CORP02', 'P0008', '쓰레기봉투 100매', 'SINGLE', 5500, 450, false, true, true, '{"category_cd":"LIVING","sort_order":8}', false),
('PRD-CORP02-0009', 'CORP02', 'P0009', '섬유유연제 3L', 'SINGLE', 11000, 280, false, true, true, '{"category_cd":"LIVING","sort_order":9}', false),
('PRD-CORP02-0010', 'CORP02', 'P0010', '폼클렌저 150ml', 'SINGLE', 8500, 320, false, true, true, '{"category_cd":"BEAUTY","sort_order":10}', false),
('PRD-CORP02-0011', 'CORP02', 'P0011', '로션 300ml', 'SINGLE', 12000, 250, false, true, true, '{"category_cd":"BEAUTY","sort_order":11}', false),
('PRD-CORP02-0012', 'CORP02', 'P0012', '선크림 50ml', 'SINGLE', 15000, 180, false, true, true, '{"category_cd":"BEAUTY","sort_order":12}', false),
('PRD-CORP02-0013', 'CORP02', 'P0013', '칫솔 4개입', 'SINGLE', 4500, 500, false, true, true, '{"category_cd":"BEAUTY","sort_order":13}', false),
('PRD-CORP02-0014', 'CORP02', 'P0014', '이어폰', 'SINGLE', 12000, 300, false, true, true, '{"category_cd":"DIGITAL","sort_order":14}', false),
('PRD-CORP02-0015', 'CORP02', 'P0015', '충전기 20W', 'SINGLE', 18000, 220, false, true, true, '{"category_cd":"DIGITAL","sort_order":15}', false),
('PRD-CORP02-0016', 'CORP02', 'P0016', '멀티탭 4구', 'SINGLE', 15000, 190, false, true, true, '{"category_cd":"DIGITAL","sort_order":16}', false),
('PRD-CORP02-0017', 'CORP02', 'P0017', '형광펜 5색', 'SINGLE', 3500, 600, false, true, true, '{"category_cd":"OFFICE","sort_order":17}', false),
('PRD-CORP02-0018', 'CORP02', 'P0018', '클립 100개', 'SINGLE', 2500, 700, false, true, true, '{"category_cd":"OFFICE","sort_order":18}', false),
('PRD-CORP02-0019', 'CORP02', 'P0019', '스테이플러', 'SINGLE', 5500, 350, false, true, true, '{"category_cd":"OFFICE","sort_order":19}', false),
('PRD-CORP02-0020', 'CORP02', 'P0020', '옥수수캔 340g', 'SINGLE', 2200, 480, false, true, true, '{"category_cd":"CAN","sort_order":20}', false),
('PRD-CORP02-0021', 'CORP02', 'P0021', '소고기 200g', 'SINGLE', 12000, 280, false, true, true, '{"category_cd":"MEAT","sort_order":21}', false),
('PRD-CORP02-0022', 'CORP02', 'P0022', '삼겹살 400g', 'SINGLE', 9500, 320, false, true, true, '{"category_cd":"MEAT","sort_order":22}', false),
('PRD-CORP02-0023', 'CORP02', 'P0023', '김치 500g', 'SINGLE', 6500, 200, false, true, true, '{"category_cd":"FRESH","sort_order":23}', false),
('PRD-CORP02-0024', 'CORP02', 'P0024', '우유 2L', 'SINGLE', 3800, 400, false, true, true, '{"category_cd":"DAIRY","sort_order":24}', false),
('PRD-CORP02-0025', 'CORP02', 'P0025', '쿠키 200g', 'SINGLE', 4200, 380, false, true, true, '{"category_cd":"BAKERY","sort_order":25}', false),
('PRD-CORP02-0026', 'CORP02', 'P0026', '올리브오일 500ml', 'SINGLE', 12000, 150, false, true, true, '{"category_cd":"CONDIMENT","sort_order":26}', false),
('PRD-CORP02-0027', 'CORP02', 'P0027', '간장 500ml', 'SINGLE', 4500, 280, false, true, true, '{"category_cd":"CONDIMENT","sort_order":27}', false),
('PRD-CORP02-0028', 'CORP02', 'P0028', '고추장 500g', 'SINGLE', 5500, 260, false, true, true, '{"category_cd":"CONDIMENT","sort_order":28}', false),
('PRD-CORP02-0029', 'CORP02', 'P0029', '에너지드링크 250ml', 'SINGLE', 1800, 520, false, true, true, '{"category_cd":"BEV","sort_order":29}', false),
('PRD-CORP02-0030', 'CORP02', 'P0030', '젤리 80g', 'SINGLE', 1600, 680, false, true, true, '{"category_cd":"SNACK","sort_order":30}', false),
-- CORP02 SET (20건)
('PRD-CORP02-0031', 'CORP02', 'P0031', '탄산음료 세트', 'SET', 4500, 0, false, true, true, '{"category_cd":"BEV","sort_order":31}', false),
('PRD-CORP02-0032', 'CORP02', 'P0032', '면류 3종 세트', 'SET', 11000, 0, false, true, true, '{"category_cd":"NOODLE","sort_order":32}', false),
('PRD-CORP02-0033', 'CORP02', 'P0033', '스낵 4종 세트', 'SET', 5500, 0, false, true, true, '{"category_cd":"SNACK","sort_order":33}', false),
('PRD-CORP02-0034', 'CORP02', 'P0034', '커피 원두 세트', 'SET', 22000, 0, false, true, true, '{"category_cd":"BEV","sort_order":34}', false),
('PRD-CORP02-0035', 'CORP02', 'P0035', '가정용 청소 세트', 'SET', 25000, 0, false, true, true, '{"category_cd":"LIVING","sort_order":35}', false),
('PRD-CORP02-0036', 'CORP02', 'P0036', '스킨케어 세트', 'SET', 28000, 0, false, true, true, '{"category_cd":"BEAUTY","sort_order":36}', false),
('PRD-CORP02-0037', 'CORP02', 'P0037', '충전 케이블 세트', 'SET', 25000, 0, false, true, true, '{"category_cd":"DIGITAL","sort_order":37}', false),
('PRD-CORP02-0038', 'CORP02', 'P0038', '학생용 문구 세트', 'SET', 9500, 0, false, true, true, '{"category_cd":"OFFICE","sort_order":38}', false),
('PRD-CORP02-0039', 'CORP02', 'P0039', '캔 5종 세트', 'SET', 12000, 0, false, true, true, '{"category_cd":"CAN","sort_order":39}', false),
('PRD-CORP02-0040', 'CORP02', 'P0040', '고기 3종 세트', 'SET', 28000, 0, false, true, true, '{"category_cd":"MEAT","sort_order":40}', false),
('PRD-CORP02-0041', 'CORP02', 'P0041', '신선식품 세트', 'SET', 15000, 0, false, true, true, '{"category_cd":"FRESH","sort_order":41}', false),
('PRD-CORP02-0042', 'CORP02', 'P0042', '양념 4종 세트', 'SET', 22000, 0, false, true, true, '{"category_cd":"CONDIMENT","sort_order":42}', false),
('PRD-CORP02-0043', 'CORP02', 'P0043', '음료 스낵 패키지', 'SET', 6500, 0, false, true, true, '{"category_cd":"BEV","sort_order":43}', false),
('PRD-CORP02-0044', 'CORP02', 'P0044', '생수 음료 세트', 'SET', 8000, 0, false, true, true, '{"category_cd":"BEV","sort_order":44}', false),
('PRD-CORP02-0045', 'CORP02', 'P0045', '세탁 세트', 'SET', 16000, 0, false, true, true, '{"category_cd":"LIVING","sort_order":45}', false),
('PRD-CORP02-0046', 'CORP02', 'P0046', '선물용 화장품 세트', 'SET', 35000, 0, false, true, true, '{"category_cd":"BEAUTY","sort_order":46}', false),
('PRD-CORP02-0047', 'CORP02', 'P0047', '전자기기 악세서리 세트', 'SET', 32000, 0, false, true, true, '{"category_cd":"DIGITAL","sort_order":47}', false),
('PRD-CORP02-0048', 'CORP02', 'P0048', '오피스 세트', 'SET', 18000, 0, false, true, true, '{"category_cd":"OFFICE","sort_order":48}', false),
('PRD-CORP02-0049', 'CORP02', 'P0049', '캔푸드 대용량 세트', 'SET', 18000, 0, false, true, true, '{"category_cd":"CAN","sort_order":49}', false),
('PRD-CORP02-0050', 'CORP02', 'P0050', '프리미엄 고기 선물세트', 'SET', 45000, 0, true, true, true, '{"category_cd":"GIFT","sort_order":50}', false);

-- ============================================================
-- 2. OM_PRODUCT_UNIT (상품당 EA, CS, PLT 단위)
--    unit_cd: EA(기본), CS(입수 12), PLT(입수 100)
-- ============================================================
INSERT INTO OM_PRODUCT_UNIT (product_id, unit_cd, barcode, pack_qty, is_base_unit, sort_order)
SELECT p.product_id, u.unit_cd,
       '8801' || LPAD((ROW_NUMBER() OVER (ORDER BY p.product_id, u.ord) - 1)::text, 10, '0'),
       u.pack_qty, u.is_base_unit, u.sort_order
FROM OM_PRODUCT_M p
CROSS JOIN (VALUES ('EA', 1, true, 0, 1), ('CS', 12, false, 1, 2), ('PLT', 100, false, 2, 3)) AS u(unit_cd, pack_qty, is_base_unit, sort_order, ord)
WHERE p.corporation_cd IN ('CORP01', 'CORP02');

-- ============================================================
-- 3. OM_PRODUCT_SET_COMPONENT (세트 상품 구성품)
--    SET 상품(0031~0050)이 해당 법인 SINGLE 상품(0001~0030)을 참조
-- ============================================================
INSERT INTO OM_PRODUCT_SET_COMPONENT (product_id, component_product_id, component_qty, sort_order) VALUES
-- CORP01 SET 구성
('PRD-CORP01-0031', 'PRD-CORP01-0001', 2, 0), ('PRD-CORP01-0031', 'PRD-CORP01-0002', 1, 1),
('PRD-CORP01-0032', 'PRD-CORP01-0004', 1, 0), ('PRD-CORP01-0032', 'PRD-CORP01-0006', 2, 1), ('PRD-CORP01-0032', 'PRD-CORP01-0029', 1, 2),
('PRD-CORP01-0033', 'PRD-CORP01-0005', 2, 0), ('PRD-CORP01-0033', 'PRD-CORP01-0030', 1, 1), ('PRD-CORP01-0033', 'PRD-CORP01-0029', 2, 2),
('PRD-CORP01-0034', 'PRD-CORP01-0006', 10, 0),
('PRD-CORP01-0035', 'PRD-CORP01-0007', 1, 0), ('PRD-CORP01-0035', 'PRD-CORP01-0008', 1, 1), ('PRD-CORP01-0035', 'PRD-CORP01-0009', 1, 2),
('PRD-CORP01-0036', 'PRD-CORP01-0010', 1, 0), ('PRD-CORP01-0036', 'PRD-CORP01-0011', 1, 1), ('PRD-CORP01-0036', 'PRD-CORP01-0013', 1, 2),
('PRD-CORP01-0037', 'PRD-CORP01-0014', 1, 0), ('PRD-CORP01-0037', 'PRD-CORP01-0015', 2, 1), ('PRD-CORP01-0037', 'PRD-CORP01-0016', 1, 2),
('PRD-CORP01-0038', 'PRD-CORP01-0017', 1, 0), ('PRD-CORP01-0038', 'PRD-CORP01-0018', 1, 1), ('PRD-CORP01-0038', 'PRD-CORP01-0019', 2, 2),
('PRD-CORP01-0039', 'PRD-CORP01-0020', 3, 0),
('PRD-CORP01-0040', 'PRD-CORP01-0021', 1, 0), ('PRD-CORP01-0040', 'PRD-CORP01-0022', 1, 1),
('PRD-CORP01-0041', 'PRD-CORP01-0023', 1, 0), ('PRD-CORP01-0041', 'PRD-CORP01-0024', 1, 1), ('PRD-CORP01-0041', 'PRD-CORP01-0025', 1, 2),
('PRD-CORP01-0042', 'PRD-CORP01-0026', 1, 0), ('PRD-CORP01-0042', 'PRD-CORP01-0027', 1, 1), ('PRD-CORP01-0042', 'PRD-CORP01-0028', 1, 2),
('PRD-CORP01-0043', 'PRD-CORP01-0001', 2, 0), ('PRD-CORP01-0043', 'PRD-CORP01-0005', 1, 1), ('PRD-CORP01-0043', 'PRD-CORP01-0030', 1, 2),
('PRD-CORP01-0044', 'PRD-CORP01-0001', 6, 0),
('PRD-CORP01-0045', 'PRD-CORP01-0009', 1, 0), ('PRD-CORP01-0045', 'PRD-CORP01-0007', 2, 1),
('PRD-CORP01-0046', 'PRD-CORP01-0010', 1, 0), ('PRD-CORP01-0046', 'PRD-CORP01-0011', 1, 1), ('PRD-CORP01-0046', 'PRD-CORP01-0012', 1, 2),
('PRD-CORP01-0047', 'PRD-CORP01-0015', 1, 0), ('PRD-CORP01-0047', 'PRD-CORP01-0016', 1, 1),
('PRD-CORP01-0048', 'PRD-CORP01-0017', 2, 0), ('PRD-CORP01-0048', 'PRD-CORP01-0018', 2, 1), ('PRD-CORP01-0048', 'PRD-CORP01-0019', 1, 2),
('PRD-CORP01-0049', 'PRD-CORP01-0020', 4, 0), ('PRD-CORP01-0049', 'PRD-CORP01-0004', 2, 1),
('PRD-CORP01-0050', 'PRD-CORP01-0021', 1, 0), ('PRD-CORP01-0050', 'PRD-CORP01-0026', 1, 1), ('PRD-CORP01-0050', 'PRD-CORP01-0002', 2, 2), ('PRD-CORP01-0050', 'PRD-CORP01-0025', 1, 3),
-- CORP02 SET 구성
('PRD-CORP02-0031', 'PRD-CORP02-0001', 3, 0), ('PRD-CORP02-0031', 'PRD-CORP02-0002', 2, 1),
('PRD-CORP02-0032', 'PRD-CORP02-0004', 1, 0), ('PRD-CORP02-0032', 'PRD-CORP02-0006', 1, 1), ('PRD-CORP02-0032', 'PRD-CORP02-0029', 2, 2),
('PRD-CORP02-0033', 'PRD-CORP02-0005', 2, 0), ('PRD-CORP02-0033', 'PRD-CORP02-0030', 1, 1), ('PRD-CORP02-0033', 'PRD-CORP02-0003', 1, 2),
('PRD-CORP02-0034', 'PRD-CORP02-0006', 2, 0),
('PRD-CORP02-0035', 'PRD-CORP02-0007', 1, 0), ('PRD-CORP02-0035', 'PRD-CORP02-0008', 1, 1), ('PRD-CORP02-0035', 'PRD-CORP02-0009', 1, 2),
('PRD-CORP02-0036', 'PRD-CORP02-0010', 1, 0), ('PRD-CORP02-0036', 'PRD-CORP02-0011', 1, 1), ('PRD-CORP02-0036', 'PRD-CORP02-0012', 1, 2),
('PRD-CORP02-0037', 'PRD-CORP02-0014', 1, 0), ('PRD-CORP02-0037', 'PRD-CORP02-0015', 1, 1), ('PRD-CORP02-0037', 'PRD-CORP02-0016', 1, 2),
('PRD-CORP02-0038', 'PRD-CORP02-0017', 1, 0), ('PRD-CORP02-0038', 'PRD-CORP02-0018', 1, 1), ('PRD-CORP02-0038', 'PRD-CORP02-0019', 1, 2),
('PRD-CORP02-0039', 'PRD-CORP02-0020', 2, 0), ('PRD-CORP02-0039', 'PRD-CORP02-0004', 1, 1),
('PRD-CORP02-0040', 'PRD-CORP02-0021', 1, 0), ('PRD-CORP02-0040', 'PRD-CORP02-0022', 1, 1), ('PRD-CORP02-0040', 'PRD-CORP02-0003', 2, 2),
('PRD-CORP02-0041', 'PRD-CORP02-0023', 1, 0), ('PRD-CORP02-0041', 'PRD-CORP02-0024', 1, 1), ('PRD-CORP02-0041', 'PRD-CORP02-0025', 1, 2),
('PRD-CORP02-0042', 'PRD-CORP02-0026', 1, 0), ('PRD-CORP02-0042', 'PRD-CORP02-0027', 1, 1), ('PRD-CORP02-0042', 'PRD-CORP02-0028', 1, 2),
('PRD-CORP02-0043', 'PRD-CORP02-0001', 2, 0), ('PRD-CORP02-0043', 'PRD-CORP02-0005', 1, 1), ('PRD-CORP02-0043', 'PRD-CORP02-0030', 1, 2),
('PRD-CORP02-0044', 'PRD-CORP02-0001', 4, 0), ('PRD-CORP02-0044', 'PRD-CORP02-0002', 2, 1),
('PRD-CORP02-0045', 'PRD-CORP02-0009', 1, 0), ('PRD-CORP02-0045', 'PRD-CORP02-0008', 1, 1),
('PRD-CORP02-0046', 'PRD-CORP02-0010', 1, 0), ('PRD-CORP02-0046', 'PRD-CORP02-0011', 1, 1), ('PRD-CORP02-0046', 'PRD-CORP02-0012', 1, 2),
('PRD-CORP02-0047', 'PRD-CORP02-0014', 1, 0), ('PRD-CORP02-0047', 'PRD-CORP02-0015', 1, 1), ('PRD-CORP02-0047', 'PRD-CORP02-0016', 1, 2),
('PRD-CORP02-0048', 'PRD-CORP02-0017', 2, 0), ('PRD-CORP02-0048', 'PRD-CORP02-0018', 1, 1), ('PRD-CORP02-0048', 'PRD-CORP02-0019', 1, 2),
('PRD-CORP02-0049', 'PRD-CORP02-0020', 5, 0), ('PRD-CORP02-0049', 'PRD-CORP02-0004', 2, 1),
('PRD-CORP02-0050', 'PRD-CORP02-0021', 1, 0), ('PRD-CORP02-0050', 'PRD-CORP02-0022', 1, 1), ('PRD-CORP02-0050', 'PRD-CORP02-0026', 1, 2), ('PRD-CORP02-0050', 'PRD-CORP02-0025', 1, 3);
