# Dynamic Notes & Crosses (Tic-Tac-Toe)

A modern, real-time multiplayer Tic-Tac-Toe game with a unique dynamic twist! This project features both local and online gameplay modes, AI opponents with multiple difficulty levels, and a sleek terminal-inspired design.

## 🚀 Features

### Game Modes
- **Local Multiplayer**: Play against friends on the same device
- **Online Multiplayer**: Real-time matches with players worldwide
- **AI Opponents**: Three difficulty levels (Easy, Medium, Hard)
- **Random Matchmaking**: Get paired with online players instantly

### Dynamic Gameplay
- **Moving Pieces**: Unlike traditional Tic-Tac-Toe, pieces fade and disappear after 5-6 moves, creating dynamic strategy
- **Real-time Updates**: Live player statistics and game state synchronization
- **Room System**: Create or join private rooms with custom codes

### Technical Features
- **WebSocket Communication**: Real-time bidirectional communication
- **Docker Containerization**: Easy deployment and scalability
- **Nginx Load Balancing**: Efficient request routing
- **Responsive Design**: Works on desktop and mobile devices
- **Terminal Aesthetic**: Green-on-black retro styling

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3**: Modern web standards
- **Vanilla JavaScript**: Clean, dependency-free code
- **WebSocket API**: Real-time communication
- **Responsive Design**: Mobile-first approach

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **WebSocket (ws)**: Real-time communication
- **Custom Game Logic**: Win detection and AI algorithms

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and load balancer

## 📦 Installation & Setup

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start
1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd DynamicNotesCrosses
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Open your browser**
   Navigate to `http://localhost` to start playing!

### Development Setup
If you want to run components individually for development:

#### Backend
```bash
cd backend
npm install
npm start
```
Server runs on `http://localhost:8080`

#### Frontend
Serve the frontend directory with any static file server:
```bash
cd frontend
# Using Python
python -m http.server 3000
# Using Node.js
npx serve .
```

## 🎮 How to Play

### Basic Rules
1. Players take turns placing X's and O's on a 3x3 grid
2. Get three in a row (horizontally, vertically, or diagonally) to win
3. **Dynamic Twist**: After 5 moves, older pieces start to fade and disappear!

### Game Modes

#### Local Mode
- Perfect for playing with friends on the same device
- No internet connection required
- Instant gameplay

#### AI Mode  
- **Easy**: Random moves with basic strategy
- **Medium**: Improved decision making
- **Hard**: Strategic AI that's challenging to beat

#### Online Mode
- **Quick Match**: Get paired with random players
- **Private Rooms**: Create or join rooms with 6-digit codes
- **Real-time Stats**: See online player counts

## 🏗️ Project Structure

```
DynamicNotesCrosses/
├── docker-compose.yml          # Container orchestration
├── frontend/                   # Client-side application
│   ├── index.html             # Main HTML file
│   ├── css/style.css          # Styling
│   ├── js/
│   │   ├── game.js            # Game logic
│   │   ├── ai.js              # AI algorithms
│   │   ├── socket.js          # WebSocket handling
│   │   └── ui.js              # User interface
│   └── Dockerfile             # Frontend container
├── backend/                    # Server-side application
│   ├── src/
│   │   ├── server.js          # Main server
│   │   ├── gameLogic.js       # Game rules
│   │   ├── matchmaker.js      # Player matching
│   │   └── utils.js           # Utilities
│   ├── package.json           # Dependencies
│   └── Dockerfile             # Backend container
└── nginx/                      # Reverse proxy
    ├── default.conf           # Nginx configuration
    └── Dockerfile             # Nginx container
```

## 🔧 Configuration

### Environment Variables
You can customize the application by setting these environment variables:

- `BACKEND_PORT`: Backend server port (default: 8080)
- `FRONTEND_PORT`: Frontend server port (default: 3000)
- `NGINX_PORT`: Nginx proxy port (default: 80)

### Docker Compose Override
Create a `docker-compose.override.yml` file to customize settings:

```yaml
version: "3.8"
services:
  proxy:
    ports:
      - "8080:80"  # Use different port
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Test your changes thoroughly
- Update documentation as needed
- Keep commits atomic and well-described

## 🐛 Troubleshooting

### Common Issues

**Docker containers won't start**
- Ensure Docker is running
- Check if ports 80, 3000, or 8080 are already in use
- Try `docker-compose down` then `docker-compose up --build`

**WebSocket connection fails**
- Check if backend container is running
- Verify firewall settings
- Ensure browser supports WebSockets

**Game doesn't load**
- Clear browser cache
- Check browser console for errors
- Verify all containers are healthy: `docker-compose ps`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by classic Tic-Tac-Toe but with modern dynamic gameplay
- Built with performance and scalability in mind
- Designed for both casual and competitive play

## 🔗 Links

- [Live Demo](#) - Add your deployment URL here
- [Issues](../../issues) - Report bugs or request features
- [Discussions](../../discussions) - Community discussions

---

**Built with ❤️ for the love of classic games with modern twists!**