import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, hasSupabase } from './lib/supabase'
import { signInWithEmail, signInWithGoogle, signOut } from './lib/auth'
import { saveOnboarding } from './services/profile'
import { TASK_DEFINITIONS, loadTodayTasks, toggleTask, loadWeekLogs } from './services/daily'
import { lookupBarcode, getProductAdvice, saveScan, loadScanHistory } from './services/scanner'
import { useAuth } from './hooks/useAuth'

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const C = {
  bg:'#07080a',surface:'#0e1117',card:'#13181f',cardBorder:'#1c2530',
  accent:'#60a5fa',accentDim:'#3b82f6',accentGlow:'rgba(96,165,250,0.12)',
  accentGlow2:'rgba(96,165,250,0.05)',gold:'#f59e0b',goldGlow:'rgba(245,158,11,0.12)',
  good:'#34d399',goodGlow:'rgba(52,211,153,0.12)',
  warn:'#fb923c',warnGlow:'rgba(251,146,60,0.12)',
  bad:'#ef4444',text:'#f0f4f8',textDim:'#64748b',muted:'#1e2a38',pill:'#161d28',
}
const FD = "'Cormorant Garamond', serif"
const FB = "'Plus Jakarta Sans', sans-serif"

// ═══════════════════════════════════════════════════════════════
// TRANSLATIONS (abbreviated — key strings only)
// ═══════════════════════════════════════════════════════════════
const LANGS = { nl:'🇳🇱 NL', en:'🇬🇧 EN', fr:'🇫🇷 FR', de:'🇩🇪 DE' }
const T = {
  nl:{
    appTagline:'Ludwig Health — Jouw persoonlijke gezondheidscoach.',
    startBtn:'Start mijn persoonlijk profiel →',splashSub:'2 minuten · Jij bepaalt',
    splashFeatures:[['🎯','Geen verboden — alleen slimme upgrades'],['🧑‍⚕️','AI coach die jóúw gewoontes kent'],['📷','Supermarkt scanner met direct advies'],['✍️','Jij vertelt ons zelf wat bij jou past']],
    step:'Stap',of:'van',next:'Verder →',add:'Toevoegen',skip:'Overslaan',
    yourProfile:'Jouw profiel',recommended:'Aanbevolen',
    step1Label:'Stap 1',step1Title:'Hoe mogen we je noemen?',step1Sub:'Zo spreekt je AI coach je elke dag persoonlijk aan.',
    namePlaceholder:'Jouw voornaam...',medicationQ:'Gebruik je bloedsuikermedicatie?',medicationSub:'Dit bepaalt welk vastenpatroon veilig is.',
    medNo:'Nee, geen medicatie',medNoDesc:'Alle patronen beschikbaar',medYes:'Ja, ik gebruik medicatie',medYesDesc:'We passen het patroon veilig aan',
