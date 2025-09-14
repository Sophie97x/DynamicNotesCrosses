const winningCombinations = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function checkWin(board) {
  for (const combo of winningCombinations) {
    const [a,b,c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

// AI: easy (random), medium (block/win), hard (minimax)
function aiMove(board, mark, difficulty='easy') {
  const empty = board.map((v,i) => v ? null : i).filter(v => v!==null);
  if (!empty.length) return null;
  if (difficulty === 'easy') return empty[Math.floor(Math.random()*empty.length)];
  // TODO: implement medium and hard
  return empty[0];
}

module.exports = { checkWin, aiMove };
