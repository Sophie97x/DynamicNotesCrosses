let socket;

document.getElementById('connectBtn').addEventListener('click', () => {
  const name = document.getElementById('playerName').value || 'Player';
  socket = new WebSocket(`ws://localhost:8080/ws/`);

  const status = document.getElementById('status');
  const output = document.getElementById('output');

  socket.onopen = () => {
    status.textContent = '✅ Connected';
    socket.send(JSON.stringify({ type: 'join', name }));
  };

  socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if(data.type === 'message' || data.type === 'echo') {
      output.innerHTML += `<div>${data.text}</div>`;
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
