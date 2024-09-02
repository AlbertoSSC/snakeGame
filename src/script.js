const board = document.querySelector('#board');
const scoreBoard = document.querySelectorAll('.scoreBoard');
const showHighScore = document.querySelector('#highScore');
const showTotalGames = document.querySelector('#totalGames');
const startButton = document.querySelector('#start');
const gameOverSign = document.querySelector('#gameOver');
const instructions = document.querySelector('#instructions');
const closeButton = document.querySelector('#closeButton');
const retryButton = document.querySelector('#retryButton');
const countDown1 = document.querySelector('#countDown1');
const countDown2 = document.querySelector('#countDown2');

const arrowDown = document.querySelector('#downArrow');
const arrowUp = document.querySelector('#upArrow');
const arrowLeft = document.querySelector('#leftArrow');
const arrowRight = document.querySelector('#rightArrow');

let highscore = window.localStorage.getItem('highScore') || 0;
let gamesPlayed = window.localStorage.getItem('gamesPlayed') || 0;
let score = 0;

const fetchScores = async () => {
  try {
    const response = await fetch('./scores.json');
    const scores = await response.json();
    return scores;
  } catch (error) {
    console.error(error);
  }
};

const getScores = async () => {
  const data = await fetchScores();

  if (data) {
    highscore = data.highscore;
    gamesPlayed = data.gamesPlayed;
  }
};

const boardSize = 10;
const gameSpeed = 120;
const squareType = {
  empty: 0,
  snake: 1,
  food: 2,
};

const directions = {
  up: -10,
  down: 10,
  left: -1,
  right: 1,
};

let snake, direction, boardSquares, emptySquares, moveInterval;

const setGame = () => {
  snake = ['00', '01', '02', '03'];
  score = snake.length - 4;
  direction = 'right';
  boardSquares = Array.from(Array(boardSize), () =>
    Array(boardSize).fill(squareType.empty)
  );

  board.innerHTML = '';
  emptySquares = [];
  createdBoard();
};

const createdBoard = () => {
  boardSquares.forEach((row, rowIndex) => {
    row.forEach((column, columnIndex) => {
      const squareValue = `${rowIndex}${columnIndex}`;
      const squareElement = document.createElement('div');

      squareElement.setAttribute('class', 'square empty');
      squareElement.setAttribute('id', squareValue);
      board.appendChild(squareElement);

      emptySquares.push(squareValue);
    });
  });
};

const drawSquare = (squarePosition, type) => {
  const [row, column] = squarePosition.split('').map(Number);
  const key = type.split(' ')[0];

  boardSquares[row][column] = squareType[key];

  const squareElement = document.getElementById(squarePosition);

  if (squareElement) {
    squareElement.setAttribute('class', `square ${type}`);
  } else {
    console.warn('Elemento no encontrado para squarePosition:', squarePosition);
  }
};

const drawSnake = () => {
  snake.forEach((square, index) => {
    let directionClass = '';

    if (index === snake.length - 1) {
      if (direction === 'up') {
        directionClass = 'round-top';
      } else if (direction === 'down') {
        directionClass = 'round-bottom';
      } else if (direction === 'left') {
        directionClass = 'round-left';
      } else if (direction === 'right') {
        directionClass = 'round-right';
      }
      drawSquare(square, `snake snake-head ${directionClass}`);
    } else if (index === 0) {
      const tailDirection = determineTailDirection();
      drawSquare(square, `snake ${tailDirection}`);
    } else {
      determineBodyDirection();
    }
  });
};

const determineBodyDirection = () => {
  const directionMap = {
    '-10,1': 'snake round-left-bottom',
    '-10,-1': 'snake round-right-bottom',
    '10,-1': 'snake round-right-top',
    '10,1': 'snake round-left-top',
    '-1,10': 'snake round-right-top',
    '-1,-10': 'snake round-right-bottom',
    '1,10': 'snake round-left-top',
    '1,-10': 'snake round-left-bottom',
    '-1,1': 'snake horizontal-body',
    '1,-1': 'snake horizontal-body',
    '-10,10': 'snake vertical-body',
    '10,-10': 'snake vertical-body',
  };

  snake.forEach((square, index) => {
    const originSquare = Number(square);
    const previousSquare = Number(snake[index - 1]);
    const nextSquare = Number(snake[index + 1]);

    if (index === snake.length - 1 || index === 0) return '';

    const deltaPrev = previousSquare - originSquare;
    const deltaNext = nextSquare - originSquare;

    const key = `${deltaPrev},${deltaNext}`;

    const className = directionMap[key] || 'snake';

    drawSquare(square, className);
  });
};

