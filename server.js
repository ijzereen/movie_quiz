const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 서빙 설정 (모든 파일을 서빙)
app.use(express.static('.'));
app.use(express.static(path.join(__dirname)));

// SQLite 데이터베이스 연결
const db = new sqlite3.Database('./quiz_results.db', (err) => {
    if (err) {
        console.error('데이터베이스 연결 실패:', err.message);
    } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        createTable();
    }
});

// 테이블 생성 함수
function createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT NOT NULL,
            user_dorm TEXT NOT NULL,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            total_error REAL NOT NULL,
            answers TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.run(sql, (err) => {
        if (err) {
            console.error('테이블 생성 실패:', err.message);
        } else {
            console.log('테이블이 준비되었습니다.');
        }
    });
}

// 퀴즈 결과 저장 API
app.post('/api/save-result', (req, res) => {
    const { userName, userDorm, score, totalQuestions, totalError, answers } = req.body;

    // 입력 검증
    if (!userName || !userDorm || score === undefined || totalQuestions === undefined || totalError === undefined || !answers) {
        return res.status(400).json({ error: '모든 필드가 필요합니다.' });
    }

    const sql = `INSERT INTO quiz_results (user_name, user_dorm, score, total_questions, total_error, answers) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [userName, userDorm, score, totalQuestions, totalError, JSON.stringify(answers)];

    db.run(sql, values, function(err) {
        if (err) {
            console.error('결과 저장 실패:', err.message);
            res.status(500).json({ error: '결과 저장에 실패했습니다.' });
        } else {
            console.log('퀴즈 결과가 저장되었습니다. ID:', this.lastID);
            res.json({ success: true, id: this.lastID });
        }
    });
});

// 모든 퀴즈 결과 조회 API
app.get('/api/results', (req, res) => {
    const sql = `SELECT * FROM quiz_results ORDER BY created_at DESC`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('결과 조회 실패:', err.message);
            res.status(500).json({ error: '결과 조회에 실패했습니다.' });
        } else {
            const results = rows.map(row => ({
                ...row,
                answers: JSON.parse(row.answers)
            }));
            res.json(results);
        }
    });
});

// 특정 사용자의 결과 조회 API
app.get('/api/results/:name/:dorm', (req, res) => {
    const { name, dorm } = req.params;
    const sql = `SELECT * FROM quiz_results WHERE user_name = ? AND user_dorm = ? ORDER BY created_at DESC`;

    db.all(sql, [name, dorm], (err, rows) => {
        if (err) {
            console.error('사용자 결과 조회 실패:', err.message);
            res.status(500).json({ error: '사용자 결과 조회에 실패했습니다.' });
        } else {
            const results = rows.map(row => ({
                ...row,
                answers: JSON.parse(row.answers)
            }));
            res.json(results);
        }
    });
});

// 통계 API (전체 사용자 평균 등)
app.get('/api/statistics', (req, res) => {
    const sql = `
        SELECT
            COUNT(*) as total_quizzes,
            AVG(score) as avg_score,
            AVG(total_questions) as avg_total_questions,
            AVG(total_error) as avg_total_error
        FROM quiz_results
    `;

    db.get(sql, [], (err, row) => {
        if (err) {
            console.error('통계 조회 실패:', err.message);
            res.status(500).json({ error: '통계 조회에 실패했습니다.' });
        } else {
            res.json(row);
        }
    });
});

// 루트 경로 추가 (프론트엔드 서빙용)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📱 프론트엔드: http://localhost:${PORT}`);
    console.log(`🔗 API 엔드포인트: http://localhost:${PORT}/api/save-result`);
    console.log(`📊 통계 확인: http://localhost:${PORT}/api/statistics`);
    console.log(`💾 데이터베이스 파일: quiz_results.db`);
});

// graceful shutdown
process.on('SIGINT', () => {
    console.log('서버를 종료합니다...');
    db.close((err) => {
        if (err) {
            console.error('데이터베이스 연결 종료 실패:', err.message);
        } else {
            console.log('데이터베이스 연결이 종료되었습니다.');
        }
        process.exit(0);
    });
});
