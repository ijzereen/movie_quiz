// 배포 환경 설정
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction
  ? 'https://your-render-backend-app.onrender.com'  // 배포 시 실제 Render 앱 URL로 변경해야 함
  : 'http://localhost:3001';

// 로컬 개발 환경 체크 (파일 프로토콜에서는 localhost 사용)
if (window.location.protocol === 'file:') {
  console.log('📁 파일 프로토콜 감지 - localhost:3001 사용');
}

// 게임 상태 변수들
let movies = [];
let currentMovieIndex = 0;
let score = 0;
let totalQuestions = 0;
let timer = null;
let timeLeft = 15;
let userAnswers = [];
let userName = '';
let userDorm = '';

// DOM 요소들 (배포용)
const userInfoScreen = document.getElementById('user-info-screen');
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const finalResultScreen = document.getElementById('final-result-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const startBtn = document.getElementById('start-btn');
const userInfoStartBtn = document.getElementById('user-info-start-btn');
const submitRatingBtn = document.getElementById('submit-rating');
const nextBtn = document.getElementById('next-btn');
const finalSaveResultBtn = document.getElementById('final-save-result-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const refreshLeaderboardBtn = document.getElementById('refresh-leaderboard-btn');
const backToStartBtn = document.getElementById('back-to-start-btn');

const ratingInput = document.getElementById('rating-input');
const userNameInput = document.getElementById('user-name');
const userDormInput = document.getElementById('user-dorm');

// 초기화 함수
function initializeButtons() {
  nextBtn.classList.add('hidden');
  console.log('🎮 영화 퀴즈 게임 초기화 완료');
  console.log(`🌍 실행 환경: ${isProduction ? '배포환경' : '개발환경'}`);
  console.log(`🔗 API URL: ${API_BASE_URL}`);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 페이지 로드 완료');
  initializeButtons();
});

// 게임 시작 함수
async function startGame() {
  console.log('🎬 게임 시작');

  try {
    // JSON 파일에서 영화 데이터 로드
    const response = await fetch('./movies.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    movies = data.movies;
    console.log(`📚 ${movies.length}개의 영화 데이터 로드 완료`);

  } catch (error) {
    console.error('❌ 영화 데이터를 불러오는데 실패했습니다:', error);
    alert('영화 데이터를 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
    return;
  }

  startScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  currentMovieIndex = 0;
  score = 0;
  totalQuestions = 0;
  userAnswers = [];
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

// 결과 표시 함수 (중간 결과)
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

  console.log(`📊 현재 진행률: ${currentMovieIndex + 1}/${movies.length}`);
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
  const errorRounded = Math.round(totalError * 100) / 100;

  finalResultTitle.textContent = '🎬 퀴즈 완료!';
  finalResultMessage.textContent = `총 ${totalQuestions}문제 중 ${score}문제를 맞췄어요!`;
  finalCurrentScore.textContent = `${score}/${totalQuestions}`;
  finalMseElement.textContent = `${errorRounded}`;

  console.log('🏆 최종 결과 계산 완료');
  console.log(`📈 최종 점수: ${score}/${totalQuestions}`);
  console.log(`📊 총 누적 오차: ${errorRounded}`);
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

// 퀴즈 결과 저장 함수 (배포용)
async function saveQuizResult(event) {
  if (!userName || !userDorm) {
    alert('사용자 정보가 없습니다. 처음 화면으로 돌아갑니다.');
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
    console.log('💾 결과 저장 시작...');
    console.log(`📡 요청 URL: ${API_BASE_URL}/api/save-result`);

    const response = await fetch(`${API_BASE_URL}/api/save-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resultData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ 결과 저장 성공:', result.id);
      alert(`✅ 결과가 성공적으로 저장되었습니다!\n\n📊 결과 요약:\n• 점수: ${score}/${totalQuestions}\n• 누적 오차: ${totalError.toFixed(2)}\n\nID: ${result.id}`);

      // 저장 버튼 상태 변경
      clickedBtn.textContent = '✅ 저장 완료';
      clickedBtn.classList.remove('save-btn');
      clickedBtn.classList.add('secondary');
    } else {
      throw new Error(result.error || '알 수 없는 오류');
    }

  } catch (error) {
    console.error('❌ 결과 저장 중 오류 발생:', error);

    let errorMessage = `❌ 서버에 연결할 수 없습니다.\n\n`;

    if (isProduction) {
      errorMessage += `해결 방법:\n`;
      errorMessage += `1. 백엔드 서버가 실행 중인지 확인\n`;
      errorMessage += `2. API URL이 올바른지 확인: ${API_BASE_URL}\n`;
      errorMessage += `3. 브라우저 개발자 도구에서 네트워크 탭 확인\n`;
    } else {
      errorMessage += `해결 방법:\n`;
      errorMessage += `1. 로컬 서버가 실행 중인지 확인: npm run dev\n`;
      errorMessage += `2. 서버가 포트 3001에서 실행 중인지 확인\n`;
    }

    errorMessage += `\n\n오류 상세: ${error.message}`;

    alert(errorMessage);

    // 버튼 상태 복원
    clickedBtn.disabled = false;
    clickedBtn.textContent = originalText;
  }
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

// 리더보드 화면 표시 함수
function showLeaderboard() {
  console.log('🏆 리더보드 화면 표시');

  // 현재 화면 숨기기
  startScreen.classList.add('hidden');

  // 리더보드 화면 표시
  leaderboardScreen.classList.remove('hidden');

  // 리더보드 데이터 로드
  loadLeaderboard();
}

// 리더보드 데이터 로드 함수
async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  const loadingEl = document.getElementById('leaderboard-loading');
  const noDataEl = document.getElementById('leaderboard-no-data');

  try {
    console.log('📊 리더보드 데이터 로드 시작...');
    console.log(`📡 요청 URL: ${API_BASE_URL}/api/leaderboard`);

    // 로딩 상태 표시
    loadingEl.classList.remove('hidden');
    noDataEl.classList.add('hidden');

    const response = await fetch(`${API_BASE_URL}/api/leaderboard`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.leaderboard && data.leaderboard.length > 0) {
      console.log(`✅ 리더보드 ${data.leaderboard.length}개 결과 로드 완료`);
      displayLeaderboard(data.leaderboard);
    } else {
      console.log('📭 리더보드 데이터 없음');
      showNoData();
    }

  } catch (error) {
    console.error('❌ 리더보드 로드 실패:', error);

    let errorMessage = '리더보드를 불러올 수 없습니다.\n\n';

    if (isProduction) {
      errorMessage += '백엔드 서버가 실행 중인지 확인해주세요.';
    } else {
      errorMessage += '로컬 서버가 실행 중인지 확인해주세요.';
    }

    alert(errorMessage);
    showNoData();
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// 리더보드 표시 함수
function displayLeaderboard(leaderboardData) {
  const container = document.getElementById('leaderboard-container');
  const loadingEl = document.getElementById('leaderboard-loading');
  const noDataEl = document.getElementById('leaderboard-no-data');

  // 기존 리더보드 제거
  const existingList = container.querySelector('.leaderboard-list');
  if (existingList) {
    existingList.remove();
  }

  noDataEl.classList.add('hidden');

  // 새 리더보드 생성
  const leaderboardList = document.createElement('div');
  leaderboardList.className = 'leaderboard-list';

  leaderboardData.forEach((entry, index) => {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';

    // 순위에 따른 특별 스타일 적용
    if (entry.rank <= 3) {
      item.classList.add(`rank-${entry.rank}`);
    }

    item.innerHTML = `
      <div class="leaderboard-rank">${entry.rank}</div>
      <div class="leaderboard-user">
        <div class="leaderboard-name">${entry.userName}</div>
        <div class="leaderboard-dorm">${entry.userDorm}</div>
      </div>
      <div class="leaderboard-stats">
        <div class="leaderboard-stat">
          <div class="leaderboard-stat-value">${entry.score}/${entry.totalQuestions}</div>
          <div class="leaderboard-stat-label">정확도</div>
        </div>
        <div class="leaderboard-stat">
          <div class="leaderboard-stat-value">${entry.accuracy}%</div>
          <div class="leaderboard-stat-label">정확률</div>
        </div>
        <div class="leaderboard-stat">
          <div class="leaderboard-stat-value">${entry.totalError}</div>
          <div class="leaderboard-stat-label">오차</div>
        </div>
      </div>
    `;

    leaderboardList.appendChild(item);
  });

  container.appendChild(leaderboardList);
}

// 데이터 없음 표시 함수
function showNoData() {
  const container = document.getElementById('leaderboard-container');
  const noDataEl = document.getElementById('leaderboard-no-data');

  // 기존 리더보드 제거
  const existingList = container.querySelector('.leaderboard-list');
  if (existingList) {
    existingList.remove();
  }

  noDataEl.classList.remove('hidden');
}

// 메인 화면으로 돌아가기 함수
function goToMain() {
  console.log('🏠 메인 화면으로 돌아가기');

  // 모든 화면 숨기기
  leaderboardScreen.classList.add('hidden');
  finalResultScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  quizScreen.classList.add('hidden');

  // 시작 화면 표시
  startScreen.classList.remove('hidden');
}

// 이벤트 리스너들
startBtn.addEventListener('click', handleStartButton);
userInfoStartBtn.addEventListener('click', handleStartButton);
submitRatingBtn.addEventListener('click', submitRating);
nextBtn.addEventListener('click', nextQuestion);
finalSaveResultBtn.addEventListener('click', saveQuizResult);

// 리더보드 관련 이벤트 리스너들
leaderboardBtn.addEventListener('click', showLeaderboard);
refreshLeaderboardBtn.addEventListener('click', loadLeaderboard);
backToStartBtn.addEventListener('click', goToMain);

console.log('🎯 영화 평점 퀴즈 게임 로드 완료!');
