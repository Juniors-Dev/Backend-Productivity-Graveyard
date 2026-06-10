# 🪦 Productivity Graveyard Backend

Backend API for Productivity Graveyard — a place to mourn your abandoned projects (and maybe revive them someday).

Built with:

- 🧩 Node.js + Express
- 🐘 PostgreSQL via Docker
- 🧬 Sequelize ORM
- 📄 Swagger Docs
- 🐳 Docker for consistent dev environments
- ✨ ESLint + Prettier + Husky for clean commits

---

## Tests

## [![CI](https://github.com/Juniors-Dev/Backend-Productivity-Graveyard/actions/workflows/ci.yml/badge.svg)](https://github.com/Juniors-Dev/Backend-Productivity-Graveyard/actions/workflows/ci.yml)

## ⚙️ Requirements

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v10+ (`corepack enable` can activate the pinned version from `package.json`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for PostgreSQL)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Juniors-Dev/Backend-Productivity-Graveyard.git
cd backend-productivity-graveyard
```

---

### 2. Install dependencies

```bash
pnpm install
```

This project uses pnpm with a 30-day minimum package release age (`minimumReleaseAge: 43200`) to reduce the risk of installing newly published compromised packages.

---

### 3. Set up environment variables

Create a .env file (you can copy .env.example):
Then edit .env to match your local config. Default values should work if you’re using Docker for PostgreSQL.

```bash
   cp .env.example .env
```

---

### 4. Start PostgreSQL with Docker

Make sure Docker Desktop is running, then:

```bash
docker compose up -d
```

This will start a PostgreSQL database at localhost:5432.

---

### 5. Run the app (with Swagger auto-generation)

```bash
pnpm run dev
```

Swagger will be generated if needed

App will auto-restart on file changes

Visit: http://localhost:3000/doc to view the Swagger API docs, or wherever your running the app, use base URL + /doc

---

## 🧪 Available Scripts

- `pnpm start` Start the app (also runs Swagger)
- `pnpm run dev` Start with auto-reload + Swagger
- `pnpm run prepare` Setup Husky pre-commit hooks
- `pnpm run lint` Lint the codebase with ESLint
- `pnpm run lint:fix` Lint and fix the codebase with ESLint
- `pnpm run format` Format the codebase with Prettier
- `pnpm test` Run the Jest test suite
- `pnpm run docs` Open the Swagger docs URL

---

## 🧼 Linting & Formatting

Runs on every commit via Husky

Uses ESLint + Prettier + lint-staged

---

## 🔐 JWT Auth

This API uses jsonwebtoken for signing and verifying tokens.

Make sure to set a JWT_SECRET in your .env file.

---

## 🐞 Troubleshooting

- ❌ Docker connection error? → Make sure Docker Desktop is running
- ❌ DB connection fails? → Check that the .env matches your Docker DB config
- ❌ Line ending issues on Windows? → Prettier handles this via endOfLine: auto but you can try setting your vsc ode settings to LF
  or CRLF as needed.

---

## File Naming Conventions

- **Models:** Singular, PascalCase _(eg. User.js, Project.js)_
- **Routes:** Plural, lowercase _(eg. users.js, projects.js)_
- **Controllers:** Singular, camelCase _(eg. userController.js, projectController.js)_
- **Services:** Singular, PascalCase _(eg. UserService.js, ProjectService.js)_
- **Middleware:** camelCase, action-named _(eg.authentication.js, validateSchema.js, asyncHandler.js)_
- **Schema:** camelCase, singular _(eg. userSchema.js, projectSchema.js)_

So our file structure is like this

```
src/
├── models/
│   ├── User.js
│   └── Project.js
│
├── services/
│   ├── UserService.js
│   └── ProjectService.js
│
├── controllers/
│   ├── userController.js
│   └── projectController.js
│
├── routes/
│   ├── users.js
│   └── projects.js
│
├── middleware/
│   ├── authentication.js
│   ├── validateSchema.js
│   └── asyncHandler.js
│
├── schema/
│   ├── userSchema.js
│   └── projectSchema.js
│
├── seeder/
│   ├── roles.json
│   ├── types.json
│   └── seed.js
│
└── app.js
```

---

## 👥 Contributing

TBD

---

## 📄 License

MIT – Junior.Dev
