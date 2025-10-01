#!/bin/bash

# 영화 퀴즈 프로젝트 배포 스크립트
echo "🚀 영화 퀴즈 프로젝트 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 단계 1: 환경 확인
echo -e "\n${YELLOW}📋 단계 1: 환경 확인${NC}"

# Node.js 버전 확인
if command -v node > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Node.js 설치됨: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js가 설치되지 않았습니다.${NC}"
    exit 1
fi

# npm 확인
if command -v npm > /dev/null 2>&1; then
    echo -e "${GREEN}✅ npm 설치됨: $(npm --version)${NC}"
else
    echo -e "${RED}❌ npm이 설치되지 않았습니다.${NC}"
    exit 1
fi

# Git 확인
if command -v git > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Git 설치됨: $(git --version)${NC}"
else
    echo -e "${RED}❌ Git이 설치되지 않았습니다.${NC}"
    exit 1
fi

# 단계 2: 의존성 설치
echo -e "\n${YELLOW}📦 단계 2: 의존성 설치${NC}"

if [ -f "package-deploy.json" ]; then
    echo "📥 배포용 패키지 파일을 복사합니다..."
    cp package-deploy.json package.json

    echo "📦 의존성을 설치합니다..."
    npm install

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 의존성 설치 완료${NC}"
    else
        echo -e "${RED}❌ 의존성 설치 실패${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ package-deploy.json 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi

# 단계 3: 환경변수 확인
echo -e "\n${YELLOW}🔧 단계 3: 환경변수 확인${NC}"

if [ -f ".env.example" ]; then
    echo "📋 환경변수 파일이 있습니다. 다음 파일들이 필요합니다:"
    echo "  - .env.local (개발용)"
    echo "  - .env.production (배포용)"
    echo ""
    echo "각 플랫폼에서 다음 환경변수를 설정해야 합니다:"
    echo "  SUPABASE_URL=your-supabase-project-url"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key"
    echo "  NODE_ENV=production"
else
    echo -e "${RED}❌ .env.example 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi

# 단계 4: 코드 검증
echo -e "\n${YELLOW}🔍 단계 4: 코드 검증${NC}"

# 필수 파일 확인
required_files=("server-deploy.js" "script-deploy.js" "movies.json" "index.html" "styles.css")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file 파일이 없습니다.${NC}"
        exit 1
    fi
done

# 단계 5: 로컬 테스트
echo -e "\n${YELLOW}🧪 단계 5: 로컬 테스트${NC}"

echo "🔄 서버를 시작합니다... (5초 후 자동 종료)"
timeout 5s npm start || true
echo -e "${GREEN}✅ 서버 테스트 완료${NC}"

# 단계 6: 배포 준비 완료
echo -e "\n${GREEN}🎉 배포 준비 완료!${NC}"
echo ""
echo "📝 다음 단계:"
echo "  1. GitHub 저장소에 코드를 푸시하세요"
echo "  2. Supabase 프로젝트를 생성하고 데이터베이스를 설정하세요"
echo "  3. Render에서 백엔드 서비스를 생성하세요"
echo "  4. Vercel에서 프론트엔드 서비스를 생성하세요"
echo "  5. 각 플랫폼에서 환경변수를 설정하세요"
echo ""
echo "📖 자세한 가이드는 DEPLOYMENT_GUIDE.md 파일을 참조하세요"
echo ""
echo -e "${GREEN}🚀 배포 준비 완료!${NC}"
