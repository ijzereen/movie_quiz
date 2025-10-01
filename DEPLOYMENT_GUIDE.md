# 무료 배포 가이드 (Vercel + Render + Supabase)

이 가이드는 영화 평점 퀴즈 프로젝트를 무료로 배포하는 방법을 단계별로 설명합니다.

## 🏗️ 전체 아키텍처

```
프론트엔드: Vercel (무료 호스팅)
백엔드: Render (무료 호스팅)
데이터베이스: Supabase (PostgreSQL, 무료 티어)

✨ 추가 기능: 리더보드 시스템 (사용자 순위 및 통계)
```

## 📋 사전 준비사항

### 1. 계정 생성
- [Vercel](https://vercel.com) 계정 (GitHub과 연동 추천)
- [Render](https://render.com) 계정
- [Supabase](https://supabase.com) 계정
- GitHub 저장소 (코드 관리용)

### 2. 프로젝트 구조 파악
현재 프로젝트 구조:
```
movie_quiz/
├── index.html          # 메인 페이지
├── styles.css          # 스타일시트
├── script.js           # 클라이언트 사이드 JavaScript
├── server.js           # Node.js 백엔드 서버
├── movies.json         # 영화 데이터
├── quiz_results.db     # SQLite 데이터베이스 (변경 예정)
└── package.json        # Node.js 의존성
```

## 🚀 단계별 배포 가이드

### 단계 1: 데이터베이스 이전 (SQLite → PostgreSQL)

#### 1.1 Supabase 프로젝트 생성
1. Supabase 대시보드 접속
2. "New Project" 클릭
3. 프로젝트 이름 설정 (예: movie-quiz-db)
4. 데이터베이스 비밀번호 설정 (기억!)
5. 지역 선택 (아시아 지역 추천)
6. "Create new project" 클릭

#### 1.2 데이터베이스 테이블 생성
Supabase 대시보드에서 SQL Editor 접속 후 실행:

```sql
-- 퀴즈 결과 테이블 생성
CREATE TABLE quiz_results (
    id SERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_dorm TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    total_error DECIMAL NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_quiz_results_created_at ON quiz_results(created_at);
CREATE INDEX idx_quiz_results_user ON quiz_results(user_name);
```

#### 1.3 환경변수 설정
Supabase 대시보드에서 Settings > API에서 다음 정보 확인:
- Project URL
- anon/public 키
- 서비스롤 키 (백엔드용)

### 단계 2: 백엔드 코드 수정

#### 2.1 package.json 업데이트
```json
{
  "name": "movie-quiz-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.0.0"
  }
}
```

#### 2.2 server.js 수정
```javascript
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Supabase 클라이언트 설정
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// API 엔드포인트
app.post('/api/save-result', async (req, res) => {
  try {
    const { userName, userDorm, score, totalQuestions, totalError, answers } = req.body;

    const { data, error } = await supabase
      .from('quiz_results')
      .insert([
        {
          user_name: userName,
          user_dorm: userDorm,
          score: score,
          total_questions: totalQuestions,
          total_error: totalError,
          answers: answers
        }
      ])
      .select();

    if (error) throw error;

    res.json({ success: true, id: data[0].id });
  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 단계 3: 프론트엔드 코드 수정

#### 3.1 script.js에서 API URL 수정
```javascript
// 현재 하드코딩된 localhost URL을 환경변수로 변경
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-render-app-name.onrender.com'
  : 'http://localhost:3001';

// 사용 예시
const response = await fetch(`${API_BASE_URL}/api/save-result`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(resultData)
});
```

### 단계 4: Render에 백엔드 배포

#### 4.1 Render 대시보드 설정
1. Render 대시보드 접속
2. "New +" 클릭 > "Web Service"
3. GitHub 저장소 연결
4. 빌드 설정:
   - Runtime: Node.js
   - Build Command: `npm install`
   - Start Command: `npm start`

#### 4.2 환경변수 설정 (Render 대시보드)
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NODE_ENV=production
```

### 단계 5: Vercel에 프론트엔드 배포

#### 5.1 Vercel 설정
1. Vercel 대시보드 접속
2. "New Project" 클릭
3. GitHub 저장소 연결 (프론트엔드 코드만)
4. 빌드 설정:
   - Framework Preset: Other
   - Build Command: 없음 (정적 파일)
   - Output Directory: ./
   - Install Command: 없음

#### 5.2 환경변수 설정 (Vercel 대시보드)
```
NODE_ENV=production
```

### 단계 6: 도메인 설정 및 테스트

#### 6.1 커스텀 도메인 설정 (선택사항)
- Vercel: 무료 도메인 자동 제공 (your-project.vercel.app)
- Render: 무료 도메인 자동 제공 (your-app.onrender.com)

#### 6.2 API URL 업데이트
프론트엔드에서 Render 백엔드 URL 사용:
```javascript
const API_BASE_URL = 'https://your-render-app-name.onrender.com';
```

#### 6.3 CORS 설정 확인
백엔드 server.js에 다음 추가:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-vercel-app.vercel.app'],
  credentials: true
}));
```

## 🔧 배포 후 설정

### 자동 배포 설정
- GitHub에 push하면 자동으로 재배포되도록 설정
- 브랜치 전략: main 브랜치에 push 시 자동 배포

### 모니터링 설정
- Render: 대시보드에서 로그 확인 가능
- Supabase: 대시보드에서 데이터베이스 모니터링
- Vercel: 배포 상태 및 로그 확인

## 💰 비용 구조

### 무료 티어 한도
- **Vercel**: 월 100GB 대역폭
- **Render**: 월 750시간 컴퓨팅 시간
- **Supabase**: 월 500MB 데이터베이스, 50만 엣지 함수 호출

### 비용 발생 시점
- 트래픽이 많은 경우 Render에서 비용 발생 가능
- 데이터베이스 크기가 500MB 초과시 Supabase 비용 발생

## 🔍 문제 해결

### 일반적인 문제들
1. **CORS 에러**: Render 대시보드에서 환경변수 확인
2. **데이터베이스 연결 실패**: Supabase 키 확인
3. **빌드 실패**: package.json 의존성 확인

### 디버깅 팁
```bash
# Render 로그 확인
- Render 대시보드 > Logs 탭

