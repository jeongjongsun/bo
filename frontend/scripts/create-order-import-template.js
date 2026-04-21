/**
 * 주문 일괄등록 엑셀 양식 생성.
 * 발주주문 > 주문등록 > 주문 일괄등록용. 법인/판매유형/등록일은 화면 선택값 사용.
 * 실행: cd frontend && node scripts/create-order-import-template.js
 */
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 시트명 */
const SHEET_NAME = '주문일괄등록';

/**
 * 컬럼: 주문번호(같은 값=한 주문, order_no 저장) / 쇼핑몰·상점·주문일 / 수령인·주문자·메모·배송비·결제방법 / 상품·수량·금액.
 * 법인코드·판매유형코드·등록일은 양식에 없음 → 화면에서 선택한 법인·메뉴(판매유형)·업로드일로 등록.
 */
const HEADERS = [
  '주문번호',
  '상점코드',
  '주문일',
  '수령인명',
  '수령인연락처',
  '수령인휴대폰',
  '수령인우편번호',
  '수령인주소',
  '수령인상세주소',
  '주문자명',
  '주문자연락처',
  '주문자휴대폰',
  '메모',
  '배송비',
  '결제방법코드',
  '상품코드',
  '상품명',
  '수량',
  '금액',
  '할인금액',
];

/** 헤더 설명 행 (두 번째 행). 결제방법코드: 공통코드 PAYMENT_METHOD 전체 안내 */
const HEADER_DESC = [
  '같은 값=한 주문(필수), order_no에 저장',
  '필수(해당 법인에 등록된 상점)',
  'yyyy-MM-dd(선택)',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '숫자(선택)',
  '공통코드 PAYMENT_METHOD: CARD, CASH, BANK_TRANSFER, MOBILE, ETC(선택)',
  '상품코드 또는 상품ID(필수)',
  '참고용(선택)',
  '기본 1(필수)',
  '기본 0(필수)',
  '기본 0(선택)',
];

/** 샘플 데이터: 주문 2건. 1건=2라인, 2건=1라인 */
const SAMPLE_DATA = [
  [
    'ORD-001',
    'STORE01',
    '2025-03-08',
    '홍길동',
    '02-1234-5678',
    '010-1234-5678',
    '12345',
    '서울시 강남구 테헤란로 123',
    '101동 1001호',
    '홍길동',
    '02-1234-5678',
    '010-1234-5678',
    '빠른 배송 부탁드립니다',
    3000,
    'CARD',
    'PRD-A001',
    '테스트 상품 A',
    2,
    24000,
    0,
  ],
  [
    'ORD-001',
    'STORE01',
    '2025-03-08',
    '홍길동',
    '02-1234-5678',
    '010-1234-5678',
    '12345',
    '서울시 강남구 테헤란로 123',
    '101동 1001호',
    '홍길동',
    '02-1234-5678',
    '010-1234-5678',
    '빠른 배송 부탁드립니다',
    3000,
    'CARD',
    'PRD-A002',
    '테스트 상품 B',
    1,
    7000,
    500,
  ],
  [
    'ORD-002',
    'STORE01',
    '2025-03-08',
    '김철수',
    '031-987-6543',
    '010-9876-5432',
    '13487',
    '경기도 성남시 분당구 판교로 456',
    '',
    '김철수',
    '031-987-6543',
    '010-9876-5432',
    '',
    0,
    'BANK_TRANSFER',
    'SET-001',
    '테스트 세트상품',
    1,
    25000,
    0,
  ],
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([HEADERS, HEADER_DESC, ...SAMPLE_DATA]);

if (!ws['!cols']) ws['!cols'] = [];
ws['!cols'][0] = { wch: 12 };

XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);

const outPath = join(__dirname, '..', 'public', 'order_import_template.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Created:', outPath);
