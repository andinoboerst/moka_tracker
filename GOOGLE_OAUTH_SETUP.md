# 🔐 Google OAuth Setup for Moka Tracker

To enable Google sign-in, you need to configure Google OAuth in your Supabase project.

## Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services → Credentials**
4. Click **+ CREATE CREDENTIALS → OAuth client ID**
5. Select **Web application**
6. Add these **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   (Replace `your-project-ref` with your actual Supabase project ID)
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication → Providers**
4. Find **Google** in the list and click to expand
5. Toggle **Enable sign in with Google**
6. Paste your Google credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
7. Click **Save**

## Step 3: Test Google Sign-In

1. Restart your development server: `npm run dev`
2. Open http://localhost:3000
3. Click "Sign In"
4. Click "Continue with Google"
5. Complete the Google OAuth flow
6. You should be signed in automatically!

## Troubleshooting

### "Invalid redirect_uri" Error
- Make sure the redirect URI in Google Cloud Console exactly matches:
  ```
  https://your-project-ref.supabase.co/auth/v1/callback
  ```
- Replace `your-project-ref` with your actual Supabase project ID

### Google Provider Not Showing
- Make sure you've enabled the Google provider in Supabase Authentication settings
- Check that your Client ID and Secret are correctly entered

### Sign-in Fails Silently
- Check browser console for error messages
- Verify your Google OAuth app is not in "testing" mode (or add test users)

## Security Notes

- Keep your Client Secret secure and never commit it to version control
- Consider adding your app domain to the authorized domains in Google Cloud Console
- For production, use HTTPS and a proper domain

---

Once configured, users can sign in with their Google account with just one click! 🚀
