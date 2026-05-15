# ☕ Moka Pot Brewing Tracker

Welcome to the **Moka Pot Brewing Tracker** — a modern, mobile-first web application designed for coffee enthusiasts who want to dial in the perfect moka pot brew. 

By tracking every crucial variable and utilizing AI to analyze your historical data, this application helps you move from guesswork to precision brewing.

Access the live website and start tracking your own moka brews here: [mokatracker.com](mokatracker.com)

![Tech Stack](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Mistral AI](https://img.shields.io/badge/Mistral_AI-F472B6?style=for-the-badge&logo=openai&logoColor=white)

## ✨ Features

* **Inventory Management**: Keep a digital inventory of your coffee beans, grinders, and moka pots.
* **Precision Brew Logging**: Track grinder settings, coffee weight, water input, final yield, extraction time, and even the amount of milk added.
* **Automatic Ratios**: The app automatically calculates your Input Brew Ratio (Coffee to Water) and Extraction Ratio (Coffee to Yield).
* **Progressive AI Advice (Powered by Mistral AI)**: The built-in "Brew Master" doesn't just look at your current brew. It queries your database for the last 3 brews made with your *exact* setup (Bean + Grinder + Pot) to give you highly contextual, progressive instructions on how to adjust your next cup based on your tasting notes.
* **Beautiful Dark UI**: A meticulously designed "Dark Espresso" theme that looks great on both desktop and mobile.
* **Secure Authentication**: Built-in support for standard Email/Password login and Google OAuth via Supabase.

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- A [Supabase](https://supabase.com/) account
- A [Mistral AI](https://console.mistral.ai/) API Key

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/moka-tracker.git
cd moka-tracker
npm install
```

### 2. Database Setup
1. Create a new Supabase project.
2. Go to the SQL Editor and run the contents of the `schema.sql` file provided in the root directory. This will set up your tables, row-level security (RLS) policies, and foreign key constraints (with cascading deletes).

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the following keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
MISTRAL_API_KEY=your_mistral_api_key
```
*(Note: The Service Role key is strictly required for the "Delete Account" functionality).*

### 4. Run the App
We've included a handy `Makefile` for local development!
```bash
# Start the development server
make dev
```
Open `http://localhost:3000` to see your app.

## 🛠️ Makefile Commands
- `make dev`: Starts the Next.js development server.
- `make kill`: Forcefully kills any rogue process running on port 3000.
- `make build`: Builds the production application.
- `make start`: Runs the production build.
- `make clean`: Wipes the Next.js cache and freshly reinstalls `node_modules`.

## 📦 Deployment (Vercel)

This project is fully optimized for [Vercel](https://vercel.com/). 
1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Add the exact same Environment Variables listed above into your Vercel Project Settings.
4. Deploy! 

The repository also includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically lints and builds the project on every push to ensure code stability.

## 🔒 Security
- **Row Level Security (RLS)**: Every database table restricts read/write access to the authenticated user's `auth.uid()`. You can never see another user's brews.
- **Cascading Deletes**: If a user permanently deletes their account via the dashboard, the database automatically completely wipes all their associated beans, grinders, and brewing history to ensure data privacy.

---
*Built with ❤️ for the pursuit of the perfect cup.*
