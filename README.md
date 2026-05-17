# Hackathon Mobile App

Monorepo para um app mobile com:

- Frontend: React Native com Expo
- Backend: Java 21 com Spring Boot
- Banco: H2 local por padrao

## Estrutura

```text
.
├── backend/          # API Java/Spring Boot
├── frontend/         # App mobile React Native/Expo
└── infra/            # Variaveis de ambiente opcionais
```

## Requisitos

- Java 21
- Gradle 9.1+ ou Maven equivalente caso migre o build
- Node.js 20.19+

## Rodar backend

```bash
cd backend
gradle bootRun
```

A API sobe em `http://localhost:8085`.

Swagger: `http://localhost:8085/swagger-ui.html`.

## Rodar frontend

```bash
cd frontend
npm install
npm run start
```

Configure a URL da API no arquivo `frontend/.env` usando o exemplo em `frontend/.env.example`.