const determineTailDirection = () => {
  const tailDirections = {
    '-10': 'tailToBottom',
    10: 'tailToTop',
    '-1': 'tailToRight',
    1: 'tailToLeft',
  };

  const tail = snake[0];
  const secondToLast = snake[1];
  const deltaPrev = Number(secondToLast) - Number(tail);
  return tailDirections[deltaPrev];
};

const updateScore = () => {
  scoreBoard.forEach(element => {
    element.innerText = score;
  });
};

const randomFood = () => {
  const randomPosition =
    emptySquares[Math.floor(Math.random() * emptySquares.length)];

  const isValidRandomPosition = document
    .getElementById(randomPosition)
    .classList.contains('empty');

  isValidRandomPosition ? drawSquare(randomPosition, 'food') : randomFood();
};

let keyLock = false;
const handleKeyDown = event => {
  if (keyLock) return;

  const key = event.key;
  switch (key) {
    case 'ArrowUp':
      if (direction !== 'down') {
        direction = 'up';
        keyLock = true;
      }
      break;
    case 'ArrowDown':
      if (direction !== 'up') {
        direction = 'down';
        keyLock = true;
      }
      break;
    case 'ArrowLeft':
      if (direction !== 'right') {
        direction = 'left';
        keyLock = true;
      }
      break;
    case 'ArrowRight':
      if (direction !== 'left') {
        direction = 'right';
        keyLock = true;
      }
      break;
    case ' ':
      startGame();
      break;
  }
};

const moveSnake = () => {
  const newSquare = String(
    Number(snake[snake.length - 1]) + directions[direction]
  ).padStart(2, '0');

  const [row, column] = newSquare.split('').map(Number);

  if (
    newSquare < 0 ||
    newSquare > boardSize * boardSize ||
    (direction === 'left' && column == 9) ||
    (direction === 'right' && column == 0) ||
    boardSquares[row][column] === squareType.snake
  ) {
    gameOver();
    return;
  }

  snake.push(newSquare);

  boardSquares[row][column] === squareType.food ? addFood() : addEmptySquare();

  drawSnake();
  keyLock = false;
};

const addEmptySquare = () => {
  drawSquare(snake.shift(), 'empty');
};

const addFood = () => {
  score++;
  updateScore();
  randomFood();
};

const gameOver = () => {
  if (highscore < score) highscore = score;
  window.localStorage.setItem('highScore', highscore);

  gamesPlayed++;
  window.localStorage.setItem('gamesPlayed', gamesPlayed);

  showHighScore.innerText = `High Score: ${highscore}`;
  showTotalGames.innerText = `Total Games Played: ${gamesPlayed}`;

  gameOverSign.style.display = 'flex';
  clearInterval(moveInterval);
  startButton.disabled = false;
};

const startGame = () => {
  gameOverSign.style.display = 'none';
  startButton.disabled = true;

  document.addEventListener('keydown', preventArrowScroll);
  document.addEventListener('keydown', handleKeyDown);

  countDown2.style.display = 'block';
  setTimeout(() => {
    countDown2.style.display = 'none';
    countDown1.style.display = 'block';
    setTimeout(() => {
      countDown1.style.display = 'none';
    }, 1000);
  }, 1000);

  setTimeout(() => {
    setGame();
    updateScore();
    drawSnake();
    randomFood();

    moveInterval = setInterval(moveSnake, gameSpeed);
  }, 2000);
};

const closeGame = () => {
  gameOverSign.style.display = 'none';
  startButton.disabled = false;
};

const preventArrowScroll = function (e) {
  if (
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)
  ) {
    e.preventDefault();
  }
};

updateScore();

startButton.addEventListener('click', startGame);

closeButton.addEventListener('click', closeGame);
retryButton.addEventListener('click', startGame);

arrowDown.addEventListener('click', function () {
  direction = 'down';
  keyLock = true;
});

arrowUp.addEventListener('click', function () {
  direction = 'up';
  keyLock = true;
});

arrowLeft.addEventListener('click', function () {
  direction = 'left';
  keyLock = true;
});

arrowRight.addEventListener('click', function () {
  direction = 'right';
  keyLock = true;
});
