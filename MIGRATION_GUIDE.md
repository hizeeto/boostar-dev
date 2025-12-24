# Supabase 마이그레이션 가이드

## 자동 마이그레이션 실행 방법

Supabase는 PostgREST를 사용하므로 DDL 문(CREATE, ALTER 등)을 API를 통해 직접 실행할 수 없습니다. 다음 방법 중 하나를 사용하세요.

### 방법 1: Supabase CLI 사용 (권장)

#### 1. Supabase CLI 설치
```bash
npm install -g supabase
```

#### 2. Supabase 프로젝트 연결
```bash
supabase login
supabase link --project-ref your-project-ref
```

#### 3. 마이그레이션 실행
```bash
# 모든 마이그레이션 실행
supabase db push

# 또는 개별 파일 실행
npm run migrate add_is_archived_to_projects.sql
```

### 방법 2: Supabase Dashboard SQL Editor

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. 마이그레이션 파일 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭

### 방법 3: 마이그레이션 스크립트 사용

#### 마이그레이션 목록 보기
```bash
npm run migrate:list
```

#### 특정 마이그레이션 실행
```bash
npm run migrate add_is_archived_to_projects.sql
```

이 스크립트는:
- 마이그레이션 파일을 읽어서 표시
- Supabase CLI가 설치되어 있는지 확인
- 실행 방법 안내

### 방법 4: API 엔드포인트 사용 (제한적)

**주의**: Supabase는 DDL 문을 API로 직접 실행할 수 없으므로, 이 방법은 SQL을 반환하여 수동 실행을 안내합니다.

```bash
# 마이그레이션 목록 조회
curl http://localhost:3000/api/migrations/list

# 마이그레이션 SQL 가져오기 (실행 안 됨)
curl -X POST http://localhost:3000/api/migrations/execute \
  -H "Content-Type: application/json" \
  -d '{"migrationFile": "add_is_archived_to_projects.sql"}'
```

## 현재 사용 가능한 마이그레이션

- `add_is_archived_to_projects.sql` - 프로젝트 테이블에 is_archived 필드 추가

## 마이그레이션 파일 위치

모든 마이그레이션 파일은 `supabase/migrations/` 디렉토리에 있습니다.

## 문제 해결

### Supabase CLI가 설치되지 않은 경우
```bash
npm install -g supabase
```

### 프로젝트 연결 오류
```bash
# Supabase 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref
```

### 마이그레이션 실행 권한 오류
- Supabase Dashboard에서 프로젝트 소유자인지 확인
- 서비스 키가 올바르게 설정되어 있는지 확인

## 보안 주의사항

- 프로덕션 환경에서는 마이그레이션을 신중하게 실행하세요
- 마이그레이션 실행 전에 백업을 권장합니다
- 서비스 키는 절대 공개 저장소에 커밋하지 마세요

