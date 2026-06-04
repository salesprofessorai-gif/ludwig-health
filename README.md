# 🩺 GlycoDay

**Tagline:** Voel je beter, elke dag — één stap tegelijk

Persoonlijke diabetes leefstijlcoach app voor pre- en type 2 diabetespatiënten.

## Stack
- React 18 + Vite
- Anthropic Claude API (AI coach + product advies)
- Supabase (auth + database) — Fase 2
- Open Food Facts API (barcode scanner) — Fase 2

## Features
- 🎯 Pleasure Mapping onboarding (8 stappen, 4 talen)
- ⏱ Intermitterend vasten tracker (12:12 / 16:8 / 18:6)
- 🏃 Dagelijkse bewegingstijdlijn
- 🧑‍⚕️ Gepersonaliseerde AI coach (streamed)
- 📷 Product scanner met glycemische impact score
- 🔥 Streak systeem + dagelijkse taken
- 🌍 NL / EN / FR / DE

## Setup

\`\`\`bash
npm install
cp .env.example .env.local
# Vul VITE_ANTHROPIC_API_KEY in .env.local
npm run dev
\`\`\`

## Deploy naar Vercel

1. Push naar GitHub
2. Importeer repo in Vercel
3. Voeg environment variable toe: \`VITE_ANTHROPIC_API_KEY\`
4. Deploy

## Pilot Roadmap

### Fase 2 — Echte data
- [ ] Open Food Facts API koppeling
- [ ] Supabase: gebruikersprofielen opslaan
- [ ] Streak + taken persistent (localStorage → database)
- [ ] CGM webhook ontvanger (Libre/Dexcom)

### Fase 3 — Retentie
- [ ] Web Push notificaties (service worker)
- [ ] Dagelijkse coach cron job (Vercel Edge Functions)
- [ ] Weekrapport via email (Resend API)
- [ ] A/B test coach-berichten op openratio

### Fase 4 — B2B Clinic Portal
- [ ] Zorgverlener dashboard (patiëntenlijst + compliance)
- [ ] Uitnodigingsflow voor huisarts → patiënt
- [ ] Wekelijkse PDF rapport per patiënt
- [ ] Supabase Row Level Security per praktijk
- [ ] Stripe subscription (per patiënt per maand)

## Licentie
Proprietary — © 2026 GlycoDay
