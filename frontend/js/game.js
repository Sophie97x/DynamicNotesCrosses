
// --- Game State ---
let board = Array(9).fill(null);
let moveHistory = [];
let moveCount = 0;
let mode = null;
let aiDifficulty = 'easy';
const grid = document.getElementById('gameGrid');
let cells = Array.from(grid.querySelectorAll('[data-cell]'));
const winScreen = document.getElementById('winScreen');
const winnerText = document.getElementById('winnerText');
const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function drawBoard() {
  for (let i = 0; i < 9; i++) {
    const cell = cells[i];
    cell.textContent = board[i] || '';
    cell.classList.remove('faded');
    cell.classList.remove('empty');
    if (!board[i]) cell.classList.add('empty');
  }
}

function handleCellClickLocal(e) {
  const idx = cells.indexOf(e.target);
  if (idx === -1 || board[idx]) return;
  moveCount++;
  const mark = moveCount % 2 === 0 ? 'O' : 'X';
  placeMark(idx, mark);
  moveHistory.push(idx);
  if (moveHistory.length >= 5) {
    const fadeIndex = moveHistory.length - 5;
    if (fadeIndex >= 0) cells[moveHistory[fadeIndex]].classList.add('faded');
  }
  if (moveHistory.length >= 6) {
    const removeIndex = moveHistory.length - 6;
    if (removeIndex >= 0) {
      const oldestIdx = moveHistory.shift();
      board[oldestIdx] = null;
      cells[oldestIdx].textContent = '';
      cells[oldestIdx].classList.remove('faded');
      cells[oldestIdx].classList.add('empty');
    }
  }
  drawBoard();
  checkWin();
}

function placeMark(idx, mark) {
  board[idx] = mark;
  cells[idx].textContent = mark;
  cells[idx].classList.remove('empty');
  cells[idx].classList.remove('faded');
}

function checkWin() {
  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      showWinScreen(board[a]);
      return;
    }
  }
}

function showWinScreen(winner) {
  winnerText.textContent = `${winner} Wins!`;
  winScreen.style.display = 'flex';
}

function resetBoard() {
  board = Array(9).fill(null);
  moveHistory = [];
  moveCount = 0;
  drawBoard();
}

// --- Mode Initialization ---
window.initGame = function(selectedMode, difficulty) {
  mode = selectedMode;
  aiDifficulty = difficulty || 'easy';
  grid.style.display = 'grid';
  resetBoard();
  winScreen.style.display = 'none';
  // Remove all listeners by replacing cells
  cells = Array.from(grid.querySelectorAll('[data-cell]'));
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const newCell = cell.cloneNode(true);
    cell.parentNode.replaceChild(newCell, cell);
    cells[i] = newCell;
    if (mode === 'local') {
      newCell.addEventListener('click', handleCellClickLocal);
    }
    // AI and online listeners will be set in their modules
  }
  drawBoard();
};

// On load, do nothing until mode is selected
