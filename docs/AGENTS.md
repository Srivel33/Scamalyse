# ScamCheck Project Guidelines

## Project Context
ScamCheck is a web application designed to help users identify and protect against potential scams using AI-powered analysis.

## Architecture Decisions
- **Frontend:** React with Vite for fast build and modern development experience.
- **Backend:** Python with FastAPI for performant and simple REST API development.
- **Database:** SQLite (to be added) for lightweight relational data storage.
- **AI:** Gemini API (to be added) for intelligent scam analysis.

## Coding Conventions
- **General:** Write clean, readable, and modular code. Include comments for complex logic.
- **Frontend (React):** Use functional components and hooks. Prefer explicit prop typing or simple structures before introducing complex state management.
- **Backend (Python):** Follow PEP 8 guidelines. Use type hints for FastAPI endpoints and functions.

## Security & Privacy Rules
- Never hardcode API keys or secrets in the codebase; always use environment variables (`.env`).
- Never commit `.env` files or SQLite databases containing user data.
- Ensure all user input is sanitized and validated.
- Minimize data collection to what is strictly necessary for scam analysis.

## Development Principles
- **Iterative Development:** Build foundational features first before adding complex UI or AI capabilities.
- **Separation of Concerns:** Keep frontend presentation logic strictly separated from backend business logic.
- **Simplicity:** Do not over-engineer; introduce dependencies only when clearly necessary.
