# ProfitPilot V4.1 — Preview and OAuth setup

This update extends V4. No financial schema, core.js, Supabase RLS or production configuration is changed.

## Implemented
- Five palettes, light/dark/system modes, validated local preference and blocked-storage feedback.
- Sidebar on desktop, balance-first cards, daily cash chart with accessible data table, mobile navigation retained.
- Calculator Shadow DOM receives the same semantic theme tokens.
- Google sign-in uses existing Supabase Auth REST API with PKCE SHA-256. Verifier is tab-local, origin-bound, expires after 10 minutes, and is consumed once. Callback query is removed before exchange. Supabase authorization code has its own shorter server lifetime.
- Email/password and existing user-ID-based cloud books remain. No automatic import/merge of local financial data. Supabase may link verified matching email identities to the same user; distinct user IDs retain separate books. Manual identity linking is not implemented.

## Google activation (project owner)
Verified public Auth settings on 2026-10-31: Google disabled; email enabled. Google end-to-end login is NOT yet verified.
1. In Google Auth Platform, configure a Web application OAuth client in your Google Cloud project. Use only openid, email and profile scopes; if in Testing, add your test Google accounts.
2. Authorized redirect URI: `https://egdrowyepeljngcexqvb.supabase.co/auth/v1/callback`.
3. In existing Supabase project > Authentication > Sign In / Providers > Google, enter the Client ID and Client Secret directly there, then enable Google. Never put the secret in Vercel, source files or chat.
4. Supabase > Authentication > URL Configuration: keep the Production Site URL. Add the EXACT Vercel Preview origin with `/?oauth=google` to Redirect URLs. After release, add `https://profitpilot-iota.vercel.app/?oauth=google`. Avoid broad wildcard allowlists.
5. Open that exact Preview URL, click Akun > Lanjutkan dengan Google. Complete consent yourself; verify return to the same Preview, account books and refresh. Confirm cancellation, email/password sign-in, and different-account isolation using disposable test accounts before release.

Vercel Preview authentication protection stays unchanged. If Google returns to Production, the Preview redirect is missing or does not match the origin you opened. Do not copy tokens between origins.

## Validation
- Existing build, calculator, 28 V2, 17 V3, 12 cloud mock scenarios, and V4 weekly report suite passed.
- V4.1 automated checks: 15 preference combinations, system mode changes, blocked storage, PKCE digest, verifier origin/expiry/replay, provider-disabled handling, exchange body and password API compatibility.
- Browser: 15 theme combinations, preference retained after refresh, old calculator dark mode, transaction create/edit/refresh/soft-delete.
- Real Google login and fresh email/password/cloud synchronization on this Preview require a test-account user session. Mock tests do not prove live authentication.
- No paid services activated. Figma/Canva design connectors were unavailable in this session; implementation and visual checks use the running app.

References: https://supabase.com/docs/guides/auth/social-sign-in/auth-google ; https://supabase.com/docs/guides/auth/sessions/pkce-flow ; https://supabase.com/docs/guides/auth/auth-identity-linking .
