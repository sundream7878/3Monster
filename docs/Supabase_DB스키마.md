# 🗄 Supabase 전역 DB 스키마 명세서

- **문서 번호**: 3M-DOC-002
- **버전**: v1.1
- **갱신 일시**: 2026-05-26
- **관리 주체**: Monster 총괄 AI (Hub AI)

---

본 문서는 3Monster 프로젝트의 전역 라이선스 및 버전 관리를 위한 클라우드 데이터베이스(Supabase)의 구조를 정의합니다. 모든 개별 앱의 연동 라이브러리는 본 스키마를 최종 권위로 참조합니다.

## 1. 데이터베이스 개요
- **플랫폼**: Supabase Cloud DB
- **종류**: PostgreSQL
- **용도**: 라이선스 인증, 기기 바인딩(HWID), 앱 최신 버전 갱신 관리

## 2. 테이블 상세 명세

### [테이블명: licenses]
- **목적**: 전역 라이선스 정보, PC 기기 바인딩(HWID) 상태, 만료 상태 및 사용자 속성 관리.
- **테이블 구조**:

| 컬럼명 | 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **serial_key** | TEXT | PRIMARY KEY | 라이선스 고유 시리얼 키 (예: `CM-XXXX-XXXX-XXXX` 또는 `TEST-XXXX-XXXX`) |
| **bound_value** | TEXT | NULLABLE | 최초 등록 또는 바인딩된 PC의 HWID |
| **status** | TEXT | DEFAULT 'unused' | 키 상태 (`active`, `used`, `unused`, `blocked`, `expired`) |
| **expire_date** | TIMESTAMPTZ | - | 라이선스 만료 일시 (ISO 8601) |
| **collection_limit**| INTEGER | NULLABLE | 1회/기간 내 최대 수집 제한 건수 (체험판/테스트 키용) |
| **product_id** | TEXT | - | 적용 대상 제품 식별자 (예: `NPlace-DB`, `CafeCrawler`) |
| **buyer_name** | TEXT | NULLABLE | 구매자 성함 또는 상호명 |
| **contact** | TEXT | NULLABLE | 구매자 연락처 |
| **price_sold** | NUMERIC | DEFAULT 0 | 실제 판매 가격 |
| **memo** | TEXT | NULLABLE | 특이사항 기록용 메모 |
| **created_at** | TIMESTAMPTZ | DEFAULT now() | 발행 일시 |

---

### [테이블명: app_versions]
- **목적**: 3Monster 계열 앱들의 버전 정보 및 바이너리 다운로드 경로 관리 (자동 업데이트용).
- **테이블 구조**:

| 컬럼명 | 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | BIGINT | PRIMARY KEY (Identity)| 버전 등록 고유 번호 |
| **product_id** | TEXT | - | 해당 제품 식별자 (예: `NPlace-DB`, `CafeCrawler`) |
| **version** | TEXT | - | 버전 명칭 (예: `1.0.0`, `1.0.1`) |
| **download_url** | TEXT | - | 바이너리 파일 다운로드 경로 (Supabase Storage 또는 CDN 주소) |
| **release_notes** | TEXT | NULLABLE | 이번 업데이트의 패치 노트 내용 |
| **created_at** | TIMESTAMPTZ | DEFAULT now() | 버전 배포 일시 |

---

### [테이블명: support_tickets]
- **목적**: 고객센터 문의 사항 접수, 쇼룸 제품별 Q&A 저장 및 답변 관리.
- **테이블 구조**:

| 컬럼명 | 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | BIGINT | PRIMARY KEY (Identity) | 문의 티켓 고유 ID |
| **uid** | UUID | NULLABLE (Foreign Key) | 작성자의 Supabase Auth UID (비로그인 시 NULL) |
| **email** | TEXT | - | 답변을 받을 작성자 이메일 주소 |
| **issue_type** | TEXT | - | 문의 유형 (`bug`, `suggestion`, `qna_{product_id}` 등) |
| **description** | TEXT | - | 문의 내용 본문 |
| **image_url** | TEXT | NULLABLE | 첨부 이미지 URL (Supabase Storage 경로) |
| **log_url** | TEXT | NULLABLE | 첨부 로그 파일 URL (Supabase Storage 경로) |
| **status** | TEXT | DEFAULT 'open' | 티켓 진행 상태 (`open`, `in_progress`, `resolved`, `closed`) |
| **reply** | TEXT | NULLABLE | 문의에 대한 대화 기록 및 댓글 목록 (JSON 포맷의 ThreadMessage[] 문자열) |
| **replied_at** | TIMESTAMPTZ | NULLABLE | 답변 등록 일시 |
| **created_at** | TIMESTAMPTZ | DEFAULT now() | 문의 등록 일시 |

> **reply JSON 구조 (ThreadMessage[])**:
> ```json
> [
>   {
>     "id": "string (메시지 고유 ID)",
>     "sender": "user | admin",
>     "sender_email": "string",
>     "text": "string (메시지 내용)",
>     "image_url": "string | null (첨부 이미지 URL)",
>     "log_url": "string | null (첨부 로그 URL)",
>     "created_at": "string (ISO 8601 일시)"
>   }
> ]
> ```

---

### [테이블명: users]
- **목적**: 대시보드 및 서비스 통합 사용자 계정 정보, 권한(role) 및 기기/바이어 매칭 정보 관리.
- **테이블 구조**:

| 컬럼명 | 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **email** | TEXT | PRIMARY KEY | 사용자 이메일 주소 (소문자 저장) |
| **uid** | UUID | UNIQUE, NULLABLE | Supabase Auth UID 기기 매칭용 고유 ID |
| **role** | TEXT | DEFAULT 'user' | 사용자 역할 권한 (`admin`, `buyer`, `user`) |
| **name** | TEXT | NULLABLE | 구매자 이름 또는 크몽 닉네임 |
| **channel** | TEXT | NULLABLE | 최초 연동/가입 채널 (예: `Kmong`, `Direct`, `Kmong (Pending)`) |
| **created_at** | TIMESTAMPTZ | DEFAULT now() | 가입/등록 일시 |

### [테이블명: notifications]
- **목적**: 마이페이지 '알림' 토글이 활성화된 사용자들을 대상으로 하는 전체 공지 및 개별 권한별 알림 메시지 관리.
- **테이블 구조**:

| 컬럼명 | 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | BIGINT | PRIMARY KEY, IDENTITY | 알림 고유 번호 |
| **title** | TEXT | NOT NULL | 알림 제목 |
| **content** | TEXT | NOT NULL | 알림 본문 내용 |
| **target_role** | TEXT | DEFAULT 'all' | 타겟 권한 그룹 (`all`, `admin`, `buyer`, `user`) |
| **created_at** | TIMESTAMPTZ | DEFAULT now() | 알림 작성/발송 일시 |
| **sent_by** | TEXT | NOT NULL | 발송한 관리자 이메일 |

---

### [비고: 미사용 테이블 정리]
- **inquiries**: 레거시/구버전 문의 테이블로 현재 프로젝트에서 사용되지 않으며, `support_tickets`로 통합되어 삭제/정리 대상입니다.
- **admins**: `users` 테이블 통합 후 삭제 완료되었습니다.
- **buyers**: `users` 테이블 통합 후 삭제 완료되었습니다.

---
*Since 2026-05-28 by Monster*