# Supabase 로그 확인
- Supabase 대시보드 > Logs

# Vercel 로그 확인
- Vercel 대시보드 > Functions 탭
```

## 🏆 리더보드 기능

배포된 애플리케이션에는 사용자들의 성적을 비교할 수 있는 리더보드 기능이 포함되어 있습니다.

### 리더보드 특징
- **실시간 순위**: 사용자들의 정확도와 오차를 기반으로 한 실시간 랭킹
- **상위 10명 표시**: 최소 5문제 이상 플레이한 사용자만 리더보드에 표시
- **정확도 우선**: 맞은 문제 수 우선, 동점 시 오차가 적은 사용자 우선
- **개인 통계**: 사용자별 상세한 플레이 기록 및 통계 조회 가능

### 리더보드 API 엔드포인트
- `GET /api/leaderboard` - 상위 10명 리더보드 조회
- `GET /api/user-stats/:userName` - 특정 사용자 통계 조회

### 리더보드 사용법
1. 메인 화면에서 "🏆 리더보드" 버튼 클릭
2. 실시간으로 업데이트되는 순위 확인
3. "🔄 새로고침" 버튼으로 최신 데이터 로드
4. 다른 사용자들의 플레이 기록과 비교

## 📝 체크리스트

- [ ] Supabase 프로젝트 생성 및 테이블 설정
- [ ] 백엔드 코드 수정 (PostgreSQL 연결)
- [ ] package.json 업데이트
- [ ] Render에 백엔드 배포
- [ ] Vercel에 프론트엔드 배포
- [ ] 환경변수 설정 확인
- [ ] API 엔드포인트 테스트
- [ ] 리더보드 기능 테스트
- [ ] 전체 플로우 테스트 (퀴즈 → 결과 저장 → 리더보드 확인)

이 가이드를 따라하면 무료로 완전한 풀스택 애플리케이션을 배포할 수 있습니다! 🚀
