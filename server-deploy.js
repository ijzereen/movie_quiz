const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// 미들웨어 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-vercel-app.vercel.app', 'https://your-custom-domain.com']
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Supabase 클라이언트 설정
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('필요한 환경변수:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 퀴즈 결과 저장 API
app.post('/api/save-result', async (req, res) => {
  try {
    console.log('📥 결과 저장 요청 받음:', req.body);

    const { userName, userDorm, score, totalQuestions, totalError, answers } = req.body;

    // 입력 검증
    if (!userName || !userDorm || score === undefined || totalQuestions === undefined || totalError === undefined || !answers) {
      return res.status(400).json({
        error: '모든 필드가 필요합니다.',
        received: { userName, userDorm, score, totalQuestions, totalError, answers: !!answers }
      });
    }

    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('quiz_results')
      .insert([
        {
          user_name: userName,
          user_dorm: userDorm,
          score: parseInt(score),
          total_questions: parseInt(totalQuestions),
          total_error: parseFloat(totalError),
          answers: JSON.parse(JSON.stringify(answers)) // JSONB 호환을 위해 직렬화
        }
      ])
      .select();

    if (error) {
      console.error('❌ 데이터베이스 저장 오류:', error);
      throw error;
    }

    console.log('✅ 결과 저장 성공:', data[0].id);

    res.json({
      success: true,
      id: data[0].id,
      message: '결과가 성공적으로 저장되었습니다.'
    });

  } catch (error) {
    console.error('❌ 서버 오류:', error);
    res.status(500).json({
      error: '서버 내부 오류',
      message: error.message
    });
  }
});

// 퀴즈 결과 조회 API (선택사항)
app.get('/api/results', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      results: data
    });

  } catch (error) {
    console.error('❌ 결과 조회 오류:', error);
    res.status(500).json({
      error: '결과 조회 실패',
      message: error.message
    });
  }
});

// 정적 파일 서빙 (프론트엔드 호스팅용)
if (process.env.NODE_ENV === 'development') {
  app.use(express.static('public'));
}

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ error: '엔드포인트를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error('❌ 예상치 못한 오류:', error);
  res.status(500).json({
    error: '예상치 못한 서버 오류',
    message: error.message
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Supabase 연결 상태: ${supabaseUrl ? '연결됨' : '연결안됨'}`);
});

module.exports = app;
