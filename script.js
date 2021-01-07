'use strict';

const GAME_DIMENTION = 3; // Размер игрового поля
const MAX_TURNS_NUMBER = GAME_DIMENTION * GAME_DIMENTION;
const MIN_TURNS_TO_WIN = (GAME_DIMENTION * 2) - 1;

const exper = document.querySelector(`.playground__field[data-row="0"].playground__field[data-col="2"]`);
exper.addEventListener(`click`, () => {
   console.log(`works`);
});

// Инициализация переменных для DOM элементов
const userIcon = document.querySelector(`.playground__icons.user`);
const computerIcon = document.querySelector(`.playground__icons.computer`);
const gameBoard = document.querySelector(`.playground__fields`);
const fieldSet = document.querySelectorAll(`.playground__field`);
const StatisticScoreboard = {
   total: document.querySelector(`.statistics__total-score`),
   user: document.querySelector(`.statistics__user-score`),
   draw: document.querySelector(`.statistics__draw-score`),
   computer: document.querySelector(`.statistics__computer-score`),
}
const gameNumber = document.querySelector(`.playground__game-number`);
const historyList = document.querySelector(`.history-list`);
const historyItemTemplate = document.querySelector(`#history-item-template`);
const newGameButton = document.querySelector(`.new-game-button`);

// Инициализация вспомогательных переменных
const fields = [];
const score = {
   total: 0,
   user: 0,
   draw: 0,
   computer: 0,
};
const games = []; // Массив прошедших игр
let playGround = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; // Массив 3*3 под игровое поле
let turnsNumber = 0; // Кол-во ходов в текущей игре
let isUserPlayingX = true; // Флаг, что за Крестики играет пользователь
let isXTurn = true; // Флаг, что сейчас ходят Крестики

const getRandomInt = (max) => { // Полуает рандомное целое от 0 до max (не включая max)
   return Math.floor(Math.random() * Math.floor(max));
};

const updateHistory = () => { // Обновляет блок "История игр"
   const historyItem = historyItemTemplate.content.cloneNode(true); // Создет фрагмент по шаблону
   const historyItemGameNumber = historyItem.querySelector(`.game-number`);
   const historyItemWinner = historyItem.querySelector(`.game-winner`);
   const historyItemWinnerIcon = historyItem.querySelector(`.game-winner-icon`);

   if(games.length) {
      if (games.length === 1) {
         historyList.innerHTML = ``; // Для первой в массиве игры предварительно очищает поле
      }
      historyItemGameNumber.textContent = `№${games[games.length-1].gameNumber}: `;
      historyItemWinner.textContent = `${games[games.length-1].winner}`;
      historyItemWinnerIcon.src = `${games[games.length-1].winner}.png`;
   
      historyList.insertAdjacentElement(`afterbegin`, historyItem.firstElementChild); // Добавляет новую строку в начало списка игр
   }
}

const updateScoreboard = () => { // Обновляет значения в блоке статистики
   StatisticScoreboard.total.textContent = score.total;
   StatisticScoreboard.user.textContent = score.user;
   StatisticScoreboard.draw.textContent = score.draw;
   StatisticScoreboard.computer.textContent = score.computer;
   gameNumber.textContent = score.total + 1;
   updateHistory();
}

const highlightCurrentPlayer = () => { // Выделяет текущего игроки присвоением класса "active"
   if ((isXTurn && isUserPlayingX) || (!isXTurn && !isUserPlayingX)) { // 
      userIcon.classList.add(`active`);
      computerIcon.classList.remove(`active`);
   } else {
      userIcon.classList.remove(`active`);
      computerIcon.classList.add(`active`);
   }
}

const changePlayer = () => { // Меняет текущего игрока
   isXTurn = isXTurn ? false : true;
   highlightCurrentPlayer();
}

const updateGameBoard = () => { // Обновляет игровое поле
   /* Пробегает по всему массиву. Для ненулевых элементов присваивает нужный класс
      соответствующему элементу из массива DOM элементов с игровыми полями.
      Для нулеых элементов удаляет классы отметок Х0. */
   for (let i = 0; i < playGround.length; i++) {
      for (let j = 0; j < playGround[i].length; j++) {
         switch (playGround[i][j]) {
            case 1:
               fields[i][j].classList.add(`filled-x`);
               fields[i][j].disabled = true;
               break;
            case -1:
               fields[i][j].classList.add(`filled-0`);
               fields[i][j].disabled = true;
               break;
            default:
               fields[i][j].classList.remove(`filled-x`, `filled-0`);
               fields[i][j].disabled = false;   
         }
      }
   }
}

