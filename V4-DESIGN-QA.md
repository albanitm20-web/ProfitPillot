# ProfitPilot V4 — Emerald Finance

Branch: `design/emerald-v4`, based on existing production commit `ebac7db`.

## Audit V3
- Body and secondary text frequently 10–12 px; pale primary actions lacked visual emphasis.
- Large promotional heading delayed access to balances; onboarding remained visible after recording transactions.
- Mobile navigation used wrapped/scrolling tabs, with no persistent access to daily actions.
- Business form retained many legitimate accounting fields but needed readable single-column mobile layout.
- Calculator used its own palette and duplicate header; account, plan forms, and status messages needed consistent treatment.

## Design comparison
Two working browser prototypes share the real V3 implementation and data model:
- Default: top navigation, broader report cards, familiar V3 structure. Selected for release.
- `?layout=rail`: desktop side navigation. Useful for frequent navigation, but makes long Rupiah totals and card labels tighter. Kept as an explicit, nonpersistent design preview.
Both use the same five-action mobile navigation. No automatic sample data or remote assets.
Figma/v0/Stitch/Canva connectors were not accessible in this session. No external design file was created. Alternatives were built and compared using the browser tooling instead.

## Design system
- Primary #126B57; ink #132B2A; accent #D9F3E8; background #F7FAF8; surface #FFFFFF.
- Secondary text #536B65; borders #DCE7E2; danger #AC3434. Status is accompanied by text.
- System sans-serif; body 14px; input 16px; headings 19–32px; tabular currency numerals.
- Spacing 4/8/12/16/20/24/32px; cards 16px radius; controls 9–10px; dialog 20px.
- Controls >=44px, visible keyboard focus, named dialogs, skip link, reduced-motion support.
- Desktop tabs; mobile bottom navigation: Ringkasan, Riwayat, Tambah, Laporan, Lainnya.

## Changes
- Separate `v4.css` and `v4.js` presentation layer; original components and handlers retained.
- Real-data seven-day net cash overview replaces onboarding after the first record. Explicitly includes financing and opening balances, is not profit, and is independent of the month filter.
- Faster income/expense selection, one-column mobile forms, clearer save/error/loading states.
- Calculator CSS matches the app; its calculation script is unchanged.
- PWA colors updated; no new offline or analytics behavior.

## Safety
`core.js`, `app.js`, `cloud.js`, `v3.js`, and `supabase.sql` unchanged. V2/V3 storage keys and schema unchanged. Supabase URL, keys, RLS, account management, and conflict handling unchanged. QA used a separate localhost origin and fictional records only. Production data not modified.

## Verified
- Existing calculator suite, 28 V2 tests, 17 V3 tests, build/configuration checks, and 12 cloud adapter/cache scenarios passed.
- New V4 tests: week/year/month boundaries, account-book separation, net cash, empty state, no input mutation, and AA text/button color contrast.
- Browser: add, edit, soft delete, restore, refresh persistence, category filter, CSV download, invalid negative value, personal balances, business fees/direct costs/packaging, calculator recomputation, budgets, goals, menu routing, and local account unavailable state.
- Fictional personal income 5,000,000; edited expense 300,000; balance 4,700,000.
- Fictional business sale 100,000; costs 40,000 + fee 10,000 + packaging 5,000; profit/cash 45,000.
- Desktop 1365px and mobile 390/360px viewport overrides. Document widths 375/345px after scrollbar; no horizontal overflow in inspected dashboard views. No JavaScript errors observed.

## Limits before production
- Physical Android Chrome and iPhone Safari not tested; viewport checks do not substitute for those browsers.
- Live Supabase signup/login/account synchronization not tested with a real test account. Automated cloud tests use simulated responses.
- Backup parsing and ledger roundtrip covered by regression suite; no live account restore performed.
- Keep Production on V3 until preview deployment and live-account smoke test are reviewed. No database migration needed.
