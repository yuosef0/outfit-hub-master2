# Google OAuth Setup Guide

This guide will help you configure Google OAuth for your Outfit Hub application.

## Prerequisites

- Access to [Supabase Dashboard](https://supabase.com/dashboard)
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if you haven't already
6. Choose **Web application** as the application type
7. Add these authorized redirect URIs:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback (for local development)
   ```
8. Click **Create** and save your **Client ID** and **Client Secret**

### 2. Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to configure
5. Enable the Google provider
6. Enter your **Client ID** and **Client Secret** from Google
7. Click **Save**

### 3. Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under **API**.

## Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Select either **Customer** or **Merchant** role

4. Click **Sign in with Google**

5. Complete the Google OAuth flow

6. You should be redirected to the appropriate dashboard based on your selected role

## Troubleshooting

### Redirect URI Mismatch Error

If you see a redirect URI mismatch error:
- Verify that the redirect URI in Google Cloud Console matches exactly what Supabase is using
- Check both your local development URL and production URL

### User Not Found in Database

If authentication succeeds but you see errors:
- Check that your `users` table exists in Supabase
- Verify that Row Level Security (RLS) policies allow inserting new users
- Check the browser console for detailed error messages

### Role Not Being Set

If users are being created but the role isn't set correctly:
- Clear your browser's session storage
- Try the login flow again
- Check the database to see if the user record was created
