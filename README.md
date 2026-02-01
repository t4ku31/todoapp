# Todo App

A full-stack todo application with AI-powered task management.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Google GenAI API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-app
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Google GenAI API key
   ```
   
   📖 **See [Environment Variables Guide](./README.env.md) for detailed instructions**

3. **Start the application**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Frontend: https://localhost
   - BFF: https://localhost/bff
   - Resource Server: http://localhost:8080

## 📁 Project Structure

```
todo-app/
├── front/                 # React frontend (Vite + TypeScript)
├── servlet/
│   ├── bff/              # Backend for Frontend (Spring Boot)
│   └── resource/         # Resource Server (Spring Boot + Spring AI)
├── docker/               # Docker configuration
├── .env.example          # Environment variables template
└── README.env.md         # Environment setup guide
```

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- React Router
- Zustand (State Management)

### Backend
- Spring Boot 3.5.5
- Spring Security (OAuth2)
- Spring AI 1.1.2 (Google GenAI)
- MySQL 8.0
- Flyway (Database Migration)

### Infrastructure
- Docker & Docker Compose
- Nginx (Reverse Proxy)
- Railway (Deployment)

## 🤖 AI Features

This app uses Google's Gemini API for AI-powered task management:
- Natural language task creation
- Intelligent task suggestions
- Bulk operations via chat
- Context-aware task updates

## 📚 Documentation

- [Environment Variables Setup](./README.env.md) - How to configure environment variables
- [Frontend README](./front/README.md) - Frontend-specific documentation
- [API Documentation](http://localhost:8080/swagger-ui.html) - OpenAPI docs (when running)

## 🔧 Development

### Running Individual Services

**Frontend only:**
```bash
cd front
npm install
npm run dev
```

**Backend only:**
```bash
cd servlet/resource
./mvnw spring-boot:run
```

### Database Migrations

Migrations are automatically applied on startup using Flyway.

Migration files: `servlet/resource/src/main/resources/db/migration/`

## 🚢 Deployment

This project is deployed on Railway. See [Environment Variables Guide](./README.env.md) for deployment configuration.

## 👥 Team Development

For team members joining the project:

1. Follow the [Quick Start](#-quick-start) guide
2. Read the [Environment Variables Guide](./README.env.md)
3. Ask team lead for API keys (never commit them!)

## 📝 License

[Your License Here]
