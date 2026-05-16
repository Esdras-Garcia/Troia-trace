# Hackathon Mobile App

Monorepo para um app mobile com:

- Frontend: React Native com Expo
- Backend: Java 25 com Spring Boot
- Banco: PostgreSQL

## Estrutura

```text
.
├── backend/          # API Java/Spring Boot
├── frontend/         # App mobile React Native/Expo
├── infra/            # Infra local e variaveis de ambiente
└── docker-compose.yml
```

## Requisitos

- Java 25
- Gradle 9.1+ ou Maven equivalente caso migre o build
- Node.js 20.19+
- Docker e Docker Compose

## Subir banco local

```bash
docker compose up -d postgres
```

## Rodar backend

```bash
cd backend
gradle bootRun
```

A API sobe em `http://localhost:8080`.

## Rodar frontend

```bash
cd frontend
npm install
npm run start
```

Configure a URL da API no arquivo `frontend/.env` usando o exemplo em `frontend/.env.example`.
