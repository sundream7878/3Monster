# 🗄 NplaceDB DB 스키마 명세서

본 문서는 n플레이스 프로그램이 사용하는 로컬 데이터베이스(SQLite)의 구조를 정의합니다.

---

## ⚠️ Monster의 작성 가이드
1. **파일 경로**: 로컬 DB 파일의 표준 위치(`config.py` 기준)를 명시할 것.
2. **테이블 정의**: 각 테이블의 이름, 생성 목적, 그리고 모든 컬럼(Column)의 타입과 제약 조건을 상세히 기술할 것.
3. **인덱스 및 관계**: 성능 최적화를 위한 인덱스나 테이블 간의 관계가 있다면 기술할 것.

---

## 1. 데이터베이스 개요
- **로컬 DB 경로**: `C:\CafeMonster\PlaceDB\data\database.sqlite` (또는 실행 폴더의 `data/database.sqlite`)
- **클라우드 DB**: Supabase (라이선스 관리용)
- **DB 종류**: SQLite 3

## 2. 테이블 상세 명세

### [테이블명: shops] (로컬 SQLite)
- **목적**: 수집된 네이버 플레이스 업체 정보를 로컬에 영구 저장하고 중복 수집을 방지함.
- **컬럼 정보**:
| 컬럼명 | 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | INTEGER | PRIMARY KEY | 자동 증가 고유 번호 |
| name | TEXT | - | 업체명 |
| phone | TEXT | - | 전화번호 |
| detail_url | TEXT | UNIQUE | 플레이스 상세 페이지 URL (중복 체크 키) |
| address | TEXT | - | 도로명/지번 주소 |
| latitude | REAL | - | 위도 (Y좌표) |
| longitude | REAL | - | 경도 (X좌표) |
| email | TEXT | - | 대표 이메일 (블로그/본문 추출) |
| instagram_handle| TEXT | - | 인스타그램 프로필 URL |
| naver_blog_id | TEXT | - | 네이버 블로그 URL |
| talk_url | TEXT | - | 네이버 톡톡 상담 URL |
| owner_name | TEXT | - | 대표자 성함 |
| keyword | TEXT | - | 수집 당시 사용한 검색 키워드 |
| created_at | TIMESTAMP | DEFAULT | 수집 일시 |
| **idx_detail_url** | INDEX | detail_url | 상세조회 속도 향상용 인덱스 |

### [테이블명: licenses] (Supabase Cloud)
- **목적**: 전역 라이선스 인증 및 기기 바인딩 관리.
- **핵심 컬럼**:
| 컬럼명 | 타입 | 설명 |
| :--- | :--- | :--- |
| serial_key | TEXT (PK) | 라이선스 고유 키 (예: PRO-XXXX...) |
| bound_value | TEXT | 바인딩된 PC의 HWID |
| status | TEXT | 키 상태 (active, used, unused) |
| expire_date | TIMESTAMP | 만료 일시 |
| collection_limit| INTEGER | 수집 제한 건수 (테스트키용) |

---
*최종 갱신: 2026-04-23 by Antigravity (Place AI)*