// Старт новой игры
const startNewGame = () => {
   newGameButton.disabled = true; // Выключает кнопку старта новой игры на время активной игры 
   
   // Обнуление счетчика кол-ва ходов и массив-карты игрового поля
   turnsNumber = 0;
   playGround = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
   isXTurn = true; // Игру всегда начинает Х
   isUserPlayingX = (score.total % 2) ? false : true; // Пользователь играет за Х все игры с нечетными номерами
   updateGameBoard();
   highlightCurrentPlayer();
   
   if(isUserPlayingX) { // 
      gameBoard.addEventListener(`click`, userTurn); 
   } else { // Если первый ход не за игроком, то вызывает функцию хода компьютреа с задержкой
      setTimeout(computerTurn, 1000);
   }
}

const finishGame = () => {
   updateScoreboard();
   newGameButton.disabled = false;
   gameBoard.removeEventListener(`click`, userTurn);
}

// Проверка на завершение игры
const checkGameOver = () => {
   let Lines = { // Объект со списком возможных линий, при заполнении которых игра заканчиавется победой одного из игроков
      vert1: 0,
      vert2: 0,
      vert3: 0,
      horiz1: 0,
      horiz2: 0,
      horiz3: 0,
      cross1: 0,
      cross2: 0
   }

   /* Рассчитывает веса линий.
   Т.к. массив квадратный 3*3 можно обойти и посчитать веса за 1 цикл */
   for (let i = 0; i < playGround.length; i++) { 
      Lines.vert1 += playGround[i][0];
      Lines.vert2 += playGround[i][1];
      Lines.vert3 += playGround[i][2];
      Lines.horiz1 += playGround[0][i];
      Lines.horiz2 += playGround[1][i];
      Lines.horiz3 += playGround[2][i];
      Lines.cross1 += playGround[i][i];
      Lines.cross2 += playGround[2-i][i];
   }

   const linesValues = Object.values(Lines); // Создает массив значений весов для поиска выигрышного веса линии
   
   /* Если найдена линия с весом 3, то победили "Х" */
   if (linesValues.includes(3)) {
      console.log(`X wins!`);
      if(isUserPlayingX) { // Если за "Х" играл пользователь, то увеличивает счетчик побед пользователя и делает запись в историю
         score.user++;
         games.push({
            gameNumber: score.total + 1,
            winner: `Пользователь (X)`
         });
      } else { // Если за "Х" играл не пользователь, значит победил компьютер
         score.computer++;
         games.push({
            gameNumber: score.total + 1,
            winner: `Компьютер (X)`
         });
      }
      score.total++;
      finishGame();
      return true;
   }
   if (linesValues.includes(-3)) { // Вес -3 означает победу "0". Увеличивает счетчики и делает запись в историю аналогично с победой "Х"
      console.log(`0 wins!`);
         if(isUserPlayingX) {
            score.computer++;
            games.push({
               gameNumber: score.total + 1,
               winner: `Компьютер (0)`
            });
         } else {
            score.user++;
            games.push({
               gameNumber: score.total + 1,
               winner: `Пользователь (0)`
            });
         }
         score.total++;
         finishGame();
         return true;
   }

   /* Если заполнены все поля и победитель не выявлен, то ничья.
   Делает запись в историю о ничьей и увеличивает счетичики */
   if (turnsNumber === MAX_TURNS_NUMBER) {
      console.log(`Draw! Friendship is winnig`);
      games.push({
         gameNumber: score.total + 1,
         winner: `Ничья`
      });
      score.total++;
      score.draw++;
      finishGame();
      return true;
   }
   return false;
}

const userTurn = (evt) => { 
   const row = evt.target.dataset.row;
   const column = evt.target.dataset.col;
   let isGameEnded = false;

   playGround[row][column] = isXTurn ? 1 : -1;
   turnsNumber++;
   updateGameBoard();
   changePlayer();
   if (turnsNumber >= MIN_TURNS_TO_WIN) {
      isGameEnded = checkGameOver();
   }
   if (!isGameEnded) { // Если игра не закончилась  ходом пользователя, то ходит компьютер
      setTimeout(computerTurn, 1000);
      gameBoard.removeEventListener(`click`, userTurn);
   }
}

const computerTurn = () => {
   gameBoard.addEventListener(`click`, userTurn);

   while (turnsNumber < MAX_TURNS_NUMBER) {
   let randomI = getRandomInt(GAME_DIMENTION);
      let randomJ = getRandomInt(GAME_DIMENTION);
      if (playGround[randomI][randomJ] === 0) {
         if (isXTurn) {
            playGround[randomI][randomJ] = 1;
         } else {
            playGround[randomI][randomJ] = -1;
         }
         turnsNumber++;
         changePlayer();
         updateGameBoard();
         if (turnsNumber >= MIN_TURNS_TO_WIN) {
            checkGameOver();
         }

         return;
      }
   }
}

for (let i = 0; i < GAME_DIMENTION; i++) {
   fields[i] = [];
   for (let j = 0; j < GAME_DIMENTION; j++) {
      fields[i][j] = document.querySelector(`.playground__field[data-row="${i}"].playground__field[data-col="${j}"]`);
   }
}

newGameButton.addEventListener(`click`, startNewGame);
updateScoreboard();
startNewGame();