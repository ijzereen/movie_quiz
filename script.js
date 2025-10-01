// 게임 상태 변수들
let movies = [];
let currentMovieIndex = 0;
let score = 0;
let totalQuestions = 0;
let timer = null;
let timeLeft = 15;
let userAnswers = []; // 사용자의 모든 답변을 저장할 배열
let userName = '';
let userDorm = '';

// DOM 요소들
const userInfoScreen = document.getElementById('user-info-screen');
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const finalResultScreen = document.getElementById('final-result-screen');
const startBtn = document.getElementById('start-btn');
const userInfoStartBtn = document.getElementById('user-info-start-btn');
const submitRatingBtn = document.getElementById('submit-rating');
const nextBtn = document.getElementById('next-btn');

const ratingInput = document.getElementById('rating-input');
const userNameInput = document.getElementById('user-name');
const userDormInput = document.getElementById('user-dorm');
const finalSaveResultBtn = document.getElementById('final-save-result-btn');

// 초기화 함수 - 페이지 로드 시 버튼 상태 설정
function initializeButtons() {
    nextBtn.classList.add('hidden');
    console.log('초기 버튼 상태 설정 완료');
}

// 페이지 로드 시 초기화 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('페이지 로드 완료, 버튼 초기화 실행');
    initializeButtons();
});

// 이벤트 리스너들
startBtn.addEventListener('click', handleStartButton);
userInfoStartBtn.addEventListener('click', handleStartButton);
submitRatingBtn.addEventListener('click', submitRating);
nextBtn.addEventListener('click', nextQuestion);

finalSaveResultBtn.addEventListener('click', saveQuizResult);

// 게임 시작 함수
async function startGame() {
    // JSON 파일에서 영화 데이터 로드
    try {
        const response = await fetch('movies.json');
        const data = await response.json();
        movies = data.movies;
    } catch (error) {
        console.error('영화 데이터를 불러오는데 실패했습니다:', error);
        alert('영화 데이터를 불러오는데 실패했습니다.');
        return;
    }

    startScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    currentMovieIndex = 0;
    score = 0;
    totalQuestions = 0;
    userAnswers = []; // 사용자 답변 초기화
    showMovie();
}

// 영화 표시 함수
function showMovie() {
    const movie = movies[currentMovieIndex];
    document.getElementById('movie-title').textContent = movie.title;
    document.getElementById('movie-poster').src = movie.poster;

    // 리뷰 표시
    const reviewsContainer = document.getElementById('reviews-container');
    reviewsContainer.innerHTML = '';
    movie.reviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'review-item';
        reviewElement.innerHTML = `
            <div class="review-author">${review.author}</div>
            <div class="review-text">"${review.text}"</div>
        `;
        reviewsContainer.appendChild(reviewElement);
    });

    // 입력 필드 초기화
    ratingInput.value = '';
    ratingInput.focus();

    // 타이머 시작
    startTimer();
}

// 타이머 시작 함수
function startTimer() {
    timeLeft = 15;
    updateTimerDisplay();

    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timer);
            showResult(false, 0); // 시간 초과로 오답 처리
        }
    }, 1000);
}

// 타이머 표시 업데이트 함수
function updateTimerDisplay() {
    const timerProgress = document.querySelector('.timer-progress');
    const timerText = document.querySelector('.timer-text');

    const percentage = (timeLeft / 15) * 100;
    timerProgress.style.width = `${percentage}%`;
    timerText.textContent = `${timeLeft}초`;

    // 타이머가 거의 끝나갈 때 빨간색으로 변경
    if (timeLeft <= 3) {
        timerProgress.style.background = 'linear-gradient(90deg, #dc3545, #fd7e14)';
    } else {
        timerProgress.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
    }
}

// 평점 제출 함수
function submitRating() {
    const userRating = parseFloat(ratingInput.value);

    if (isNaN(userRating) || userRating < 0 || userRating > 5) {
        alert('0.0부터 5.0 사이의 숫자를 입력해주세요.');
        return;
    }

    clearInterval(timer);
    const movie = movies[currentMovieIndex];

    // 사용자 답변 저장 (MSE 계산용)
    userAnswers.push({
        userRating: userRating,
        actualRating: movie.rating,
        movieTitle: movie.title
    });

    const isCorrect = Math.abs(userRating - movie.rating) <= 0.2; // 0.2점 차이까지 정답으로 인정

    if (isCorrect) {
        score++;
    }

    totalQuestions++;
    showResult(isCorrect, userRating);
}

// 결과 표시 함수
function showResult(isCorrect, userRating) {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    const movie = movies[currentMovieIndex];
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const currentScore = document.getElementById('current-score');
    const mseElement = document.getElementById('mse');

    if (isCorrect) {
        resultTitle.textContent = '🎉 정답입니다!';
        resultMessage.textContent = `입력한 평점: ${userRating}점 | 실제 평점: ${movie.rating}점`;
    } else {
        resultTitle.textContent = '❌ 아쉬워요!';
        resultMessage.textContent = `입력한 평점: ${userRating}점 | 실제 평점: ${movie.rating}점`;
    }

    currentScore.textContent = `${score}/${totalQuestions}`;

    // 실시간 누적 절댓값 오차 계산 및 표시
    const currentError = calculateTotalAbsoluteError();
    const errorRounded = Math.round(currentError * 100) / 100;
    mseElement.textContent = `${errorRounded}`;

    // 중간 결과에서는 다음 문제 버튼만 표시
    nextBtn.classList.remove('hidden');

    // 디버깅을 위한 로그 추가
    console.log(`현재 문제 인덱스: ${currentMovieIndex}, 전체 영화 수: ${movies.length}`);
    console.log(`다음 버튼 표시 상태: ${!nextBtn.classList.contains('hidden')}`);
}

