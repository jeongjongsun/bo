# Shopeasy4 (Spring Boot + React)

가이드 문서(`docs/`)에 정의된 표준에 맞춘 개발 환경입니다.

## 구조

```
om/
├── docs/           # 표준 문서 (01~09 참고 순서)
├── backend/        # Spring Boot API (Java 17)
├── frontend/       # React + Vite + TypeScript
└── README.md
```

- **백엔드**: `/api/v1` 하위 REST API, 공통 응답 포맷(ApiResponse, PagedData), 표준 에러 코드.
- **프론트**: `api/`, `features/`, `hooks/`, `types/` 등 docs/02-개발-표준 폴더 구조, React Query, credentials 포함 요청.

## 요구 사항

- **Java 17** (백엔드)
- **Node.js 18+** (프론트)
- **Maven** (백엔드 빌드)
- 개발 시 **DB**: 기본은 H2(메모리). PostgreSQL 사용 시 아래 설정 참고.

## 실행 방법

### 1. 백엔드

```bash
cd backend
mvn spring-boot:run
```

(Maven Wrapper가 있으면 `./mvnw spring-boot:run` 사용)

- 기본 포트: **18081**
- 프로파일: **dev** (H2 메모리 DB, 상세 로그)
- 로그인 정책: `user_info.grade_cd` 가 **ADMIN** 또는 **MANAGER** 이고 `user_status=ACTIVE`, `is_deleted=false` 인 계정만 허용. 비밀번호 실패 상한은 DB **`om_config_m.max_password_fail_count`** (DDL: `docs/ddl/om_config_m.sql`, 미적용 시 기본 5회). Neon 등 PostgreSQL에 DDL·시드 반영 후 사용.
- API 예시:
  - `GET http://localhost:18081/api/v1/health`
  - `GET http://localhost:18081/api/v1/auth/me`

### 2. 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

- 주소: **http://localhost:8081** (vite.config.ts `port: 8081`, `strictPort: true`)
- `/api` 요청은 Vite 프록시로 **http://localhost:18081** 으로 전달됩니다 (동일 도메인처럼 사용).

**8081 포트 사용 프로세스 종료 후 프론트 재시작 (한 번에)**

```bash
cd frontend && (lsof -ti:8081 | xargs kill -9 2>/dev/null; true) && npm run dev
```

- `lsof -ti:8081`: 8081 포트를 쓰는 PID 목록
- `xargs kill -9`: 해당 프로세스 강제 종료
- `2>/dev/null; true`: 해당 포트를 쓰는 프로세스가 없으면 에러를 무시하고 다음 명령 실행
- 그 다음 `npm run dev`로 8081에서만 서버 기동 (`strictPort: true` 이므로 8081이 점유 중이면 다른 포트로 넘어가지 않고 실패함)

### 3. 동시 실행

터미널 2개에서 위 순서대로 백엔드 → 프론트 실행 후, 브라우저에서 http://localhost:8081 접속.

## PostgreSQL 사용 시

1. PostgreSQL에 DB 생성: `createdb shopeasy`
2. `backend/src/main/resources/application.yml` 에서 `spring.datasource` URL/계정을 PostgreSQL에 맞게 수정.
3. 개발 시에도 PostgreSQL을 쓰려면 `application-dev.yml` 의 datasource를 주석 처리하고, `spring.profiles.active: dev` 유지 시 `application.yml` 값이 적용되도록 하거나, `application-local.yml` (git 제외)을 만들어 오버라이드.

## 표준 문서

- **참고 순서**: [docs/01-표준-인덱스.md](docs/01-표준-인덱스.md) 상단의 "참고 순서" 표 (01 → 09).
- **개발**: [docs/02-개발-표준.md](docs/02-개발-표준.md), [docs/03-부록-타입.md](docs/03-부록-타입.md).
- **코딩·로깅·보안·테스트·DB·다국어**: docs 내 04~09 번호 순.

새 기능·화면 추가 시 docs/02-개발-표준의 "새 화면/기능 추가 시 체크리스트"와 해당 영역 표준을 따르면 됩니다.
