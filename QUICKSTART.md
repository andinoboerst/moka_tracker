# 🚀 Quick Start Guide - Moka Pot Brewing Tracker

This guide will get you up and running in 5 minutes.

## Step 1: Clone & Install (1 min)

```bash
# Navigate to the project
cd /Users/andinoboerst/Code/moka_tracker

# Install dependencies (already done)
npm install
```

## Step 2: Create Supabase Project (2 min)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. **IMPORTANT**: Copy these values from Settings → API:
   - Project URL
   - Anon Key
   - Service Role Key

## Step 3: Set Up Database (1 min)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste the entire content of `schema.sql`
4. Click **RUN**
5. Done! Your tables are created

## Step 4: Environment Variables (1 min)

1. Create `.env.local` file in project root (copy from `.env.example`)
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
OPENAI_API_KEY=sk-optional-your-openai-key
```

## Step 5: Run Development Server (1 min)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

## What to Try First

1. **Add Inventory** (Go to `/inventory`):
   - Add a Bean (e.g., "Ethiopian Yirgacheffe" from "Blue Bottle", "Medium" roast)
   - Add a Grinder (e.g., "Baratza Encore")
   - Add a Moka Pot (e.g., "3 Cup")

2. **Log Your First Brew** (Go to `/brew`):
   - Select your bean, grinder, moka pot
   - Enter:
     - Grinder setting: 15
     - Coffee: 18g
     - Water: 36g
     - Yield: 32g
   - Rate your vibe: 8/10
   - Add notes: "Smooth, chocolatey"
   - Click "Log Brew"

3. **View Dashboard** (Go to `/`):
   - See your brew appear with auto-calculated ratios
   - See your vibe rating in stats

## Optional: Enable AI Recaps

To get AI-powered brewing suggestions:

1. Get OpenAI API key: [platform.openai.com](https://platform.openai.com/api-keys)
2. Set in `.env.local`:
   ```env
   OPENAI_API_KEY=sk-your-key
   ```
3. Deploy Supabase edge function:
   ```bash
   supabase functions deploy generate-recap --project-ref your-ref
   supabase secrets set OPENAI_API_KEY=sk-your-key --project-ref your-ref
   ```

## Troubleshooting

### Can't see my brews?
- Check that Supabase URL/keys are correct in `.env.local`
- Make sure database schema was fully deployed

### Forms not submitting?
- Check browser console for errors
- Verify API routes exist in `/app/api/`
- Check Supabase RLS policies are enabled

### AI Recap not showing?
- It's optional - brews work without it
- If you want it, verify OpenAI API key and edge function deployment

## Next Steps

- Explore the codebase in `components/` and `app/api/`
- Customize the dark theme in `app/globals.css`
- Add more brew parameters as needed
- Deploy to Vercel or Docker

---

Enjoy tracking your perfect moka pot brews! ☕
