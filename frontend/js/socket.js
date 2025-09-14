let socket;

document.getElementById('connectBtn').addEventListener('click', () => {
  const name = document.getElementById('playerName').value || 'Player';
  const wsUrl = `${window.location.origin.replace(/^http/, 'ws')}/ws`;
  console.log('Connecting to WebSocket at:', wsUrl);
  
  try {
    socket = new WebSocket(wsUrl);
  } catch (err) {
    console.error('WebSocket connection failed:', err);
    status.textContent = '❌ Connection failed';
    return;
  }

  const status = document.getElementById('status');
  const output = document.getElementById('output');

  socket.onopen = () => {
    status.textContent = '✅ Connected';
    socket.send(JSON.stringify({ type: 'join', name }));
  };

  socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    
    switch(data.type) {
        case 'message':
        case 'echo':
            output.innerHTML += `<div>${data.text}</div>`;
            break;
        case 'matched':
            // Game is ready, initialize the game board
            document.getElementById('modeSelect').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
            initGame('online', { playerMark: data.playerMark, roomCode: data.roomCode });
            break;
        case 'gameState':
            updateGame(data);
            break;
        case 'gameOver':
            showWinScreen(data.winner);
            break;
        case 'invalidMove':
            // Optionally, provide feedback to the user
            console.log("Invalid move");
            break;
        case 'opponent_left':
            alert("Your opponent has left the game.");
            // Optionally, reset to main menu
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('modeSelect').style.display = 'flex';
            break;
    }
  };

  socket.onclose = () => status.textContent = '❌ Disconnected';

  // Optionally, handle socket errors
  socket.onerror = (err) => {
    status.textContent = '⚠️ Error';
  };
});

document.getElementById('sendBtn').addEventListener('click', () => {
  const msgInput = document.getElementById('msgInput');
  const msg = msgInput.value;
  if(socket && socket.readyState === WebSocket.OPEN && msg.trim() !== "") {
    socket.send(JSON.stringify({ type: 'message', text: msg }));
    msgInput.value = '';
  }
});
