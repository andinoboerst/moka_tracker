# ☕ Moka Pot Brewing Tracker

Welcome to the **Moka Pot Brewing Tracker** — a modern, mobile-first web application designed for coffee enthusiasts who want to dial in the perfect moka pot brew.

By tracking every crucial variable and utilizing AI to analyze your historical data, this application helps you move from guesswork to precision brewing.

Access the live website and start tracking your own moka brews here: [mokatracker.com](https://www.mokatracker.com/)

![Tech Stack](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Mistral AI](https://img.shields.io/badge/Mistral_AI-F472B6?style=for-the-badge&logo=mistral&logoColor=white)

## ✨ Features

### Core Brewing Tools
* **Inventory Management**: Keep a digital inventory of your coffee beans (with roast level, origin, roaster), grinders (with microns per click), and moka pots (with size and type).
* **Precision Brew Logging**: Track grinder settings, coffee weight, water input, final yield, extraction time, water temperature, heat level, flow type, and paper filter usage.
* **Automatic Ratios**: Real-time calculation of Input Brew Ratio (Coffee to Water) and Extraction Ratio (Coffee to Yield).
* **Individual Brew Pages**: View detailed information about each brew with sharing capabilities.

### AI-Powered Insights (Mistral AI)
* **Brew Recaps**: Get AI-generated summaries of each brew based on your tasting notes and parameters, with Italian flair and contextual advice.
* **Bean Journal**: AI-powered catalog of your beans with automatic summaries, average ratings, best brew recommendations, and rebuy/avoid suggestions.
* **Chat Assistant**: Interactive AI brewing coach that knows your inventory and provides personalized advice in English or Italian.

### Analytics & Visualization
* **Analytics Dashboard**: Visual charts showing your brewing patterns:
  - Scatter plots correlating grind size or days past roast with vibe ratings
  - Line graphs tracking extraction time across recent brews
  - Top brews showcase with detailed breakdowns
* **Bean Journal Analytics**: Sort and filter beans by rating, date, or roast level to discover your favorites.

### User Experience
* **Multi-Language Support**: Full English and Italian translations throughout the app.
* **Beautiful Dark UI**: Meticulously designed "Dark Espresso" theme with coffee-inspired colors (#1a1410, #d4a574, #f5f1ed).
* **Mobile-First Design**: Optimized for all screen sizes from mobile phones to desktop.
* **Brew Sharing**: Share your brew details with others via shareable templates.

### Authentication & Security
* **Multiple Sign-In Options**: Email/Password, Google OAuth, and anonymous guest access.
* **Row-Level Security**: All data is isolated per user with database-level security policies.
* **Account Management**: Full account deletion with automatic data cleanup (cascading deletes).

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- A [Supabase](https://supabase.com/) account
- A [Mistral AI](https://console.mistral.ai/) API Key (optional, for AI features)

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
*(Note: The Service Role key is required for the "Delete Account" functionality. The Mistral API key is optional - without it, AI features will be disabled.)*

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

## � Project Structure

```
moka_tracker/
├── app/
│   ├── analytics/          # Analytics dashboard with charts
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── bean-journal/   # Bean catalog API
│   │   ├── bean-summary/  # AI bean summaries
│   │   ├── brews/         # Brew CRUD operations
│   │   ├── beans/         # Bean inventory
│   │   ├── grinders/      # Grinder inventory
│   │   ├── moka-pots/     # Moka pot inventory
│   │   └── chat/          # AI chat assistant
│   ├── brew/
│   │   ├── [id]/          # Individual brew pages
│   │   └── page.tsx       # Brew logging form
│   ├── inventory/         # Inventory management
│   ├── auth/              # Auth callback route
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard/home
├── components/
│   ├── AnalyticsChart.tsx  # Recharts visualizations
│   ├── BeanJournal.tsx    # Bean catalog component
│   ├── BrewForm.tsx       # Brew logging form
│   ├── BrewCard.tsx       # Brew display card
│   ├── ChatAssistant.tsx   # AI chat interface
│   └── [other components]
├── lib/
│   ├── auth.tsx           # Authentication context
│   ├── LanguageContext.tsx # Multi-language support
│   └── [other utilities]
└── [configuration files]
```

## � Deployment (Vercel)

This project is fully optimized for [Vercel](https://vercel.com/). 
1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Add the exact same Environment Variables listed above into your Vercel Project Settings.
4. Deploy! 

The repository also includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically lints and builds the project on every push to ensure code stability.

## 🔒 Security
- **Row Level Security (RLS)**: Every database table restricts read/write access to the authenticated user's `auth.uid()`. You can never see another user's brews.
- **Cascading Deletes**: If a user permanently deletes their account via the dashboard, the database automatically completely wipes all their associated beans, grinders, and brewing history to ensure data privacy.
- **Secure Authentication**: Multiple authentication methods with proper token management and session handling.
- **API Protection**: All API routes validate user tokens before processing requests.

## 🤖 AI Features

The application uses **Mistral AI** to provide intelligent brewing insights:

### Brew Recaps
After each brew, the AI analyzes your parameters and tasting notes to provide:
- Contextual feedback on extraction quality
- Suggestions for grind, temperature, or heat adjustments
- Italian-flavored commentary with appropriate emojis

### Bean Journal
The AI creates comprehensive summaries for each bean in your catalog:
- Aggregates tasting notes from multiple brews
- Identifies flavor patterns and best brewing parameters
- Provides rebuy/avoid recommendations based on your experience
- Supports both English and Italian summaries

### Chat Assistant
An interactive brewing coach that:
- Knows your complete inventory (beans, grinders, moka pots)
- Provides personalized advice based on your equipment
- Answers questions about brewing techniques
- Communicates in English or Italian with Italian coffee terminology

*Note: AI features require a Mistral API key. Without it, the app functions normally but AI features are disabled.*

---

## Credits
The page icon was designed by [OpenMoji](https://openmoji.org/) – the open-source emoji and icon project. License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/#)

---
*Built with ❤️ for the pursuit of the perfect cup.*
