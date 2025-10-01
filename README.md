# 영화 평점 퀴즈

영화 포스터와 리뷰를 보고 실제 평점을 맞추는 퀴즈 게임입니다. 사용자 정보 입력, 실시간 타이머, 결과 저장 기능이 포함되어 있습니다.

## 기능

- **사용자 정보 입력**: 이름과 생활관 번호 입력
- **실시간 타이머**: 15초 제한 시간
- **평균 오차 계산**: MSE(Mean Squared Error)로 정확도 측정
- **모바일 대응**: 반응형 디자인
- **결과 저장**: SQLite 데이터베이스를 통한 결과 저장
- **백엔드 API**: Express 서버를 통한 데이터 관리

## 프로젝트 구조

```
movie_quiz/
├── index.html          # 메인 HTML 파일
├── styles.css          # 스타일시트
├── script.js           # 클라이언트 사이드 JavaScript
├── server.js           # 백엔드 서버
├── package.json        # Node.js 의존성
├── movies.json         # 영화 데이터
└── README.md           # 프로젝트 설명
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 백엔드 서버 실행
```bash
npm start
# 또는 개발 모드
npm run dev
```

### 3. 프론트엔드 실행
브라우저에서 `index.html` 파일을 열거나,
간단한 HTTP 서버를 실행하세요:
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server
```

## 사용법

1. **사용자 정보 입력**: 이름과 생활관 번호를 입력합니다.
2. **퀴즈 시작**: 시작 버튼을 클릭하여 게임을 시작합니다.
3. **평점 입력**: 영화 포스터와 리뷰를 보고 0.0~5.0 사이의 평점을 입력합니다.
4. **엔터키 사용**: 평점 입력 후 엔터키를 눌러 제출할 수 있습니다.
5. **결과 확인**: 각 문제마다 정답 여부와 현재 점수를 확인할 수 있습니다.
6. **최종 결과**: 모든 문제를 완료하면 최종 점수와 평균 오차(MSE)를 확인할 수 있습니다.
7. **결과 저장**: 최종 결과 화면에서 "결과 저장" 버튼을 클릭하여 데이터베이스에 저장할 수 있습니다.

## API 엔드포인트

### 결과 저장
- **URL**: `POST /api/save-result`
- **Body**:
```json
{
  "userName": "사용자이름",
  "userDorm": "생활관번호",
  "score": 5,
  "totalQuestions": 10,
  "accuracy": 50,
  "mse": 0.25,
  "answers": [...]
}
```

### 전체 결과 조회
- **URL**: `GET /api/results`
- **설명**: 모든 사용자의 퀴즈 결과를 조회합니다.

### 사용자별 결과 조회
- **URL**: `GET /api/results/:name/:dorm`
- **설명**: 특정 사용자의 퀴즈 결과를 조회합니다.

### 통계 조회
- **URL**: `GET /api/statistics`
- **설명**: 전체 사용자들의 평균 통계를 조회합니다.

## 기술 스택

- **프론트엔드**: HTML5, CSS3, JavaScript (ES6+)
- **백엔드**: Node.js, Express.js
- **데이터베이스**: SQLite3
- **기타**: CORS, Body-parser

## 데이터베이스 스키마

```sql
CREATE TABLE quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    user_dorm TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    mse REAL NOT NULL,
    answers TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 모바일 지원

- 반응형 디자인으로 모든 화면 크기 지원
- 터치 친화적인 버튼과 입력 필드
- 모바일 브라우저에서 확대 방지 설정

## 문제 해결

### 서버 연결 오류
- 백엔드 서버가 포트 3001에서 실행 중인지 확인하세요.
- `npm start` 명령어로 서버를 실행하세요.

### 데이터베이스 오류
- 서버 재시작 시 자동으로 테이블이 생성됩니다.
- 데이터베이스 파일(`quiz_results.db`)이 생성되는지 확인하세요.

## 무료 배포 가이드

이 프로젝트를 무료로 배포하는 방법에는 여러 옵션이 있습니다:

### 🚀 추천 배포 플랫폼

#### 1. **Vercel (가장 추천)**
- **장점**: 풀스택 지원, 자동 배포, 무료 도메인
- **지원**: 프론트엔드 + 백엔드 모두 지원
- **한도**: 월 100GB 대역폭 무료

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

#### 2. **Railway**
- **장점**: 간단한 백엔드 배포, 무료 데이터베이스
- **지원**: Node.js 앱 완전 지원
- **한도**: 월 $5 크레딧 무료

#### 3. **Render**
- **장점**: 무료 백엔드 호스팅, 자동 배포
- **지원**: 웹 서비스 + PostgreSQL 무료
- **한도**: 월 750시간 무료

#### 4. **Netlify (프론트엔드만)**
- **장점**: 정적 파일 호스팅, 빠른 배포
- **단점**: 백엔드 서버리스 함수로 변환 필요

### 📋 배포 준비사항

#### Vercel 배포를 위한 설정:
1. **vercel.json 생성**:
```json
{
  "version": 2,
  "builds": [
    { "src": "index.html", "use": "@vercel/static" },
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/server.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

2. **환경변수 설정** (Vercel 대시보드에서):
   - `NODE_ENV=production`

#### Railway 배포를 위한 설정:
1. **Railway CLI 설치**:
```bash
npm i -g @railway/cli
```

2. **Railway 프로젝트 생성**:
```bash
railway login
railway init
railway up
```

### 🔧 프로덕션 설정

#### 데이터베이스 (SQLite → PostgreSQL 권장):
```javascript
// server.js에서 PostgreSQL로 변경 가능
const { Client } = require('pg');
```

#### 환경변수 설정:
```bash
PORT=3001
NODE_ENV=production
DATABASE_URL=your_database_url
```

### 🌟 무료 배포 체크리스트

- [ ] GitHub 저장소 생성
- [ ] Vercel/Railway 계정 생성
- [ ] 프로젝트 코드 업로드
- [ ] 환경변수 설정
- [ ] 데이터베이스 설정 (필요시)
- [ ] 도메인 설정 (선택사항)

### 💡 배포 팁

1. **Vercel 선택 이유**:
   - GitHub와 완벽 연동
   - 자동 배포 (코드 푸시 시)
   - 무료 SSL 인증서
   - 전 세계 CDN

2. **Railway 선택 이유**:
   - 간단한 백엔드 배포
   - 무료 PostgreSQL 제공
   - Docker 없이 배포 가능

3. **주의사항**:
   - 무료 티어는 트래픽 제한 있음
   - 장기 실행 시 유료 플랜 고려
   - 데이터베이스 백업 설정 권장

## 개발자 정보

이 프로젝트는 영화 평점 예측 능력을 테스트하고 사용자별 결과를 저장・분석하기 위해 개발되었습니다.
