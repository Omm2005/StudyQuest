# StudyQuest

A web-based text adventure game powered by Next.js, Prisma, Neon.tech, and AI integrations.

---

## 🚀 Getting Started

### 1. **Clone the repository**
```sh
git clone https://github.com/Omm2005/text-game-hackathon/
cd text-game-hackathon
```

### 2. **Install dependencies**
```sh
npm install
```
Or, if you use Bun:
```sh
bun install
```

### 3. **Configure environment variables**
- Copy `.env.example` to `.env`:
  ```sh
  cp .env.example .env
  ```
- Fill in your secrets:
  - `AUTH_SECRET`: Generate with `npx next-auth secret`
  - `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`: Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  - `DATABASE_URL`: Your PostgreSQL connection string (Neon.tech recommended)
  - `OPENAI_API_KEY`: Get from [OpenAI](https://platform.openai.com/) //if you want OpenAI
  - `GOOGLE_GENERATIVE_AI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/)

### 4. **Set up the database**
If you use [Neon.tech](https://neon.tech/):
- Create a Neon project and database.
- Copy your Neon connection string to `DATABASE_URL` in `.env`.

else
run ```./start-database.sh``` for Docker

Then run:
```sh
npx prisma migrate dev
```

### 5. **Start the development server**
```sh
npm run dev
```
Or with Bun:
```sh
bun run dev
```

---

## 🛠️ Tech Stack

- **Next.js** – React framework for web apps
- **Prisma** – ORM for PostgreSQL
- **Neon.tech** – Serverless PostgreSQL database
- **NextAuth.js** – Authentication (Google, Discord, etc.)
- **OpenAI & Google Generative AI** – AI-powered game logic
- **Vercel AI SDK** - For streaming the Ai chat and changing between AIs.

---

## 📁 Project Structure

```
src/
  ├── pages/         # Next.js pages
  ├── components/    # React components
  ├── lib/           # Utility functions
  ├── prisma/        # Prisma schema
  └── env.js         # Environment variable schema
```

---

## 🧑‍💻 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/foo`)
3. Commit your changes
4. Push to the branch
5. Open a pull request

---

## 📄 License

MIT

---

## 🙋‍♂️ Troubleshooting

- **Database errors:** Check your `DATABASE_URL` and ensure your database is running (Neon.tech recommended).
- **Auth errors:** Make sure your Google/Discord credentials are correct and set in `.env`.
- **CSRF errors:** Clear cookies, use the correct domain/port, and restart your server.

---

## 📬 Contact

For questions, open an issue
