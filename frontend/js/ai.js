function aiMove(difficulty) {
  let move;
  if (difficulty === "easy") {
    // random move
    const available = board.map((v, i) => (v ? null : i)).filter(v => v !== null);
    move = available[Math.floor(Math.random() * available.length)];
  } else if (difficulty === "medium") {
    // random with some strategy
    move = findBestMove(board, "O") || aiMove("easy");
  } else {
    // hard: minimax
    move = minimax(board, "O").index;
  }
  makeMove(move);
}