// 다음 문제 함수
function nextQuestion() {
    currentMovieIndex++;

    if (currentMovieIndex >= movies.length) {
        // 모든 문제를 풀었을 때
        showFinalResult();
    } else {
        resultScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        showMovie();
    }
}

// 최종 결과 표시 함수
function showFinalResult() {
    // 기존 결과 화면 숨기기
    resultScreen.classList.add('hidden');

    // 최종 결과 화면 표시
    finalResultScreen.classList.remove('hidden');

    const finalResultTitle = document.getElementById('final-result-title');
    const finalResultMessage = document.getElementById('final-result-message');
    const finalCurrentScore = document.getElementById('final-current-score');
    const finalMseElement = document.getElementById('final-mse');

    const totalError = calculateTotalAbsoluteError();
    const errorRounded = Math.round(totalError * 100) / 100; // 소수점 둘째자리까지 표시

    finalResultTitle.textContent = '🎬 퀴즈 완료!';
    finalResultMessage.textContent = `총 ${totalQuestions}문제 중 ${score}문제를 맞췄어요!`;
    finalCurrentScore.textContent = `${score}/${totalQuestions}`;
    finalMseElement.textContent = `${errorRounded}`;

    console.log('최종 결과 화면 표시 완료');
}

// 누적 절댓값 오차 계산 함수
function calculateTotalAbsoluteError() {
    if (userAnswers.length === 0) return 0;

    let totalAbsoluteError = 0;
    userAnswers.forEach(answer => {
        const error = Math.abs(answer.userRating - answer.actualRating);
        totalAbsoluteError += error;
    });

    return totalAbsoluteError;
}

// 시작 버튼 클릭 처리 함수
function handleStartButton() {
    console.log('시작 버튼 클릭됨');

    // 현재 사용자 정보 입력 화면이 보이는지 확인
    if (!userInfoScreen.classList.contains('hidden')) {
        console.log('사용자 정보 입력 화면에서 클릭');
        // 사용자 정보 입력 화면에서 시작 버튼 클릭
        const name = userNameInput.value.trim();
        const dorm = userDormInput.value.trim();

        console.log('입력값:', { name, dorm });

        if (!name || !dorm) {
            alert('이름과 생활관 번호를 모두 입력해주세요.');
            return;
        }

        userName = name;
        userDorm = dorm;
        console.log('사용자 정보 저장:', { userName, userDorm });

        // 사용자 정보 화면 숨기고 시작 화면 표시
        userInfoScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        console.log('화면 전환 완료');
    } else if (!startScreen.classList.contains('hidden')) {
        console.log('시작 화면에서 클릭');
        // 시작 화면에서 시작 버튼 클릭
        startGame();
    }
}



// 키보드 이벤트 처리 (엔터키로 제출)
ratingInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        submitRating();
    }
});

// 사용자 정보 입력 필드 엔터키 처리
userNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        userDormInput.focus();
    }
});

userDormInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleStartButton();
    }
});

// 퀴즈 결과 저장 함수
async function saveQuizResult(event) {
    if (!userName || !userDorm) {
        alert('사용자 정보가 없습니다. 처음 화면으로 돌아갑니다.');
        // 사용자 정보 입력 화면으로 돌아가기
        finalResultScreen.classList.add('hidden');
        userInfoScreen.classList.remove('hidden');
        return;
    }

    // 클릭된 버튼 확인 (항상 최종 결과 화면의 버튼)
    const clickedBtn = finalSaveResultBtn;

    // 로딩 표시
    const originalText = clickedBtn.textContent;
    clickedBtn.disabled = true;
    clickedBtn.textContent = '저장 중...';

    const totalError = calculateTotalAbsoluteError();

    const resultData = {
        userName: userName,
        userDorm: userDorm,
        score: score,
        totalQuestions: totalQuestions,
        totalError: totalError,
        answers: userAnswers
    };

    try {
        // 백엔드 서버로 결과 전송 (다양한 포트 시도)
        let response;
        try {
            response = await fetch('http://localhost:3001/api/save-result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(resultData)
            });
        } catch (fetchError) {
            // 포트 3001이 안되면 3000 시도
            response = await fetch('http://localhost:3000/api/save-result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(resultData)
            });
        }

        if (response.ok) {
            const result = await response.json();
            alert(`✅ 결과가 성공적으로 저장되었습니다!\n\n📊 결과 요약:\n• 점수: ${score}/${totalQuestions}\n• 누적 오차: ${totalError.toFixed(2)}\n\nID: ${result.id}`);

            // 저장 버튼 상태 변경
            clickedBtn.textContent = '✅ 저장 완료';
            clickedBtn.classList.remove('save-btn');
            clickedBtn.classList.add('secondary');
        } else {
            const errorText = await response.text();
            alert(`❌ 결과 저장에 실패했습니다: ${response.status} ${response.statusText}\n\n오류 내용: ${errorText}`);
        }
    } catch (error) {
        console.error('결과 저장 중 오류 발생:', error);
        alert(`❌ 서버에 연결할 수 없습니다.\n\n해결 방법:\n1. 서버가 실행 중인지 확인: 터미널에서 'npm start' 확인\n2. 서버가 포트 3001에서 실행 중인지 확인\n3. 방화벽이나 네트워크 문제 확인\n\n오류 상세: ${error.message}`);

        // 버튼 상태 복원
        clickedBtn.disabled = false;
        clickedBtn.textContent = originalText;
    }
}
