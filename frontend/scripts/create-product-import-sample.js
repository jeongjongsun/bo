/**
 * 상품 엑셀 일괄 등록 테스트용 샘플 파일 생성.
 * backend ProductExcelParser 헤더와 동일(한글). 실행: cd frontend && node scripts/create-product-import-sample.js
 */
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PRODUCTS_HEADERS = [
  '상품코드', '상품명', '상품유형 (SINGLE 또는 SET)', '기본단위코드', '판매여부 (Y 또는 N)', '전시여부 (Y 또는 N)',
  '상품영문명', '카테고리코드', '브랜드코드', '원가', '공급가', '과세유형', '안전재고', '최소주문수량', '최대주문수량',
  '정렬순서', '상품설명', '이미지URL', '비고'
];
const UNITS_HEADERS = ['상품코드', '단위코드', '바코드', '입수량', '기본단위 (Y 또는 N)'];
const SET_HEADERS = ['세트상품코드', '구성품상품코드', '구성품수량'];

const productsData = [
  ['PRD-A001', '테스트 단일상품 A', 'SINGLE', 'EA', 'Y', 'Y', '', '', '', 1000, 1200, 'TAXABLE', 10, 1, 999, 1, '', '', ''],
  ['PRD-A002', '테스트 단일상품 B', 'SINGLE', 'EA', 'Y', 'Y', '', '', '', 500, 700, 'TAXABLE', 5, 1, 100, 2, '', '', ''],
  ['SET-001', '테스트 세트상품', 'SET', 'EA', 'Y', 'Y', '', '', '', 2000, 2500, 'TAXABLE', 0, 1, 50, 3, '', '', '']
];

const unitsData = [
  ['PRD-A001', 'EA', '8801234567890', 1, 'Y'],
  ['PRD-A001', 'BOX', '8801234567891', 12, 'N'],
  ['PRD-A002', 'EA', '8801234567892', 1, 'Y'],
  ['SET-001', 'EA', '8801234567893', 1, 'Y']
];

const setData = [
  ['SET-001', 'PRD-A001', 2],
  ['SET-001', 'PRD-A002', 1]
];

const wb = XLSX.utils.book_new();
const wsProducts = XLSX.utils.aoa_to_sheet([PRODUCTS_HEADERS, ...productsData]);
const wsUnits = XLSX.utils.aoa_to_sheet([UNITS_HEADERS, ...unitsData]);
const wsSet = XLSX.utils.aoa_to_sheet([SET_HEADERS, ...setData]);

XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
XLSX.utils.book_append_sheet(wb, wsUnits, 'Units');
XLSX.utils.book_append_sheet(wb, wsSet, 'SetComponents');

const outPath = join(__dirname, '..', 'public', 'product_import_sample.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Created:', outPath);
