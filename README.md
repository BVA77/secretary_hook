# LINE Expense Tracker with Gemini and Supabase

This project implements a simple expense and income tracking system using LINE Messaging API, Google Gemini 2.5 Flash for OCR/NLP, and Supabase for data storage. The backend is built with Node.js and Express in TypeScript.

## Features

- **LINE Webhook**: Receives messages (text and image) from LINE.
- **Gemini 2.5 Flash Integration**: Extracts financial data from text messages (NLP) and images (OCR) and converts it into a structured JSON format.
- **Supabase Integration**: Stores extracted expense/income data in a PostgreSQL table.
- **TypeScript**: Ensures type safety and improves code maintainability.

## Project Structure

```
.
├── src/
│   ├── app.ts            # Main Express application, LINE webhook endpoint
│   ├── services/
│   │   ├── lineService.ts    # Handles LINE message processing and replies
│   │   ├── geminiService.ts  # Interfaces with Gemini API for data extraction
│   │   └── supabaseService.ts # Manages interactions with Supabase
│   ├── types/
│   │   └── index.ts          # Centralized TypeScript interfaces/types
│   └── utils/
│       └── index.ts          # Utility functions (e.g., logging)
├── .env                # Environment variables (sensitive data, not committed)
├── .env.example        # Example environment variables file
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # Project description and setup instructions
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd secretary_hook
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables (`.env`)

Create a `.env` file in the root directory of your project based on `.env.example` and fill in the following values:

```env
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
PORT=3000
```

- **`LINE_CHANNEL_ACCESS_TOKEN`**: Obtain this from your LINE Developers Console.
- **`LINE_CHANNEL_SECRET`**: Obtain this from your LINE Developers Console.
- **`GEMINI_API_KEY`**: Get this from Google AI Studio or Google Cloud Console.
- **`SUPABASE_URL`**: Your Supabase project URL.
- **`SUPABASE_ANON_KEY`**: Your Supabase public (anon) key.
- **`PORT`**: The port your Express server will listen on (default: 3000).

### 4. Supabase Setup

Create a table named `expenses` in your Supabase project with the following SQL schema:

```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    line_user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'income',
        'expense'
    )),
    amount NUMERIC NOT NULL,
    description TEXT,
    image_url TEXT
);
```

### 5. LINE Developers Console Setup

1.  Go to your [LINE Developers Console](https://developers.line.biz/console/) and select your Messaging API channel.
2.  In the **Webhook settings** section, set your Webhook URL to `https://your-domain.com/webhook` (replace `your-domain.com` with your deployed server's URL, or a local tunneling service like ngrok if testing locally).
3.  Enable **Use webhook**.
4.  Optionally, disable **Auto-reply messages** and **Greeting messages** to prevent conflicts with your bot's replies.

### 6. Running the Application

To run the application in development mode (with `nodemon` for auto-restarts):

```bash
npm run dev
```

To build and run the application in production mode:

```bash
npm run build
npm start
```

### Next Steps

- Implement more robust error handling and logging.
- Add authentication for Supabase (e.g., Row Level Security).
- Enhance Gemini prompts for more precise extraction.
- Consider adding more LINE message types (e.g., location, stickers) with appropriate handling.
- Implement a frontend dashboard to view expenses.
