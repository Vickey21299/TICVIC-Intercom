# Intercom Workspace Backend

A modular FastAPI application powering the Intercom support clone, integrated with Firebase Realtime Database (RTDB), Firebase Auth, and the Gemini generative AI SDK.

## Key Features

- **FastAPI Core**: Highly performant API endpoints configured with Pydantic payload parsing.
- **Firebase RTDB Integrations**: Realtime synchronization for workspaces, users (admins and agents), messages, conversations, and custom domain logs.
- **Modular AI Pipeline**:
  - **NLU classification**: Parses customer intents (e.g. `refund_request`, `order_status`, `greeting`, `small_talk`).
  - **KB Articles Router**: Fetches matches from the Knowledge Base directory.
  - **LLM Matched Classification**: Evaluates retrieved article titles and filters to identify specific resolving articles to suggest and link dynamically.
- **Custom Domains Setup**: Interfaces to register domains, verify DNS records (TXT & CNAME checks), and stub SSL certificate provisioning.
- **SMTP & IMAP Email Listeners**: Processes and parses incoming email chains and automatically registers new customer threads in Firebase.

## Setup & Execution

1. **Virtual Environment**:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Environment Configuration**:
   Create a `.env` file referencing your Firebase configuration and API keys:
   ```env
   FIREBASE_DATABASE_URL=your-database-url
   FIREBASE_WEB_API_KEY=your-web-api-key
   GEMINI_API_KEY=your-gemini-key
   ```

3. **Seeding the Database**:
   ```bash
   python scripts/seed_all.py
   ```

4. **Run Application**:
   ```bash
   uvicorn app.main:app --reload
   ```
