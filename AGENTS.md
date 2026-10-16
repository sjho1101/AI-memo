# Memo App - AI Agent 지침서

## 프로젝트 개요

메모 CRUD 기능을 제공하는 Next.js 웹 애플리케이션. Supabase(Postgres)에 서버 액션으로 데이터를 영속화하며, 카테고리 분류 및 검색 기능을 지원한다.

## Tech Stack

- **Framework:** Next.js 15.4.4 (App Router)
- **Language:** TypeScript 5.x (strict mode)
- **UI:** React 19.1.0 + Tailwind CSS 4.x
- **State:** Client-side state (useState, useCallback, useMemo)
- **Persistence:** Supabase (Postgres) + `@supabase/supabase-js`, 서버 액션(`src/app/actions/`)으로 접근
- **Testing:** Playwright (E2E)
- **Linting:** ESLint + Prettier

## Operational Commands

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format

# E2E 테스트 실행
npm run test

# 테스트 (헤드 모드)
npm run test:headed

# 테스트 UI 모드
npm run test:ui
```

## 환경변수

`.env.local`에 아래 값이 필요하다 (Supabase 대시보드 → Project Settings → API Keys). 파일은 에이전트가 읽거나 수정하지 않으며 사용자가 직접 관리한다.

| 변수                                   | 설명                                                             |
| -------------------------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 API URL                                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개용(publishable/anon) API 키. 접근 범위는 RLS 정책이 결정한다 |

- `service_role` 키는 RLS를 우회하므로 코드/문서/클라이언트에 노출 금지
- 환경변수는 서버 시작 시 읽으므로 변경 후 dev 서버 재시작 필요

## 데이터베이스 (Supabase)

- 테이블: `public.memos` (컬럼은 snake_case, `Memo` 인터페이스는 camelCase 유지 — 변환은 `src/app/actions/memoActions.ts`의 `toMemo`)
- RLS 활성화. 인증이 없으므로 `anon` 역할에 select/insert/update/delete 전체 허용 정책 적용 (키를 아는 사람은 누구나 접근 가능). 사용자별 분리가 필요하면 Supabase Auth + `user_id` 컬럼 도입 필요
- 스키마 변경은 Supabase MCP `apply_migration`으로 수행

## Golden Rules

### Immutable (절대 위반 금지)

1. `'use client'` 지시문이 필요한 컴포넌트에서 반드시 명시할 것
2. Supabase 접근은 서버 액션(`src/app/actions/`)에서만 수행하고, 클라이언트 컴포넌트/훅에서 직접 DB 클라이언트를 만들지 않을 것. 브라우저 LocalStorage(테마 저장) 접근 시에는 SSR 환경 체크(`typeof window === 'undefined'`) 필수
3. 메모 ID 생성은 uuid v4만 사용
4. TypeScript strict mode 위반 금지

### Do's (권장 사항)

- 컴포넌트는 함수형 컴포넌트로 작성
- 상태 변경 함수는 useCallback으로 메모이제이션
- 파생 상태는 useMemo로 계산
- 파일명은 PascalCase (컴포넌트), camelCase (유틸, 훅)
- 한국어 UI 텍스트 사용
- Tailwind 유틸리티 클래스 우선 사용

### Don'ts (금지 사항)

- Class 컴포넌트 사용 금지
- any 타입 사용 금지 (불가피한 경우 주석으로 사유 명시)
- 인라인 스타일 지양 (Tailwind 사용)
- console.log를 프로덕션 코드에 남기지 않음 (에러 로깅 제외)
- 외부 상태 관리 라이브러리 도입 금지 (현재 규모에서 불필요)

### 민감 파일 접근 금지 (필수)

보안 위험이 있는 파일은 에이전트가 읽거나 수정하지 않는다. `.claude/settings.json`의 `permissions.deny`로도 차단되어 있다.

- 대상: `.env`, `.env.*` (`.env.local` 포함), 파일명에 `secret` 또는 `credential`이 들어간 파일, `*.pem`, `*.key`
- Read/Edit 도구뿐 아니라 Bash(`cat`, `type`, `echo >` 등)로 우회해서 읽거나 수정하지 않는다
- 차단된 경우 우회하지 말고 사용자에게 알린다. 필요한 값은 사용자가 직접 제공한다
- 민감 파일의 내용을 코드, 로그, 문서, 커밋 메시지에 옮겨 적지 않는다

### 화면 변경 작업 검증 (필수)

화면(UI)을 바꾸는 작업이 끝나면 완료로 보고하기 전에 Playwright MCP로 브라우저를 열어 직접 확인하고, 확인한 내용을 보고한다.

- 변경한 기능을 실제로 조작해 동작을 확인한다 (클릭, 키 입력, 모달 열기/닫기 등)
- 보고에는 확인한 항목과 결과를 포함한다. 확인하지 못한 항목은 못 했다고 명시한다
- 타입 검사와 린트 통과만으로 화면 확인을 대신하지 않는다

## 프로젝트 구조

```
src/
├── app/           # Next.js App Router 페이지
│   └── actions/   # 서버 액션 (Supabase 연동)
├── components/    # React 컴포넌트
├── hooks/         # 커스텀 훅
├── types/         # TypeScript 타입 정의
└── utils/         # 유틸리티 함수
```

## Standards & References

### 코딩 컨벤션

- ESLint: `eslint-config-next` 기반
- Prettier: `.prettierrc` 설정 준수
- Import 순서: React -> 외부 라이브러리 -> 내부 모듈 (`@/` alias 사용)

### Git 전략

- 커밋 메시지: 한국어로 작성
- 브랜치: feature/, fix/, refactor/ 접두사 사용

### Maintenance Policy

규칙과 실제 코드 구현 간 괴리가 발생하면, 코드를 기준으로 이 문서의 업데이트를 제안하라.

## Context Map (Action-Based Routing)

- **[페이지 및 레이아웃 (App Router)](./src/app/AGENTS.md)** — 라우팅, 페이지 컴포넌트, 메타데이터 작업 시
- **[UI 컴포넌트 (Components)](./src/components/AGENTS.md)** — 재사용 가능한 UI 컴포넌트 작성/수정 시
- **[상태 관리 (Hooks)](./src/hooks/AGENTS.md)** — 커스텀 훅 및 상태 로직 작업 시
- **[타입 정의 (Types)](./src/types/AGENTS.md)** — 인터페이스 및 타입 정의 시
- **[유틸리티 (Utils)](./src/utils/AGENTS.md)** — 헬퍼 함수, Supabase 클라이언트, 테마 LocalStorage 로직 작업 시
