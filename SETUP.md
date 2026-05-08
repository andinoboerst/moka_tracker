# ☕ Moka Pot Brewing Tracker

A modern, scientific coffee brewing tracker for moka pot enthusiasts. Log your brews, track ratios, and get AI-powered brewing suggestions.

## Features

- **Inventory Management**: Build your collection of beans, grinders, and moka pots
- **Brew Logging**: Detailed logging with auto-calculated brew and extraction ratios
- **Auto-Calculations**:
  - Brew Ratio (Coffee : Water In)
  - Extraction Ratio (Coffee : Yield Out)
- **Vibe Rating System**: Rate your brews from 1-10 with emojis
- **AI Recap Feature**: Get AI-powered suggestions based on your brew parameters and tasting notes
- **Dashboard**: Beautiful overview of your brewing history with analytics
- **Dark Coffee Aesthetic**: Premium dark theme inspired by coffee beans
- **Mobile-First Design**: Fully responsive for all devices

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: React with Lucide Icons
- **AI**: OpenAI API (for brew recap generation)
- **Edge Functions**: Supabase Edge Functions (Deno)

## Setup Guide

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the [schema.sql](./schema.sql) file to create tables and RLS policies
3. Get your credentials:
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → Anon key
   - Service Role Key: Settings → API → Service role key

### 2. Environment Setup

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key (optional)
```

### 3. AI Recap Setup (Optional)

To enable AI-powered brew recaps:

1. Get an API key from [OpenAI](https://platform.openai.com)
2. Deploy the Supabase Edge Function:
   ```bash
   supabase functions deploy generate-recap --project-ref your-project-ref
   ```
3. Add your OpenAI key to the function secrets:
   ```bash
   supabase secrets set OPENAI_API_KEY=your-key --project-ref your-project-ref
   ```

### 4. Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

## Usage

### Dashboard
- View all your logged brews
- See brewing statistics (total brews, average vibe rating)
- Quick access to log a new brew

### Inventory Page (`/inventory`)
- **Add Beans**: Name, roaster, roast level
- **Add Grinders**: Brand and model
- **Add Moka Pots**: Size in cups
- Delete items you no longer use

### Brew Logger (`/brew`)
1. Select your bean, grinder, and moka pot
2. Enter grinder setting (clicks)
3. Log weights:
   - Coffee (grams)
   - Water added (grams)
   - Final yield (grams)
4. View auto-calculated ratios
5. Rate your vibe (1-10)
6. Add tasting notes
7. Submit to get AI recap

### Brew Cards
Each brew shows:
- Bean info and roaster
- Grinder settings
- Coffee measurements and ratios
- Vibe rating with emoji
- Tasting notes
- AI-powered "Brew Master Recap"

## AI Recap Examples

### Bitter Brew
If you rate low (≤5) and mention "bitter":
> "This brew came out bitter. Try increasing your grinder setting (coarser) or reducing heat. Your extraction ratio of 1:1.8 suggests over-extraction."

### Sour Brew
If notes mention "sour":
> "The sourness indicates under-extraction. Use a finer grind setting to increase brew time."

### Excellent Brew
If you rate high (≥8):
> "Excellent work! Your 18:36 water ratio and 1:1.8 extraction ratio are well-balanced."

## Project Structure

```
moka_tracker/
├── app/
│   ├── api/
│   │   ├── beans/
│   │   ├── brews/
│   │   ├── grinders/
│   │   └── moka-pots/
│   ├── brew/           # Brew logging page
│   ├── inventory/      # Inventory management
│   ├── layout.tsx
│   ├── page.tsx        # Dashboard
│   └── globals.css     # Dark theme styling
├── components/
│   ├── Header.tsx
│   ├── BrewForm.tsx
│   ├── BrewCard.tsx
│   ├── BeanForm.tsx
│   ├── GrinderForm.tsx
│   ├── MokaPotForm.tsx
│   └── InventoryList.tsx
├── lib/
│   ├── supabase.ts
│   ├── types.ts
│   └── utils.ts
├── supabase/
│   └── functions/
│       └── generate-recap/  # AI recap edge function
└── schema.sql          # Database schema
```

## Color Palette (Dark Coffee Aesthetic)

- **Background**: #1a1410 (Deep coffee)
- **Surface**: #2d2520 (Coffee bean)
- **Border**: #3d3530 (Medium brown)
- **Light**: #5a4f4a (Muted brown)
- **Accent**: #8b6f47 (Coffee gold)
- **Primary**: #d4a574 (Light coffee gold)
- **Text**: #f5f1ed (Cream)

## Development Tips

### Adding New Equipment Types
1. Add a new table to `schema.sql`
2. Create a new form component
3. Create API route in `app/api/`
4. Add to inventory page

### Extending Brew Logging
- Modify `BrewForm.tsx` to add new fields
- Update `lib/types.ts` with new Brew interface
- Update the database schema

### Customizing AI Recaps
Edit `supabase/functions/generate-recap/index.ts` to modify:
- Prompt logic
- Suggestion thresholds
- Default fallback recaps

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy

### Docker

```bash
docker build -t moka-tracker .
docker run -p 3000:3000 moka-tracker
```

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys in `.env.local`
- Check Supabase project status
- Ensure RLS policies are correctly configured

### AI Recaps Not Working
- Verify OpenAI API key is valid
- Check edge function deployment: `supabase functions list`
- View function logs: `supabase functions download generate-recap`

### Missing Inventory Items
- Ensure you're logged in to the correct Supabase account
- Check RLS policies allow your user to read/write
- Verify user ID matches in database

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

Made with ☕ for coffee enthusiasts who take their brews seriously.
