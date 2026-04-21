# CSS 표준 (프론트엔드 스타일 가이드)

화면/모달을 만들 때 **기존 public/css/ 스타일을 최대한 활용**하고, 필요한 경우에만 커스텀 CSS를 추가합니다.

---

## 1. 기존 CSS 사용 우선

| 경로 | 용도 |
|------|------|
| `frontend/public/css/theme.css` (또는 `theme.min.css`) | Phoenix/Bootstrap 테마 - `.card`, `.btn`, `.table`, `.form-control`, `.modal` 등 |
| `frontend/public/css/user.css` | 폰트·색상 변수 오버라이드 |
| `frontend/public/css/product-set-items.css` | 상품 세트 구성품 관련 (`.card`, `.set-item-row`, Choices.js 등) |

- 새 화면·모달을 만들 때 위 클래스를 먼저 활용한다.
- 예: `card`, `card-header`, `card-body`, `btn`, `btn-primary`, `btn-secondary`, `table`, `table-bordered`, `form-control`, `form-label`, `modal`, `modal-dialog` 등

---

## 2. 커스텀 CSS 추가 시

- **위 클래스로 표현 불가능한 경우에만** `frontend/src/layout.css`에 새 스타일을 추가한다.
- 네이밍: BEM 또는 `컴포넌트__요소--변형` (예: `product-edit__tab--active`).
- 가능하면 `layout.css`에 추가하고, `frontend/public/css/`에 새 파일을 만들지 않는다 (공통 테마와의 일관성 유지).

---

## 3. 적용 순서

1. `theme.css` 등 기존 클래스로 구현 시도
2. 불가 시 `layout.css`에 최소한의 커스텀 스타일 추가
3. 반복되는 패턴이면 공통 클래스로 추출해 `layout.css`에 정의

---

## 4. React 앱에서 theme.css 로드

- React SPA에서 `frontend/index.html`에 `<link href="/css/theme.min.css" rel="stylesheet">`, `<link href="/css/user.css" rel="stylesheet">`를 포함해 모든 페이지에서 공통 테마를 사용한다.
- `main.tsx`에서 `index.css`, `layout.css`를 import해 theme 이후에 앱 전용 스타일이 적용되도록 한다.

## 5. 페이지 기본 요소 통일

- **레이아웃**: 모든 콘텐츠 페이지는 `PageLayout`(`@/components/layout/PageLayout`)으로 감싼다. 제목(`title`), 부가설명(`lead`), 본문(`children`)을 넘기면 theme 기준으로 동일한 타이틀·리드 스타일이 적용된다.
- **제목**: `h2.mb-2.lh-sm` (PageLayout 내부에서 적용).
- **버튼**: 주 액션은 `btn btn-phoenix-primary`, 보조/취소는 `btn btn-phoenix-secondary`, 삭제/위험은 `btn btn-phoenix-danger`. 링크 스타일 버튼은 `btn btn-link`.
- **폼**: `form-control`, `form-select`, `form-floating` 등 theme 클래스 사용. 그리드 툴바 검색/내보내기 버튼도 `form-control`, `btn btn-phoenix-primary`, `btn btn-phoenix-secondary`로 통일한다.

---

## 6. 입력/수정 폼 행간격 (통일)

등록·수정 화면의 폼에서는 아래 클래스로 행간격을 **통일**한다.

| 용도 | 클래스 | 비고 |
|------|--------|------|
| 폼 그리드(행/열) | `row g-2` | `g-4` 사용 금지. gutter를 좁게 유지 |
| 필드 래퍼(floating label 등) | `form-floating mb-2` | `mb-3` 사용 금지 |
| 섹션 헤더(제목+버튼 한 줄) | `d-flex justify-content-between align-items-center mb-2` | 툴바·단위/세트 헤더 등 |

- **기준 화면**: 상품 수정(`ProductEditPage`) — 기본정보, 부가정보, 단위/바코드, 세트 구성품 모두 위 규칙 적용.
- 새로 만드는 입력/수정 폼도 동일하게 적용한다.

---

## 7. 필수 입력 항목 표시

`required` 속성이 있는 입력 항목은 아래 **세 가지**로 필수임을 표시한다.

1. **라벨 옆 필수 별표(*)**: 라벨 텍스트 뒤에 `<span className="text-primary ms-1" aria-hidden="true">*</span>` 추가.
2. **라벨 강조**: 필드 래퍼(`form-floating`)에 클래스 `required`를 붙이면, 라벨이 **primary 색상 + 굵게** 적용된다 (layout.css).
3. **input 강조**: 같은 `required` 래퍼 안의 `form-control`/`form-select`에는 **왼쪽 3px primary색 강조선**(inset box-shadow)이 적용된다.

- **마크업 예시** (floating label):
  ```jsx
  <div className="form-floating mb-2 required">
    <input className="form-control" id="productNm" name="productNm" required ... />
    <label htmlFor="productNm">
      {t('products.col.productNm')}<span className="text-primary ms-1" aria-hidden="true">*</span>
    </label>
  </div>
  ```
- 별표는 `aria-hidden="true"`. 스크린리더는 input의 `required`로 안내.
- 새로 만드는 등록/수정 폼에서도 필수 필드에는 동일하게 적용한다.

---

## 8. 테이블 공통 (layout.css)

- **셀 패딩**: `.table > :not(caption) > * > *` → `padding: 0.5rem 0.5rem` (theme 기본 1rem 0.5rem 오버라이드).
- **thead th** (`.card-body .table thead th`): `font-size: 0.875rem`, `font-weight: 600`, `text-align: center` — 본문·폼과 크기 통일, 가운데 정렬.
- 테이블 추가 시 위 공통 스타일이 적용되므로 별도 클래스 불필요.
