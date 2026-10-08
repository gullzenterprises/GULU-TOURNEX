# GULU TOURNEX authentication setup

The website uses Supabase Auth for email/password, Google and Facebook sign-in. Supabase Postgres stores player profiles. A database unique index and the claim_username function make usernames global, lowercase and changeable.

## 1. Create the profile table and username rules

1. Open your Supabase project.
2. Open **SQL Editor** and choose **New query**.
3. Copy and run [database/migrations/202610040001_auth_profiles.sql](../database/migrations/202610040001_auth_profiles.sql).

The migration creates a profile row for each new Supabase Auth user, enables row-level security, lets users read only their own profile, and claims usernames atomically. A username is 3–20 characters (a–z, 0–9, _) and can be changed from the player profile. The database keeps usernames globally unique even if two people try the same username at once. A released username may later be claimed by another player.

## 2. Add this project's public Supabase settings

1. Open frontend/scripts/auth-config.js.
2. Set supabaseUrl and publishableKey from the Supabase project dashboard.
3. Use the publishable key, or the legacy anon key if your dashboard only shows that. Never put a Supabase secret or service-role key in a browser file. These two values are public browser configuration and can be committed with the site.

The publishable key is intended for browser apps. Database row-level security is what protects the data.

## 3. Set the allowed website URLs in Supabase

In **Authentication → URL Configuration**:

- Set the development Site URL to http://127.0.0.1:4173/.
- Add http://127.0.0.1:4173/** to the redirect URL allow list.
- Before launch, change the Site URL to the real website address and add the exact production redirect paths.

Supabase only redirects to URLs present in this allow list.

## 4. Turn on email/password sign-in

In **Authentication → Sign In / Providers**, enable Email. Supabase may require email confirmation before the first login; the signup page shows the next step. For a public launch, configure a real SMTP provider in Supabase so confirmation emails reach users reliably.

## 5. Configure Google sign-in

1. Create a **Web application** OAuth client in Google Auth Platform.
2. Add http://127.0.0.1:4173 as an authorized JavaScript origin.
3. In Supabase **Authentication → Sign In / Providers → Google**, copy the Supabase callback URL.
4. Add that exact callback URL to Google's authorized redirect URIs. It has the form https://PROJECT_REF.supabase.co/auth/v1/callback.
5. Paste the Google client ID and secret into the Supabase Google provider settings and enable the provider.

The Google client secret stays in Supabase. It must not go in frontend/scripts/auth-config.js.

## 6. Configure Facebook sign-in

1. Create a Facebook app and add the Facebook Login product.
2. In Supabase **Authentication → Sign In / Providers → Facebook**, copy its callback URL.
3. Add that exact URL to Facebook's **Valid OAuth Redirect URIs**. It has the same Supabase callback shape as Google's.
4. Enable the public_profile and email permissions in the Facebook app.
5. Paste the Facebook App ID and App Secret into the Supabase Facebook provider settings and enable the provider.

Facebook apps in Development mode only allow app roles/testers. Meta may require review before general public use. Keep the App Secret in Supabase only.

## 7. Run the website on localhost

From the GULU TOURNEX project folder, run:

~~~powershell
node frontend/tools/dev-server.mjs
~~~

Then open http://127.0.0.1:4173/. Keep the server terminal open while testing. Use the login and signup links to test email/password and social sign-in.

## What the flow does

- Email/password and Google/Facebook create or sign in to a Supabase Auth account.
- After the first sign-in, players must claim a unique username before reaching their profile.
- Later sign-ins open the player's profile directly.
- Availability feedback is only a convenience; the database enforces uniqueness during the final claim.
- Logout ends the current browser session.

## Official setup references

- [Supabase JavaScript client installation](https://supabase.com/docs/reference/javascript/installing)
- [Supabase authentication redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Google sign-in setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Facebook sign-in setup](https://supabase.com/docs/guides/auth/social-login/auth-facebook)

