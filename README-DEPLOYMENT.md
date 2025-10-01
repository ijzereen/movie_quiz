# 🚀 무료 배포 가이드

이 프로젝트를 무료로 배포하는 방법에 대한 상세한 가이드입니다.

## 📁 생성된 배포 파일들

다음 파일들이 배포를 위해 준비되어 있습니다:

```
📦 배포 관련 파일들
├── DEPLOYMENT_GUIDE.md      # 상세한 배포 가이드
├── package-deploy.json      # 배포용 package.json
├── server-deploy.js         # 배포용 서버 파일
├── script-deploy.js         # 배포용 클라이언트 스크립트
├── .env.example            # 환경변수 예시
├── deploy.sh               # 배포 준비 스크립트
└── README-DEPLOYMENT.md     # 이 파일
```

## 🎯 배포 플랫폼

| 플랫폼 | 목적 | 무료 티어 | 주요 기능 |
|--------|------|-----------|----------|
| **Vercel** | 프론트엔드 호스팅 | 월 100GB 대역폭 | 정적 파일 호스팅, 자동 배포 |
| **Render** | 백엔드 호스팅 | 월 750시간 컴퓨팅 | Node.js 앱 호스팅, API 서버 |
| **Supabase** | 데이터베이스 | 월 500MB 저장공간 | PostgreSQL, 실시간 기능 |

## 🏆 추가 기능: 리더보드

배포된 앱에는 사용자 순위 시스템이 포함되어 있습니다:
- **실시간 랭킹**: 정확도와 오차 기반 순위
- **상위 10명 표시**: 최소 5문제 플레이한 사용자만 표시
- **개인 통계**: 사용자별 플레이 기록 조회 가능

## 🚀 빠른 시작

### 1단계: 배포 준비 스크립트 실행
```bash
# 배포 준비 스크립트 실행 (환경 확인 및 설정)
./deploy.sh
```

### 2단계: GitHub 저장소 생성
1. GitHub에 새 저장소 생성
2. 프로젝트 코드 푸시
```bash
git init
git add .
git commit -m "Initial commit for deployment"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### 3단계: Supabase 설정
1. [supabase.com](https://supabase.com) 접속
2. 새 프로젝트 생성
3. SQL Editor에서 다음 쿼리 실행:
```sql
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
```

### 4단계: Render 백엔드 배포
1. [render.com](https://render.com) 접속
2. "New +" > "Web Service"
3. GitHub 저장소 연결
4. 설정:
   - Runtime: `Node.js`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. 환경변수 설정:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NODE_ENV=production
   ```

### 5단계: Vercel 프론트엔드 배포
1. [vercel.com](https://vercel.com) 접속
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 설정:
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Build Command: 없음
   - Install Command: 없음

## 🔧 환경변수 설정

### Render (백엔드) 환경변수
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NODE_ENV=production
```

### Vercel (프론트엔드) 환경변수
```
NODE_ENV=production
```

## 🔗 URL 설정

배포 완료 후 다음 URL들이 생성됩니다:

- **프론트엔드**: `https://your-project.vercel.app`
- **백엔드 API**: `https://your-backend-app.onrender.com`
- **데이터베이스**: Supabase 대시보드에서 확인

## 📝 코드 수정사항

### script-deploy.js에서 API URL 수정
```javascript
// 실제 Render 앱 URL로 변경
const API_BASE_URL = isProduction
  ? 'https://your-actual-render-app-name.onrender.com'
  : 'http://localhost:3001';
```

### server-deploy.js에서 CORS 설정
```javascript
// 실제 Vercel 도메인으로 변경
app.use(cors({
  origin: ['https://your-project.vercel.app'],
  credentials: true
}));
```

## 🧪 테스트 방법

### 로컬 테스트
```bash
# 환경변수 파일 생성
cp .env.example .env.local

# .env.local 파일 수정 (실제 Supabase 정보 입력)

# 서버 실행
npm run dev

# 브라우저에서 http://localhost:3001 접속
```

### 배포 테스트
1. Vercel 프론트엔드 URL 접속
2. 퀴즈 플레이 후 결과 저장 시도
3. Supabase 대시보드에서 데이터 확인
4. Render 로그에서 API 호출 확인

## 🔍 문제 해결

### 일반적인 문제들

**1. CORS 에러**
- Render 대시보드에서 환경변수 확인
- 실제 Vercel 도메인이 CORS 설정에 포함되어 있는지 확인

**2. 데이터베이스 연결 실패**
- Supabase 키가 올바른지 확인
- 서비스롤 키를 사용해야 함 (anon 키 아님)

**3. 빌드 실패**
- package.json의 의존성 버전 확인
- Node.js 버전 호환성 확인 (>= 16.0.0)

**4. API 호출 실패**
- Render 앱이 완전히 시작되었는지 확인 (최초 배포 시 1-2분 소요)
- 환경변수 설정 확인

### 로그 확인 방법
```bash
# Render 로그
Render 대시보드 > Logs 탭

# Vercel 로그
Vercel 대시보드 > Functions 탭

# Supabase 로그
Supabase 대시보드 > Logs 탭
```

## 💰 비용 최적화 팁

1. **개발 단계**: 무료 티어로 충분
2. **사용량 모니터링**: 각 플랫폼 대시보드에서 사용량 확인
3. **자동 스케일링**: Render가 자동으로 조절하므로 비용 걱정 적음
4. **데이터베이스 최적화**: 불필요한 데이터 정리

## 📞 지원

배포 과정에서 문제가 발생하면:

1. 각 플랫폼의 문서 참조
2. 생성된 로그 파일 확인
3. 환경변수 설정 재확인
4. `DEPLOYMENT_GUIDE.md` 파일 참조

## 🎉 배포 완료 체크리스트

- [ ] GitHub 저장소 생성 및 코드 푸시
- [ ] Supabase 프로젝트 생성 및 테이블 설정
- [ ] Render 백엔드 서비스 생성 및 환경변수 설정
- [ ] Vercel 프론트엔드 서비스 생성
- [ ] API URL 업데이트 (코드 내 하드코딩된 URL 변경)
- [ ] CORS 설정 확인 및 업데이트
- [ ] 전체 플로우 테스트 (퀴즈 플레이 → 결과 저장 → 데이터베이스 확인)
- [ ] 리더보드 기능 테스트 (메인 화면 → 리더보드 → 사용자 순위 확인)
- [ ] 각 플랫폼 대시보드에서 정상 작동 확인

배포 성공! 🚀 이제 누구나 웹에서 영화 평점 퀴즈를 즐길 수 있습니다!

## 🏆 리더보드 기능 테스트

배포 완료 후 다음 기능을 테스트해보세요:

1. **기본 퀴즈 플레이**: 여러 사용자가 퀴즈를 플레이하고 결과를 저장
2. **리더보드 확인**: 메인 화면에서 "🏆 리더보드" 버튼 클릭
3. **실시간 업데이트**: 새로고침 버튼으로 최신 순위 확인
4. **순위 시스템**: 정확도와 오차를 기반으로 한 올바른 순위 표시 확인

리더보드 기능이 정상 작동하면 사용자들이 서로 경쟁하며 더 재미있게 퀴즈를 즐길 수 있습니다! 🎯
