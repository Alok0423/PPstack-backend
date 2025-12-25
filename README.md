# PPStack Backend

This folder contains the Node.js / Express backend for PPStack. It provides:

- Email/password authentication
- Google OAuth authentication (ID token verification)
- MongoDB user storage (Mongoose)
- Welcome email sending via Nodemailer on every successful login
- Environment-configured settings via `.env`

Quick start

1. Copy `.env.example` to `.env` and fill the values.
2. Install dependencies and start server:

```powershell
cd backend
npm install
npm run dev   # development with nodemon
# or in production:
npm run start
```

Endpoints

- `POST /api/auth/register` — { name, email, password }
- `POST /api/auth/login` — { email, password }
- `POST /api/auth/google` — { token }
- `GET /api/auth/me` — (protected) get authenticated user

Notes
- Keep `.env` secrets out of source control.
- Ensure `GOOGLE_CLIENT_ID` matches your frontend client id.
- If email credentials are missing the service will warn and skip sending emails.
