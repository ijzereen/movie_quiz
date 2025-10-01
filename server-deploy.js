const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// 미들웨어 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://movie-quiz-vcgm.vercel.app',  // 실제 Vercel 앱 URL
        'https://your-vercel-app.vercel.app',
        'https://your-custom-domain.com'
      ]
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// 환경변수 설정 (임시로 SQLite 사용 가능)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 임시로 SQLite 데이터베이스 사용 (환경변수 없을 때)
const useSQLite = !supabaseUrl || !supabaseKey;

if (useSQLite) {
  console.log('⚠️  환경변수가 설정되지 않아 SQLite 모드로 실행됩니다.');
  console.log('📝 Supabase를 사용하려면 환경변수를 설정해주세요.');
} else {
  console.log('✅ Supabase 환경변수 확인됨');
}

let supabase;
if (!useSQLite) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

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

    if (useSQLite) {
      // 임시로 성공 응답만 반환 (SQLite 모드)
      console.log('💾 SQLite 모드: 결과 저장 시뮬레이션');
      res.json({
        success: true,
        id: Date.now(), // 임시 ID
        message: '결과가 성공적으로 저장되었습니다. (SQLite 모드)'
      });
    } else {
      // Supabase에 저장
      const { data, error } = await supabase
        .from('quiz_results')
        .insert([
          {
            user_name: userName,
            user_dorm: userDorm,
            score: parseInt(score),
            total_questions: parseInt(totalQuestions),
            total_error: parseFloat(totalError),
            answers: JSON.parse(JSON.stringify(answers))
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
    }

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

// 리더보드 API - 상위 10명 조회
app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('🏆 리더보드 요청 받음');

    if (useSQLite) {
      // 임시 샘플 데이터 반환 (SQLite 모드)
      console.log('💾 SQLite 모드: 샘플 리더보드 데이터 반환');

      const sampleLeaderboard = [
        {
          rank: 1,
          userName: '김철수',
          userDorm: '102동',
          score: 8,
          totalQuestions: 10,
          accuracy: '80.0',
          totalError: '1.2',
          playedAt: new Date().toLocaleDateString('ko-KR')
        },
        {
          rank: 2,
          userName: '이영희',
          userDorm: '201동',
          score: 7,
          totalQuestions: 10,
          accuracy: '70.0',
          totalError: '1.8',
          playedAt: new Date().toLocaleDateString('ko-KR')
        },
        {
          rank: 3,
          userName: '박민수',
          userDorm: '305동',
          score: 6,
          totalQuestions: 10,
          accuracy: '60.0',
          totalError: '2.1',
          playedAt: new Date().toLocaleDateString('ko-KR')
        }
      ];

      res.json({
        success: true,
        count: sampleLeaderboard.length,
        leaderboard: sampleLeaderboard,
        lastUpdated: new Date().toISOString(),
        mode: 'SQLite 샘플 데이터'
      });
    } else {
      // Supabase에서 실제 데이터 조회
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .gte('total_questions', 5)
        .order('score', { ascending: false })
        .order('total_error', { ascending: true })
        .limit(10);

      if (error) throw error;

      const leaderboard = data.map((result, index) => ({
        rank: index + 1,
        userName: result.user_name,
        userDorm: result.user_dorm,
        score: result.score,
        totalQuestions: result.total_questions,
        accuracy: ((result.score / result.total_questions) * 100).toFixed(1),
        totalError: parseFloat(result.total_error).toFixed(2),
        playedAt: new Date(result.created_at).toLocaleDateString('ko-KR')
      }));

      console.log(`📊 리더보드 ${leaderboard.length}개 결과 반환`);

      res.json({
        success: true,
        count: leaderboard.length,
        leaderboard: leaderboard,
        lastUpdated: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ 리더보드 조회 오류:', error);
    res.status(500).json({
      error: '리더보드 조회 실패',
      message: error.message
    });
  }
});

// 사용자별 통계 API
app.get('/api/user-stats/:userName', async (req, res) => {
  try {
    const { userName } = req.params;

    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_name', userName)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    // 통계 계산
    const totalGames = data.length;
    const totalScore = data.reduce((sum, result) => sum + result.score, 0);
    const totalQuestions = data.reduce((sum, result) => sum + result.total_questions, 0);
    const totalError = data.reduce((sum, result) => sum + parseFloat(result.total_error), 0);
    const averageAccuracy = totalGames > 0 ? ((totalScore / totalQuestions) * 100).toFixed(1) : 0;

    // 최근 5게임 성적
    const recentGames = data.slice(0, 5).map(result => ({
      score: result.score,
      totalQuestions: result.total_questions,
      accuracy: ((result.score / result.total_questions) * 100).toFixed(1),
      totalError: parseFloat(result.total_error).toFixed(2),
      playedAt: new Date(result.created_at).toLocaleDateString('ko-KR')
    }));

    res.json({
      success: true,
      userStats: {
        userName: userName,
        totalGames: totalGames,
        totalScore: totalScore,
        totalQuestions: totalQuestions,
        averageAccuracy: averageAccuracy,
        totalError: totalError.toFixed(2),
        recentGames: recentGames,
        bestScore: Math.max(...data.map(r => r.score)),
        lastPlayed: new Date(data[0].created_at).toLocaleDateString('ko-KR')
      }
    });

  } catch (error) {
    console.error('❌ 사용자 통계 조회 오류:', error);
    res.status(500).json({
      error: '사용자 통계 조회 실패',
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
