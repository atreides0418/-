# 회원가입·동의 저장 서버 계약 (출시 전 구현 필요)

현재 프로젝트는 정적 프런트엔드만 포함합니다. `data-signup-endpoint`를 설정하기 전에 아래 서버 계약을 구현해야 합니다.

## 요청

`POST /api/v1/auth/signups` (HTTPS, 인증 불필요)

```json
{
  "email": "user@example.com",
  "nickname": "식당탐험가",
  "password": "원문은 전송 직후 처리하고 로그에 남기지 않음",
  "consents": [
    {
      "type": "service_terms",
      "version": "2026-11-01",
      "agreed": true,
      "agreedAt": "2026-11-25T00:00:00.000Z",
      "source": "guest_signup"
    }
  ]
}
```

성공 시 서버는 같은 출처의 서비스 초기 화면 경로를 반환합니다.

```json
{ "redirectUrl": "/home" }
```

## 서버 필수 검증

- 이메일 형식과 정규화 후 고유성, 닉네임 정책과 고유성을 서버에서 다시 검사한다.
- 비밀번호는 Argon2id 또는 적절히 설정한 bcrypt 등 단방향 비밀번호 해시로만 저장한다. 원문 비밀번호·인증 토큰을 로그, 분석 도구, 오류 응답에 기록하지 않는다.
- 활성화된 필수 약관 종류와 버전을 서버가 조회하고, 각 약관의 동의가 참일 때만 가입을 허용한다. 프런트엔드가 보낸 버전만 신뢰하면 안 된다.
- 사용자 생성과 동의 이력 기록은 하나의 트랜잭션으로 처리한다. 중복 요청에는 idempotency key 또는 이메일 고유 제약을 적용한다.
- 연령 확인·법정대리인 동의 정책이 확정되지 않은 동안에는 만 14세 미만 가입을 확정하지 않는다.

## 예시 데이터 모델

```sql
create table legal_documents (
  type text not null,
  version text not null,
  required boolean not null,
  published_at timestamptz not null,
  content_url text not null,
  primary key (type, version)
);

create table user_consents (
  id uuid primary key,
  user_id uuid not null references users(id),
  document_type text not null,
  document_version text not null,
  agreed boolean not null,
  agreed_at timestamptz not null,
  source text not null,
  created_at timestamptz not null default now(),
  foreign key (document_type, document_version) references legal_documents(type, version)
);
```

선택적 마케팅 동의는 필수 동의와 별도 행으로 저장하고, 계정 설정에서 언제든 철회할 수 있어야 합니다. 기록의 수정·삭제 권한은 서버의 감사 가능한 관리자 절차로 제한합니다.
