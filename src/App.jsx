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
// LH LOGO
// ═══════════════════════════════════════════════════════════════
function LHLogo({size=64}){
  return(
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="lhg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs>
      <rect width="64" height="64" rx="18" fill="url(#lhg)"/>
      <text x="32" y="43" textAnchor="middle" fill="white" fontSize="22" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="700" letterSpacing="-1">LH</text>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// TRANSLATIONS (abbreviated — key strings only)
// ═══════════════════════════════════════════════════════════════
const LANGS = { nl:'🇳🇱 NL', en:'🇬🇧 EN', fr:'🇫🇷 FR', de:'🇩🇪 DE' }
const T = {
  nl:{
    appTagline:'Geniet van het leven. Voel je beter. Ludwig Health zorgt voor de balans.',
    startBtn:'Start mijn persoonlijk profiel →',splashSub:'2 minuten · Jij bepaalt',
    splashFeatures:[['🎯','Geen diëten — alleen slimme gewoontes'],['🧑‍⚕️','AI coach die jóúw levensstijl kent'],['📷','Supermarkt scanner met direct advies'],['✍️','Jij bepaalt wat bij jou past']],
    step:'Stap',of:'van',next:'Verder →',add:'Toevoegen',skip:'Overslaan',
    yourProfile:'Jouw profiel',recommended:'Aanbevolen',
    step1Label:'Stap 1',step1Title:'Hoe mogen we je noemen?',step1Sub:'Zo spreekt je AI coach je elke dag persoonlijk aan.',
    namePlaceholder:'Jouw voornaam...',
    step2Label:'Stap 2',step2Title:'Wat geniet je van het meest?',step2Sub:'Kies wat je aanspreekt — niets wordt afgepakt.',
    drinksSec:'🍹 Dranken',foodSec:'🍽 Eten',addOwn:'Staat jouw favoriet er niet bij? Voeg het toe',
    enjoyPlaceholder:'bijv. Leffe blond, outdoor pizzaoven...',
    step2Btn:(n)=>n>0?`${n} items — verder →`:'Kies of voeg iets toe →',
    step3Label:'Stap 3',step3Title:'Welke rituelen horen bij jou?',step3Sub:'Rituelen blijven — we maken ze slimmer.',
    addRitual:'Jouw eigen rituelen toevoegen',ritualPlaceholder:'bijv. Aperitief op het terras...',
    step3Btn:(n)=>n>0?'Verder →':'Voeg minstens 1 toe',
    step4Label:'Stap 4',step4Title:'Wat zou je echt missen?',step4Sub:'Wees eerlijk — we veroordelen niets.',
    step5Label:'Stap 5',step5Title:'Wanneer eet je het minst bewust?',step5Sub:'Hier helpt de coach je het meest.',
    patternSec:'⏱ Kies je eetpatroon',
    step6Label:'Stap 6',step6Title:'Jouw startpunt',step6Sub:'Optioneel — helpt de coach je beter te begeleiden.',
    heightLabel:'Lengte (cm)',weightLabel:'Huidig gewicht (kg)',goalWeightLabel:'Doelgewicht (kg)',
    bmiLabel:'Jouw BMI',heightPh:'bijv. 178',weightPh:'bijv. 85',goalWeightPh:'bijv. 75',
    step6bTitle:'Nog iets anders?',step6bSub:'Jouw vrije ruimte — vertel ons alles wat relevant is.',
    step6Examples:['🍕 "Ik heb een houtoven buiten"','🥃 "Ik drink elke avond een whiskey"','⏰ "Ik werk in ploegen"','👨‍👩‍👧 "Mijn gezin eet anders"'],
    extraPlaceholder:'Typ iets en klik Toevoegen...',step6Note:'Je coach leest alles en past tips hierop aan.',
    step6Btn:(n)=>n>0?`${n} items — bouw mijn profiel →`:'Overslaan — bouw mijn profiel →',
    step6Added:(n)=>`Jij voegde toe (${n})`,
    coachSays:'Jouw coach',profileItems:(n)=>`Jouw profiel (${n} items)`,ownLabel:'✏️ = door jou toegevoegd',
    patternLabel:'Patroon',fastingLabel:'vasten',startApp:(n)=>`Start Ludwig Health, ${n} →`,coachBusy:'Coach is bezig...',
    greeting:(n)=>`Hallo ${n}!`,greetingSub:'Je coach heeft je profiel gelezen.',
    tabToday:'Vandaag',tabScan:'Scan',tabGoals:'Doelen',tabCoach:'Coach',
    chatPlaceholder:'Stel je coach een vraag...',chatSend:'→',
    weightWidget:'Gewichtsdoel',weightCurrent:'Huidig',weightGoal:'Doel',weightTo:'nog te gaan',
    goalsTitle:'Jouw Doelen',milestones:'Mijlpalen',
    goodMorning:(n)=>`Goedemorgen, ${n}`,streak:'dagen',progress:'Dagvoortgang',
    tasksOf:(a,b)=>`${a} van ${b} taken`,scanCta:'Supermarkt scan',scanCtaSub:'Scan een product — direct advies',
    todayTasks:'Taken vandaag',recentScans:'Recente scans',
    windowTitle:'Jouw eetvenster',windowOpen:'Eetvenster open',windowClosed:'Vastenperiode',
    windowOpens:'Opent om',windowCloses:'Sluit over',movementTitle:'Beweging vandaag',
    coachTitle:'Jouw AI Coach',weekInsight:'📈 Weekinzicht',aiCoachLabel:'AI Coach',refresh:'↻ Vernieuwen',
    scanTitle:'Product Scanner',scanStart:'📷  Start scanner',scanDemo:'— of probeer een demo product —',
    scanManual:'Barcode handmatig invoeren...',scanAgain:'← Opnieuw scannen',toDashboard:'Naar dashboard →',
    verdictGood:'✅ Goede keuze',verdictMaybe:'⚠️ Met mate',verdictBad:'❌ Skip dit',
    coachAdvice:'🧑‍⚕️ Coach advies',betterAlt:'💡 Beter alternatief',score:'Score',
    bloodSugarImpact:'Bloedsuiker impact score',analysing:'Analyse bezig...',scanning:'Scannen...',
    signIn:'Inloggen / Registreren',emailPlaceholder:'jouw@email.com',sendLink:'Stuur magic link →',
    checkEmail:'Check je email!',checkEmailSub:'We hebben een inloglink gestuurd.',
    orContinueWith:'Of ga verder als gast',guestMode:'Ga verder zonder account',
    signOut:'Uitloggen',saving:'Opslaan...',saved:'✓ Opgeslagen',
    loadingProfile:'Profiel laden...',errorRetry:'Probeer opnieuw',
    weekFasting:'Eetvenster gehaald',weekMovement:'Bewogen na maaltijd',
    weekStreak:'Streak',fastingDays:(n)=>`${n}/7 dagen`,noData:'Nog geen data deze week',
  },
  en:{
    appTagline:'Enjoy life. Feel better. Ludwig Health takes care of the balance.',
    startBtn:'Start my personal profile →',splashSub:'2 minutes · You decide',
    splashFeatures:[['🎯','No diets — only smart habits'],['🧑‍⚕️','AI coach who knows your lifestyle'],['📷','Supermarket scanner with instant advice'],['✍️','You decide what fits your life']],
    step:'Step',of:'of',next:'Continue →',add:'Add',skip:'Skip',
    yourProfile:'Your profile',recommended:'Recommended',
    step1Label:'Step 1',step1Title:'What should we call you?',step1Sub:'Your AI coach will address you personally every day.',
    namePlaceholder:'Your first name...',
    step2Label:'Step 2',step2Title:'What do you enjoy most?',step2Sub:'Choose what applies — nothing is taken away.',
    drinksSec:'🍹 Drinks',foodSec:'🍽 Food',addOwn:"Your favourite not here? Add it",
    enjoyPlaceholder:'e.g. Bourbon, outdoor pizza oven...',
    step2Btn:(n)=>n>0?`${n} items — continue →`:'Choose or add something →',
    step3Label:'Step 3',step3Title:'Which rituals belong to you?',step3Sub:'Rituals stay — we just make them smarter.',
    addRitual:'Add your own rituals',ritualPlaceholder:'e.g. Aperitif on the terrace...',
    step3Btn:(n)=>n>0?'Continue →':'Add at least 1',
    step4Label:'Step 4',step4Title:'What would you really miss?',step4Sub:"Be honest — we don't judge.",
    step5Label:'Step 5',step5Title:'When do you eat least consciously?',step5Sub:'This is where your coach helps most.',
    patternSec:'⏱ Choose your eating pattern',
    step6Label:'Step 6',step6Title:'Your starting point',step6Sub:'Optional — helps the coach guide you better.',
    heightLabel:'Height (cm)',weightLabel:'Current weight (kg)',goalWeightLabel:'Goal weight (kg)',
    bmiLabel:'Your BMI',heightPh:'e.g. 178',weightPh:'e.g. 85',goalWeightPh:'e.g. 75',
    step6bTitle:'Anything else?',step6bSub:'Your free space — tell us anything relevant.',
    step6Examples:['🍕 "I have an outdoor pizza oven"','🥃 "I have a whiskey every evening"','⏰ "I work shifts"','👨‍👩‍👧 "My family eats differently"'],
    extraPlaceholder:'Type something and click Add...',step6Note:'Your coach reads everything and tailors tips accordingly.',
    step6Btn:(n)=>n>0?`${n} items — build my profile →`:'Skip — build my profile →',
    step6Added:(n)=>`You added (${n})`,
    coachSays:'Your coach',profileItems:(n)=>`Your profile (${n} items)`,ownLabel:'✏️ = added by you',
    patternLabel:'Pattern',fastingLabel:'fasting',startApp:(n)=>`Start Ludwig Health, ${n} →`,coachBusy:'Coach is busy...',
    greeting:(n)=>`Hello ${n}!`,greetingSub:'Your coach has read your profile.',
    tabToday:'Today',tabScan:'Scan',tabGoals:'Goals',tabCoach:'Coach',
    chatPlaceholder:'Ask your coach anything...',chatSend:'→',
    weightWidget:'Weight goal',weightCurrent:'Current',weightGoal:'Goal',weightTo:'to go',
    goalsTitle:'Your Goals',milestones:'Milestones',
    goodMorning:(n)=>`Good morning, ${n}`,streak:'days',progress:'Daily progress',
    tasksOf:(a,b)=>`${a} of ${b} tasks`,scanCta:'Supermarket scan',scanCtaSub:'Scan a product — instant advice',
    todayTasks:"Today's tasks",recentScans:'Recent scans',
    windowTitle:'Your eating window',windowOpen:'Eating window open',windowClosed:'Fasting period',
    windowOpens:'Opens at',windowCloses:'Closes in',movementTitle:'Movement today',
    coachTitle:'Your AI Coach',weekInsight:'📈 Weekly insight',aiCoachLabel:'AI Coach',refresh:'↻ Refresh',
    scanTitle:'Product Scanner',scanStart:'📷  Start scanner',scanDemo:'— or try a demo product —',
    scanManual:'Enter barcode manually...',scanAgain:'← Scan again',toDashboard:'To dashboard →',
    verdictGood:'✅ Good choice',verdictMaybe:'⚠️ In moderation',verdictBad:'❌ Skip this',
    coachAdvice:'🧑‍⚕️ Coach advice',betterAlt:'💡 Better alternative',score:'Score',
    bloodSugarImpact:'Blood sugar impact score',analysing:'Analysing...',scanning:'Scanning...',
    signIn:'Sign in / Register',emailPlaceholder:'your@email.com',sendLink:'Send magic link →',
    checkEmail:'Check your email!',checkEmailSub:'We sent you a sign-in link.',
    orContinueWith:'Or continue as guest',guestMode:'Continue without account',
    signOut:'Sign out',saving:'Saving...',saved:'✓ Saved',
    loadingProfile:'Loading profile...',errorRetry:'Try again',
    weekFasting:'Eating window kept',weekMovement:'Moved after meal',
    weekStreak:'Streak',fastingDays:(n)=>`${n}/7 days`,noData:'No data this week yet',
  },
  fr:{
    appTagline:'Profitez de la vie. Sentez-vous mieux. Ludwig Health s\'occupe de l\'équilibre.',
    startBtn:'Créer mon profil personnel →',splashSub:'2 minutes · Vous décidez',
    splashFeatures:[['🎯','Pas d\'interdits — seulement des améliorations'],['🧑‍⚕️','Coach IA qui connaît vos habitudes'],['📷','Scanner supermarché avec conseils instantanés'],['✍️','Vous nous dites ce qui vous convient']],
    step:'Étape',of:'sur',next:'Continuer →',add:'Ajouter',skip:'Passer',
    yourProfile:'Votre profil',recommended:'Recommandé',
    step1Label:'Étape 1',step1Title:'Comment pouvons-nous vous appeler?',step1Sub:'Votre coach IA vous parlera personnellement chaque jour.',
    namePlaceholder:'Votre prénom...',
    step2Label:'Étape 2',step2Title:'Qu\'est-ce que vous appréciez le plus?',step2Sub:'Choisissez — rien ne sera supprimé.',
    drinksSec:'🍹 Boissons',foodSec:'🍽 Nourriture',addOwn:'Votre favori n\'est pas là? Ajoutez-le',
    enjoyPlaceholder:'ex. Bordeaux, four à pizza...',
    step2Btn:(n)=>n>0?`${n} éléments — continuer →`:'Choisissez ou ajoutez →',
    step3Label:'Étape 3',step3Title:'Quels rituels vous appartiennent?',step3Sub:'Les rituels restent — on les améliore.',
    addRitual:'Ajoutez vos propres rituels',ritualPlaceholder:'ex. Apéritif en terrasse...',
    step3Btn:(n)=>n>0?'Continuer →':'Ajoutez au moins 1',
    step4Label:'Étape 4',step4Title:'Qu\'est-ce qui vous manquerait vraiment?',step4Sub:'Soyez honnête — nous ne jugeons pas.',
    step5Label:'Étape 5',step5Title:'Quand mangez-vous le moins consciemment?',step5Sub:'C\'est là que votre coach vous aide le plus.',
    patternSec:'⏱ Choisissez votre schéma alimentaire',
    step6Label:'Étape 6',step6Title:'Votre point de départ',step6Sub:'Facultatif — aide le coach à mieux vous guider.',
    heightLabel:'Taille (cm)',weightLabel:'Poids actuel (kg)',goalWeightLabel:'Poids cible (kg)',
    bmiLabel:'Votre IMC',heightPh:'ex. 178',weightPh:'ex. 85',goalWeightPh:'ex. 75',
    step6bTitle:'Autre chose?',step6bSub:'Votre espace libre — dites-nous tout ce qui est pertinent.',
    step6Examples:['🍕 "J\'ai un four à pizza extérieur"','🥃 "Je bois un whisky chaque soir"','⏰ "Je travaille en horaires décalés"','👨‍👩‍👧 "Ma famille mange différemment"'],
    extraPlaceholder:'Tapez quelque chose et cliquez Ajouter...',step6Note:'Votre coach lit tout et adapte les conseils en conséquence.',
    step6Btn:(n)=>n>0?`${n} éléments — créer mon profil →`:'Passer — créer mon profil →',
    step6Added:(n)=>`Vous avez ajouté (${n})`,
    coachSays:'Votre coach',profileItems:(n)=>`Votre profil (${n} éléments)`,ownLabel:'✏️ = ajouté par vous',
    patternLabel:'Schéma',fastingLabel:'jeûne',startApp:(n)=>`Démarrer GlycoDay, ${n} →`,coachBusy:'Le coach est occupé...',
    greeting:(n)=>`Bonjour ${n}!`,greetingSub:'Votre coach a lu votre profil.',
    tabToday:'Aujourd\'hui',tabScan:'Scanner',tabGoals:'Objectifs',tabCoach:'Coach',
    chatPlaceholder:'Posez une question...',chatSend:'→',
    weightWidget:'Objectif poids',weightCurrent:'Actuel',weightGoal:'Cible',weightTo:'restants',
    goalsTitle:'Vos Objectifs',milestones:'Étapes',
    goodMorning:(n)=>`Bonjour, ${n}`,streak:'jours',progress:'Progrès du jour',
    tasksOf:(a,b)=>`${a} sur ${b} tâches`,scanCta:'Scanner supermarché',scanCtaSub:'Scannez un produit — conseil immédiat',
    todayTasks:'Tâches du jour',recentScans:'Scans récents',
    windowTitle:'Votre fenêtre alimentaire',windowOpen:'Fenêtre ouverte',windowClosed:'Période de jeûne',
    windowOpens:'Ouvre à',windowCloses:'Ferme dans',movementTitle:'Mouvement aujourd\'hui',
    coachTitle:'Votre Coach IA',weekInsight:'📈 Bilan de la semaine',aiCoachLabel:'Coach IA',refresh:'↻ Actualiser',
    scanTitle:'Scanner de produits',scanStart:'📷  Démarrer le scanner',scanDemo:'— ou essayez un produit démo —',
    scanManual:'Entrer le code-barres manuellement...',scanAgain:'← Scanner à nouveau',toDashboard:'Vers le tableau de bord →',
    verdictGood:'✅ Bon choix',verdictMaybe:'⚠️ Avec modération',verdictBad:'❌ Évitez',
    coachAdvice:'🧑‍⚕️ Conseil du coach',betterAlt:'💡 Meilleure alternative',score:'Score',
    bloodSugarImpact:'Impact sur la glycémie',analysing:'Analyse en cours...',scanning:'Scan en cours...',
    signIn:'Se connecter / S\'inscrire',emailPlaceholder:'votre@email.com',sendLink:'Envoyer le lien magique →',
    checkEmail:'Vérifiez vos emails!',checkEmailSub:'Nous vous avons envoyé un lien de connexion.',
    orContinueWith:'Ou continuer en tant qu\'invité',guestMode:'Continuer sans compte',
    signOut:'Se déconnecter',saving:'Enregistrement...',saved:'✓ Enregistré',
    loadingProfile:'Chargement du profil...',errorRetry:'Réessayer',
    weekFasting:'Fenêtre respectée',weekMovement:'Bougé après repas',
    weekStreak:'Série',fastingDays:(n)=>`${n}/7 jours`,noData:'Pas encore de données cette semaine',
  },
  de:{
    appTagline:'Genieße das Leben. Fühle dich besser. Ludwig Health sorgt für die Balance.',
    startBtn:'Mein persönliches Profil starten →',splashSub:'2 Minuten · Du entscheidest',
    splashFeatures:[['🎯','Keine Verbote — nur clevere Upgrades'],['🧑‍⚕️','KI-Coach der deine Gewohnheiten kennt'],['📷','Supermarkt-Scanner mit sofortigem Rat'],['✍️','Du sagst uns selbst was zu dir passt']],
    step:'Schritt',of:'von',next:'Weiter →',add:'Hinzufügen',skip:'Überspringen',
    yourProfile:'Dein Profil',recommended:'Empfohlen',
    step1Label:'Schritt 1',step1Title:'Wie dürfen wir dich nennen?',step1Sub:'So spricht dich dein KI-Coach täglich persönlich an.',
    namePlaceholder:'Dein Vorname...',
    step2Label:'Schritt 2',step2Title:'Was genießt du am meisten?',step2Sub:'Wähle aus — nichts wird weggenommen.',
    drinksSec:'🍹 Getränke',foodSec:'🍽 Essen',addOwn:'Dein Favorit nicht dabei? Füge ihn hinzu',
    enjoyPlaceholder:'z.B. Weißwein, Outdoor-Pizzaofen...',
    step2Btn:(n)=>n>0?`${n} Elemente — weiter →`:'Wähle oder füge etwas hinzu →',
    step3Label:'Schritt 3',step3Title:'Welche Rituale gehören zu dir?',step3Sub:'Rituale bleiben — wir machen sie cleverer.',
    addRitual:'Eigene Rituale hinzufügen',ritualPlaceholder:'z.B. Aperitif auf der Terrasse...',
    step3Btn:(n)=>n>0?'Weiter →':'Füge mindestens 1 hinzu',
    step4Label:'Schritt 4',step4Title:'Was würdest du wirklich vermissen?',step4Sub:'Sei ehrlich — wir urteilen nicht.',
    step5Label:'Schritt 5',step5Title:'Wann isst du am wenigsten bewusst?',step5Sub:'Hier hilft dir der Coach am meisten.',
    patternSec:'⏱ Wähle dein Essmuster',
    step6Label:'Schritt 6',step6Title:'Dein Ausgangspunkt',step6Sub:'Optional — hilft dem Coach dich besser zu begleiten.',
    heightLabel:'Größe (cm)',weightLabel:'Aktuelles Gewicht (kg)',goalWeightLabel:'Zielgewicht (kg)',
    bmiLabel:'Dein BMI',heightPh:'z.B. 178',weightPh:'z.B. 85',goalWeightPh:'z.B. 75',
    step6bTitle:'Noch etwas?',step6bSub:'Dein freier Raum — erzähl uns alles Relevante.',
    step6Examples:['🍕 "Ich habe einen Außen-Pizzaofen"','🥃 "Ich trinke jeden Abend einen Whisky"','⏰ "Ich arbeite im Schichtdienst"','👨‍👩‍👧 "Meine Familie isst anders"'],
    extraPlaceholder:'Tippe etwas und klicke Hinzufügen...',step6Note:'Dein Coach liest alles und passt die Tipps darauf an.',
    step6Btn:(n)=>n>0?`${n} Elemente — Profil erstellen →`:'Überspringen — Profil erstellen →',
    step6Added:(n)=>`Du hast hinzugefügt (${n})`,
    coachSays:'Dein Coach',profileItems:(n)=>`Dein Profil (${n} Elemente)`,ownLabel:'✏️ = von dir hinzugefügt',
    patternLabel:'Muster',fastingLabel:'Fasten',startApp:(n)=>`Ludwig Health starten, ${n} →`,coachBusy:'Coach ist beschäftigt...',
    greeting:(n)=>`Hallo ${n}!`,greetingSub:'Dein Coach hat dein Profil gelesen.',
    tabToday:'Heute',tabScan:'Scan',tabGoals:'Ziele',tabCoach:'Coach',
    chatPlaceholder:'Frag deinen Coach...',chatSend:'→',
    weightWidget:'Gewichtsziel',weightCurrent:'Aktuell',weightGoal:'Ziel',weightTo:'noch',
    goalsTitle:'Deine Ziele',milestones:'Meilensteine',
    goodMorning:(n)=>`Guten Morgen, ${n}`,streak:'Tage',progress:'Tagesfortschritt',
    tasksOf:(a,b)=>`${a} von ${b} Aufgaben`,scanCta:'Supermarkt-Scan',scanCtaSub:'Produkt scannen — sofortiger Rat',
    todayTasks:'Aufgaben heute',recentScans:'Letzte Scans',
    windowTitle:'Dein Essensfenster',windowOpen:'Essensfenster offen',windowClosed:'Fastenperiode',
    windowOpens:'Öffnet um',windowCloses:'Schließt in',movementTitle:'Bewegung heute',
    coachTitle:'Dein KI-Coach',weekInsight:'📈 Wochenübersicht',aiCoachLabel:'KI-Coach',refresh:'↻ Aktualisieren',
    scanTitle:'Produkt-Scanner',scanStart:'📷  Scanner starten',scanDemo:'— oder probiere ein Demo-Produkt —',
    scanManual:'Barcode manuell eingeben...',scanAgain:'← Erneut scannen',toDashboard:'Zum Dashboard →',
    verdictGood:'✅ Gute Wahl',verdictMaybe:'⚠️ Mit Maßen',verdictBad:'❌ Meiden',
    coachAdvice:'🧑‍⚕️ Coach-Rat',betterAlt:'💡 Bessere Alternative',score:'Score',
    bloodSugarImpact:'Blutzucker-Einfluss',analysing:'Analysiere...',scanning:'Scannen...',
    signIn:'Anmelden / Registrieren',emailPlaceholder:'deine@email.com',sendLink:'Magic Link senden →',
    checkEmail:'Überprüfe deine E-Mail!',checkEmailSub:'Wir haben dir einen Anmeldelink gesendet.',
    orContinueWith:'Oder als Gast fortfahren',guestMode:'Ohne Konto fortfahren',
    signOut:'Abmelden',saving:'Speichern...',saved:'✓ Gespeichert',
    loadingProfile:'Profil wird geladen...',errorRetry:'Erneut versuchen',
    weekFasting:'Essensfenster eingehalten',weekMovement:'Nach Mahlzeit bewegt',
    weekStreak:'Streak',fastingDays:(n)=>`${n}/7 Tage`,noData:'Noch keine Daten diese Woche',
  },
}

// ═══════════════════════════════════════════════════════════════
// ONBOARDING DATA
// ═══════════════════════════════════════════════════════════════
const ENJOY_DATA = {
  drinks:[
    {id:'wine',icon:'🍷',nl:'Glas wijn',en:'Glass of wine',fr:'Verre de vin',de:'Glas Wein'},
    {id:'beer',icon:'🍺',nl:'Biertje',en:'Beer',fr:'Bière',de:'Bier'},
    {id:'whiskey',icon:'🥃',nl:'Whiskey / sterke drank',en:'Whiskey / spirits',fr:'Whisky / alcool fort',de:'Whisky / Spirituosen'},
    {id:'coffee',icon:'☕',nl:'Koffie met suiker',en:'Coffee with sugar',fr:'Café sucré',de:'Kaffee mit Zucker'},
    {id:'soda',icon:'🥤',nl:'Frisdrank',en:'Soft drinks',fr:'Boissons sucrées',de:'Softdrinks'},
  ],
  food:[
    {id:'bbq',icon:'🔥',nl:'BBQ & gegrild vlees',en:'BBQ & grilled meat',fr:'BBQ & viande grillée',de:'BBQ & Gegrilltes'},
    {id:'pizza',icon:'🍕',nl:'Pizza',en:'Pizza',fr:'Pizza',de:'Pizza'},
    {id:'bread',icon:'🍞',nl:'Brood & broodjes',en:'Bread & rolls',fr:'Pain & petits pains',de:'Brot & Brötchen'},
    {id:'pasta',icon:'🍝',nl:'Pasta & rijst',en:'Pasta & rice',fr:'Pâtes & riz',de:'Pasta & Reis'},
    {id:'snacks',icon:'🍿',nl:'Chips & hartige snacks',en:'Crisps & snacks',fr:'Chips & snacks salés',de:'Chips & Snacks'},
    {id:'sweets',icon:'🍫',nl:'Chocolade & snoep',en:'Chocolate & sweets',fr:'Chocolat & bonbons',de:'Schokolade & Süßes'},
    {id:'cheese',icon:'🧀',nl:'Kaas & charcuterie',en:'Cheese & charcuterie',fr:'Fromage & charcuterie',de:'Käse & Wurst'},
    {id:'fries',icon:'🍟',nl:'Friet & fastfood',en:'Fries & fast food',fr:'Frites & fast food',de:'Pommes & Fast Food'},
    {id:'icecream',icon:'🍨',nl:'IJs & dessert',en:'Ice cream & dessert',fr:'Glace & dessert',de:'Eis & Dessert'},
  ],
}
const RITUAL_DATA=[
  {id:'afterwork',icon:'🌆',nl:'Drankje na het werk',en:'Drink after work',fr:'Verre après le travail',de:'Drink nach der Arbeit'},
  {id:'morning_coffee',icon:'🌅',nl:'Ochtendkoffie ritual',en:'Morning coffee ritual',fr:'Rituel café du matin',de:'Morgenkaffee-Ritual'},
  {id:'tv_snack',icon:'📺',nl:'Snacken voor de TV',en:'Snacking in front of TV',fr:'Grignoter devant la TV',de:'Snacken vor dem TV'},
  {id:'social_eating',icon:'🥂',nl:'Uitgebreid tafelen',en:'Long social meals',fr:'Repas conviviaux',de:'Gesellige Mahlzeiten'},
  {id:'weekend_bbq',icon:'🔥',nl:'Weekend BBQ',en:'Weekend BBQ',fr:'BBQ du week-end',de:'Wochen-BBQ'},
  {id:'lunch_bread',icon:'🥪',nl:'Broodlunch elke dag',en:'Bread lunch daily',fr:'Sandwich quotidien',de:'Brotlunch täglich'},
  {id:'sweet_after',icon:'🍬',nl:'Iets zoets na het eten',en:'Something sweet after meals',fr:'Quelque chose de sucré',de:'Etwas Süßes nach dem Essen'},
  {id:'apero',icon:'🫒',nl:'Apéro met hapjes',en:'Aperitif with snacks',fr:'Apéro avec amuse-bouches',de:'Aperitif mit Häppchen'},
]
const MISS_DATA=[
  {id:'taste',icon:'😋',nl:'De smaak',en:'The taste',fr:'Le goût',de:'Der Geschmack'},
  {id:'ritual',icon:'🔄',nl:'Het ritueel',en:'The ritual',fr:'Le rituel',de:'Das Ritual'},
  {id:'social',icon:'👥',nl:'Het sociale moment',en:'The social moment',fr:'Le moment social',de:'Der soziale Moment'},
  {id:'comfort',icon:'🛋️',nl:'Het gevoel van comfort',en:'The feeling of comfort',fr:'Le sentiment de confort',de:'Das Komfortgefühl'},
  {id:'reward',icon:'🏆',nl:'De beloning na een dag werk',en:'The reward after work',fr:'La récompense du travail',de:'Die Belohnung nach der Arbeit'},
  {id:'relaxation',icon:'😮‍💨',nl:'Ontspanning & loslaten',en:'Relaxation & letting go',fr:'Détente & lâcher prise',de:'Entspannung & Loslassen'},
]
const WEAK_DATA=[
  {id:'stress',icon:'😤',nl:'Bij stress of druk',en:'Under stress',fr:'Sous stress',de:'Bei Stress'},
  {id:'bored',icon:'😑',nl:'Bij verveling',en:'When bored',fr:'Par ennui',de:'Bei Langeweile'},
  {id:'tv',icon:'📺',nl:'Voor de TV',en:'In front of TV',fr:'Devant la TV',de:'Vor dem TV'},
  {id:'tired',icon:'😴',nl:'Als ik moe ben',en:'When tired',fr:'Quand je suis fatigué(e)',de:'Wenn ich müde bin'},
  {id:'social_p',icon:'🫂',nl:'Bij sociaal gezelschap',en:'In social situations',fr:'En société',de:'In Gesellschaft'},
  {id:'evening',icon:'🌙',nl:'In de avond',en:'In the evening',fr:'Le soir',de:'Am Abend'},
  {id:'cooking',icon:'👨‍🍳',nl:'Tijdens het koken',en:'While cooking',fr:'En cuisinant',de:'Beim Kochen'},
  {id:'weekend',icon:'📅',nl:'In het weekend',en:'On weekends',fr:'Le week-end',de:'Am Wochenende'},
]
const PATTERN_DATA=[
  {id:'12-12',icon:'🌱',eatStart:7,eatEnd:19,desc:{nl:'Rustig beginnen',en:'Easy start',fr:'Début en douceur',de:'Sanfter Einstieg'},detail:{nl:'Eet tussen 7:00–19:00',en:'Eat between 7:00–19:00',fr:'Mangez entre 7h–19h',de:'Essen zwischen 7:00–19:00'}},
  {id:'16-8',icon:'⚡',eatStart:11,eatEnd:19,recommended:true,desc:{nl:'Meest effectief',en:'Most effective',fr:'Le plus efficace',de:'Am wirkungsvollsten'},detail:{nl:'Eet tussen 11:00–19:00',en:'Eat between 11:00–19:00',fr:'Mangez entre 11h–19h',de:'Essen zwischen 11:00–19:00'}},
  {id:'18-6',icon:'🔬',eatStart:12,eatEnd:18,desc:{nl:'Gevorderd',en:'Advanced',fr:'Avancé',de:'Fortgeschritten'},detail:{nl:'Eet tussen 12:00–18:00',en:'Eat between 12:00–18:00',fr:'Mangez entre 12h–18h',de:'Essen zwischen 12:00–18:00'}},
]
const DEMO_PRODUCTS={
  '8710400563655':{barcode:'8710400563655',product_name:'Coca-Cola Regular 330ml',brand:'Coca-Cola',sugar_g:35,impact_score:1,verdict:'bad',nutrients:{carbs:35,protein:0,fat:0,fiber:0},alt:{nl:'Bruiswater met citroen',en:'Sparkling water with lemon',fr:'Eau gazeuse au citron',de:'Mineralwasser mit Zitrone'},altScore:9},
  '8718309259327':{barcode:'8718309259327',product_name:'Brinta Volkoren Havermout',brand:'Brinta',sugar_g:1,impact_score:9,verdict:'good',nutrients:{carbs:60,protein:13,fat:7,fiber:9},alt:null},
  '8712100800993':{barcode:'8712100800993',product_name:'Activia Aardbei Yoghurt',brand:'Danone',sugar_g:14,impact_score:5,verdict:'maybe',nutrients:{carbs:17,protein:4,fat:2,fiber:0},alt:{nl:'Griekse yoghurt + verse aardbeien',en:'Greek yoghurt + fresh strawberries',fr:'Yaourt grec + fraises fraîches',de:'Griechischer Joghurt + Erdbeeren'},altScore:9},
}
const SUGG={
  enjoy:{nl:['Leffe blond','Gin-tonic','Rode wijn','Outdoor pizzaoven','Zuurdesembrood','Raclette','Spare ribs','Pulled pork','Sushi'],en:['Bourbon','Red wine','Outdoor pizza oven','Sourdough bread','Spare ribs','Sushi'],fr:['Bordeaux','Four à pizza extérieur','Pain au levain','Raclette','Côtes de bœuf'],de:['Weißwein','Outdoor-Pizzaofen','Sauerteigbrot','Raclette','Spareribs']},
  ritual:{nl:['Aperitief op het terras','Zondagsontbijt','Wijnproeverij','Koffie op de veranda'],en:['Aperitif on the terrace','Sunday brunch','Wine tasting'],fr:['Apéritif en terrasse','Brunch du dimanche','Dégustation de vin'],de:['Aperitif auf der Terrasse','Sonntagsfrühstück','Weinverkostung']},
  extra:{nl:['Ik rook','Ik sport niet graag','Ik werk ploegendienst','Mijn partner eet anders'],en:['I smoke',"I don't like sport",'I work shifts','My partner eats differently'],fr:['Je fume','Je travaille en horaires décalés','Mon partenaire mange différemment'],de:['Ich rauche','Ich arbeite im Schichtdienst','Meine Familie isst anders']},
}

// ═══════════════════════════════════════════════════════════════
// AI HELPERS
// ═══════════════════════════════════════════════════════════════
async function streamAI(prompt, onChunk, systemPrompt) {
  const body = {model:'claude-sonnet-4-6',max_tokens:300,stream:true,messages:[{role:'user',content:prompt}]}
  if(systemPrompt) body.system = systemPrompt
  const res = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','x-api-key':import.meta.env.VITE_ANTHROPIC_API_KEY},body:JSON.stringify(body)})
  const reader=res.body.getReader(); const dec=new TextDecoder(); let full=''
  while(true){const{done,value}=await reader.read();if(done)break;dec.decode(value).split('\n').filter(l=>l.startsWith('data:')).forEach(line=>{try{const j=JSON.parse(line.slice(5));if(j.type==='content_block_delta'&&j.delta?.text){full+=j.delta.text;onChunk(full);}}catch{}})}
  return full
}

function buildProfilePrompt(name,data,lang){
  const lbl=(arr,src)=>arr.map(id=>src.find(o=>o.id===id)?.[lang]).filter(Boolean)
  const enjoy=[...lbl(data.enjoy,[...ENJOY_DATA.drinks,...ENJOY_DATA.food]),...(data.customEnjoy||[])]
  const rituals=[...lbl(data.rituals,RITUAL_DATA),...(data.customRituals||[])]
  const extras=data.anythingElse||[]
  const L={nl:`Je bent een warme gezondheidscoach. Schrijf een persoonlijk welkomstbericht in het Nederlands voor ${name}. Profiel: geniet van: ${enjoy.join(', ')}. Rituelen: ${rituals.join(', ')}. Zelf toegevoegd: ${extras.join(', ')||'niets'}. Patroon: ${data.pattern}. 3-4 zinnen, noem 2-3 concrete zaken, niets wordt afgepakt, eindig met 1 actie voor vandaag.`,en:`You are a warm health coach. Write a personal welcome in English for ${name}. Profile: enjoys: ${enjoy.join(', ')}. Rituals: ${rituals.join(', ')}. Self-added: ${extras.join(', ')||'nothing'}. Pattern: ${data.pattern}. 3-4 sentences, mention 2-3 specific things, nothing taken away, end with 1 action for today.`,fr:`Vous êtes un coach diabète chaleureux. Rédigez un message de bienvenue en français pour ${name}. Profil: apprécie: ${enjoy.join(', ')}. Rituels: ${rituals.join(', ')}. Ajouté soi-même: ${extras.join(', ')||'rien'}. Schéma: ${data.pattern}. 3-4 phrases, 2-3 éléments concrets, rien supprimé, 1 action pour aujourd'hui.`,de:`Du bist ein warmer Gesundheits-Coach. Schreibe ein persönliches Willkommen auf Deutsch für ${name}. Profil: genießt: ${enjoy.join(', ')}. Rituale: ${rituals.join(', ')}. Selbst hinzugefügt: ${extras.join(', ')||'nichts'}. Muster: ${data.pattern}. 3-4 Sätze, 2-3 konkrete Dinge, nichts weggenommen, 1 Aktion für heute.`}
  return L[lang]||L.nl
}

function coachDailyPrompt(profile,lang,done,total){
  const enjoy=(profile.enjoy||[]).slice(0,3).join(', ')
  const taskCtx=done===0?'heeft nog geen taken gedaan vandaag':done===total?`heeft alle ${total} taken gedaan — perfect!`:`heeft ${done} van ${total} taken gedaan`
  const taskCtxEn=done===0?'has not completed any tasks yet today':done===total?`completed all ${total} tasks — perfect!`:`completed ${done} of ${total} tasks`
  const taskCtxFr=done===0?'n\'a encore complété aucune tâche aujourd\'hui':done===total?`a complété toutes les ${total} tâches — parfait!`:`a complété ${done} sur ${total} tâches`
  const taskCtxDe=done===0?'hat heute noch keine Aufgaben erledigt':done===total?`alle ${total} Aufgaben erledigt — perfekt!`:`${done} von ${total} Aufgaben erledigt`
  const L={
    nl:`Je bent Ludwig Health, een warme persoonlijke coach voor mensen die van het goede leven houden. Schrijf een persoonlijke dagelijkse boodschap in het Nederlands voor ${profile.first_name}. ${profile.first_name} ${taskCtx}. Streak: ${profile.streak||0} dagen. Patroon: ${profile.fasting_pattern}. Geniet van: ${enjoy||'lekker eten en leven'}. Wees eerlijk en contextueel — geen generieke aanmoediging als er nog niets gedaan is. Max 2 zinnen, eindig met 1 concrete actie voor nu.`,
    en:`You are Ludwig Health, a warm personal coach for people who enjoy the good life. Write a personal daily message in English for ${profile.first_name}. ${profile.first_name} ${taskCtxEn}. Streak: ${profile.streak||0} days. Pattern: ${profile.fasting_pattern}. Enjoys: ${enjoy||'good food and life'}. Be honest and contextual — no generic encouragement if nothing done yet. Max 2 sentences, end with 1 concrete action for now.`,
    fr:`Vous êtes Ludwig Health, un coach chaleureux pour les personnes qui aiment la belle vie. Rédigez un message quotidien en français pour ${profile.first_name}. ${profile.first_name} ${taskCtxFr}. Série: ${profile.streak||0} jours. Schéma: ${profile.fasting_pattern}. Apprécie: ${enjoy||'la bonne vie'}. Soyez honnête et contextuel. Max 2 phrases, 1 action concrète.`,
    de:`Du bist Ludwig Health, ein warmer persönlicher Coach für Menschen die das gute Leben genießen. Schreibe eine tägliche Nachricht auf Deutsch für ${profile.first_name}. ${profile.first_name} hat ${taskCtxDe}. Streak: ${profile.streak||0} Tage. Muster: ${profile.fasting_pattern}. Genießt: ${enjoy||'gutes Essen und Leben'}. Sei ehrlich und kontextuell. Max 2 Sätze, 1 konkrete Aktion.`,
  }
  return L[lang]||L.nl
}

function coachSystemPrompt(profile,lang){
  const enjoy=(profile.enjoy||[]).slice(0,5).join(', ')
  const L={
    nl:`Je bent Ludwig Health, een warme persoonlijke gezondheidscoach. Je begeleidt ${profile.first_name}, die geniet van: ${enjoy||'lekker leven'}. Ze volgen het ${profile.fasting_pattern} eetpatroon. Jouw filosofie: geniet van het leven en voel je beter — geen verboden, geen diëten, alleen slimme keuzes. Antwoord altijd in het Nederlands. Wees warm, concreet en kort (max 3 zinnen per antwoord).`,
    en:`You are Ludwig Health, a warm personal health coach. You guide ${profile.first_name}, who enjoys: ${enjoy||'good living'}. They follow the ${profile.fasting_pattern} eating pattern. Your philosophy: enjoy life and feel better — no restrictions, no diets, only smart choices. Always reply in English. Be warm, concrete and brief (max 3 sentences).`,
    fr:`Vous êtes Ludwig Health, un coach de santé personnel chaleureux. Vous guidez ${profile.first_name}, qui apprécie: ${enjoy||'la belle vie'}. Ils suivent le schéma alimentaire ${profile.fasting_pattern}. Votre philosophie: profiter de la vie et se sentir mieux. Répondez toujours en français. Soyez chaleureux, concret et bref (3 phrases max).`,
    de:`Du bist Ludwig Health, ein warmer persönlicher Gesundheitscoach. Du begleitest ${profile.first_name}, der/die genießt: ${enjoy||'gutes Leben'}. Sie folgen dem ${profile.fasting_pattern} Essmuster. Deine Philosophie: das Leben genießen und sich besser fühlen. Antworte immer auf Deutsch. Sei warm, konkret und kurz (max 3 Sätze).`,
  }
  return L[lang]||L.nl
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI ATOMS
// ═══════════════════════════════════════════════════════════════
function LangSwitcher({lang,setLang}){
  const[open,setOpen]=useState(false)
  return(<div style={{position:'relative'}}>
    <button onClick={()=>setOpen(o=>!o)} style={{padding:'6px 12px',borderRadius:'20px',background:C.card,border:`1px solid ${C.cardBorder}`,color:C.text,fontSize:'13px',cursor:'pointer',fontFamily:FB,display:'flex',alignItems:'center',gap:'4px'}}>
      {LANGS[lang]} <span style={{fontSize:'9px',opacity:0.5}}>▼</span>
    </button>
    {open&&<div style={{position:'absolute',top:'calc(100% + 6px)',right:0,background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:'12px',overflow:'hidden',zIndex:50,minWidth:'120px',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
      {Object.entries(LANGS).map(([code,label])=>(<button key={code} onClick={()=>{setLang(code);setOpen(false)}} style={{display:'block',width:'100%',padding:'10px 16px',background:lang===code?C.accentGlow:'none',border:'none',color:lang===code?C.accent:C.text,fontSize:'13px',fontFamily:FB,cursor:'pointer',textAlign:'left',borderBottom:`1px solid ${C.muted}`}}>{label}</button>))}
    </div>}
  </div>)
}

function TagInput({value,onChange,placeholder,suggestions=[],addLabel='Add'}){
  const[input,setInput]=useState('');const[show,setShow]=useState(false);const ref=useRef(null)
  const filtered=suggestions.filter(s=>input.length>0&&s.toLowerCase().includes(input.toLowerCase())&&!value.includes(s)).slice(0,4)
  const add=(tag)=>{const c=tag.trim();if(c&&!value.includes(c))onChange([...value,c]);setInput('');setShow(false);ref.current?.focus()}
  const remove=(tag)=>onChange(value.filter(t=>t!==tag))
  return(<div style={{position:'relative'}}>
    {value.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'10px'}}>{value.map(tag=>(<span key={tag} style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'5px 10px 5px 12px',background:C.accentGlow,border:`1px solid ${C.accentDim}`,borderRadius:'20px',color:C.accent,fontSize:'13px',fontFamily:FB}}>{tag}<button onClick={()=>remove(tag)} style={{background:'none',border:'none',color:C.accent,cursor:'pointer',padding:'0',fontSize:'15px',lineHeight:1,opacity:0.7}}>×</button></span>))}</div>}
    <div style={{display:'flex',gap:'8px'}}>
      <div style={{flex:1,display:'flex',alignItems:'center',background:C.card,border:`1.5px solid ${C.cardBorder}`,borderRadius:'12px',padding:'0 14px'}}>
        <input ref={ref} value={input} onChange={e=>{setInput(e.target.value);setShow(true)}} onKeyDown={e=>{if(e.key==='Enter'&&input.trim()){e.preventDefault();add(input)}if(e.key==='Backspace'&&!input&&value.length>0)remove(value[value.length-1])}} onFocus={()=>setShow(true)} onBlur={()=>setTimeout(()=>setShow(false),150)} placeholder={placeholder} style={{background:'none',border:'none',outline:'none',color:C.text,fontSize:'14px',fontFamily:FB,width:'100%',padding:'13px 0'}}/>
      </div>
      <button onClick={()=>input.trim()&&add(input)} disabled={!input.trim()} style={{padding:'0 18px',borderRadius:'12px',background:input.trim()?`linear-gradient(135deg,${C.accentDim},${C.accent})`:C.muted,border:'none',cursor:input.trim()?'pointer':'default',color:input.trim()?'#fff':C.textDim,fontSize:'13px',fontWeight:'700',fontFamily:FB,transition:'all 0.2s',whiteSpace:'nowrap',boxShadow:input.trim()?`0 2px 12px ${C.accentGlow}`:'none'}}>+ {addLabel}</button>
    </div>
    {show&&filtered.length>0&&<div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:'12px',overflow:'hidden',zIndex:30,boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
      {filtered.map(s=><button key={s} onMouseDown={()=>add(s)} style={{display:'block',width:'100%',padding:'11px 14px',background:'none',border:'none',borderBottom:`1px solid ${C.muted}`,color:C.text,fontSize:'13px',fontFamily:FB,cursor:'pointer',textAlign:'left'}} onMouseEnter={e=>e.currentTarget.style.background=C.accentGlow} onMouseLeave={e=>e.currentTarget.style.background='none'}>+ {s}</button>)}
    </div>}
  </div>)
}

function MultiSelect({options,selected,onToggle,lang}){
  return(<div style={{display:'flex',flexWrap:'wrap',gap:'9px'}}>
    {options.map(opt=>{const on=selected.includes(opt.id);return(
      <button key={opt.id} onClick={()=>onToggle(opt.id)} style={{display:'flex',alignItems:'center',gap:'7px',padding:'9px 14px',borderRadius:'24px',background:on?C.accentGlow:C.pill,border:`1.5px solid ${on?C.accent:C.cardBorder}`,color:on?C.accent:C.text,fontSize:'13px',cursor:'pointer',fontFamily:FB,transition:'all 0.18s'}}>
        <span style={{fontSize:'15px'}}>{opt.icon}</span>{opt[lang]||opt.nl}{on&&<span style={{fontSize:'11px'}}>✓</span>}
      </button>
    )})}
  </div>)
}

const PriBtn=({children,onClick,disabled,style={}})=>(
  <button onClick={onClick} disabled={disabled} style={{width:'100%',padding:'17px',background:disabled?C.muted:`linear-gradient(135deg,${C.accentDim},${C.accent})`,border:'none',borderRadius:'14px',color:disabled?C.textDim:'#fff',fontSize:'15px',fontWeight:'700',cursor:disabled?'default':'pointer',fontFamily:FB,transition:'all 0.2s',boxShadow:disabled?'none':`0 4px 24px ${C.accentGlow}`,...style}}>{children}</button>
)
const CardBtn=({onClick,selected,icon,label,desc})=>(
  <button onClick={onClick} style={{width:'100%',padding:'15px 16px',borderRadius:'14px',display:'flex',alignItems:'center',gap:'12px',background:selected?C.accentGlow:C.card,border:`1.5px solid ${selected?C.accent:C.cardBorder}`,cursor:'pointer',fontFamily:FB,transition:'all 0.2s',marginBottom:'10px'}}>
    <span style={{fontSize:'20px'}}>{icon}</span>
    <div style={{flex:1,textAlign:'left'}}><div style={{color:C.text,fontSize:'14px',fontWeight:'600',fontFamily:FB}}>{label}</div>{desc&&<div style={{color:C.textDim,fontSize:'12px',marginTop:'2px',fontFamily:FB}}>{desc}</div>}</div>
    {selected&&<span style={{color:C.accent}}>✓</span>}
  </button>
)
const ProgBar=({step,total,t})=>(
  <div><div style={{display:'flex',gap:'5px',marginBottom:'6px'}}>{Array.from({length:total}).map((_,i)=><div key={i} style={{flex:1,height:'3px',borderRadius:'2px',background:i<=step?C.accent:C.muted,transition:'background 0.4s',boxShadow:i===step?`0 0 6px ${C.accent}`:'none'}}/>)}</div><span style={{color:C.textDim,fontSize:'11px',fontFamily:FB}}>{t.step} {step+1} {t.of} {total}</span></div>
)
const Lbl=({c})=><div style={{color:C.accent,fontSize:'11px',fontFamily:FB,letterSpacing:'2px',textTransform:'uppercase',marginBottom:'6px'}}>{c}</div>
const Heading=({c,s})=><h2 style={{fontFamily:FD,fontSize:'30px',color:C.text,lineHeight:1.15,marginBottom:'8px',...s}}>{c}</h2>
const Sub=({c})=><p style={{color:C.textDim,fontSize:'14px',fontFamily:FB,lineHeight:1.65,marginBottom:'18px'}}>{c}</p>
const SecLbl=({c})=><div style={{color:C.textDim,fontSize:'11px',fontFamily:FB,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'10px'}}>{c}</div>
const CustBox=({children})=><div style={{background:'rgba(96,165,250,0.04)',border:`1.5px dashed ${C.accentDim}`,borderRadius:'16px',padding:'16px',marginTop:'20px'}}>{children}</div>
const profileTagStyle={padding:'5px 12px',borderRadius:'20px',border:`1px solid ${C.accentDim}`,color:C.accent,background:C.accentGlow,fontSize:'12px',fontFamily:FB}

// ═══════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════
function AuthScreen({lang,setLang,onGuest}){
  const t=T[lang]||T.nl
  const[email,setEmail]=useState('')
  const[sent,setSent]=useState(false)
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState(null)

  const handleMagicLink=async()=>{
    if(!email.trim())return
    setLoading(true);setError(null)
    const{error}=await signInWithEmail(email)
    if(error)setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'40px 24px',animation:'fadeUp 0.5s ease'}}>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'32px'}}><LangSwitcher lang={lang} setLang={setLang}/></div>
      <div style={{marginBottom:'20px'}}><LHLogo size={64}/></div>
      <h1 style={{fontFamily:FD,fontSize:'42px',color:C.text,lineHeight:1,marginBottom:'8px'}}>Ludwig <span style={{color:C.accent}}>Health</span></h1>
      <p style={{color:C.textDim,fontSize:'15px',fontFamily:FB,lineHeight:1.6,marginBottom:'32px'}}>{t.appTagline}</p>

      {!sent?(
        <>
          <p style={{color:C.text,fontSize:'14px',fontWeight:'600',fontFamily:FB,marginBottom:'10px'}}>{t.signIn}</p>
          <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleMagicLink()} placeholder={t.emailPlaceholder} type="email" style={{flex:1,padding:'14px 16px',background:C.card,border:`1.5px solid ${C.cardBorder}`,borderRadius:'12px',color:C.text,fontSize:'14px',fontFamily:FB,outline:'none'}}/>
          </div>
          <PriBtn onClick={handleMagicLink} disabled={loading||!email.trim()} style={{marginBottom:'12px'}}>{loading?'...' :t.sendLink}</PriBtn>
          {error&&<p style={{color:C.bad,fontSize:'12px',fontFamily:FB,marginBottom:'12px'}}>{error}</p>}
          <div style={{textAlign:'center',color:C.textDim,fontSize:'12px',fontFamily:FB,marginBottom:'12px'}}>{t.orContinueWith}</div>
          <button onClick={onGuest} style={{width:'100%',padding:'14px',background:'transparent',border:`1px solid ${C.cardBorder}`,borderRadius:'14px',color:C.textDim,fontSize:'14px',cursor:'pointer',fontFamily:FB}}>{t.guestMode}</button>
        </>
      ):(
        <div style={{background:C.accentGlow,border:`1px solid ${C.accentDim}`,borderRadius:'16px',padding:'20px',textAlign:'center'}}>
          <div style={{fontSize:'36px',marginBottom:'8px'}}>📬</div>
          <h3 style={{color:C.text,fontFamily:FD,fontSize:'22px',marginBottom:'6px'}}>{t.checkEmail}</h3>
          <p style={{color:C.textDim,fontSize:'14px',fontFamily:FB}}>{t.checkEmailSub}</p>
          <p style={{color:C.accent,fontSize:'13px',fontFamily:FB,marginTop:'8px'}}>{email}</p>
          <div style={{marginTop:'20px',color:C.textDim,fontSize:'12px',fontFamily:FB}}>{t.orContinueWith}</div>
          <button onClick={onGuest} style={{marginTop:'10px',width:'100%',padding:'12px',background:'transparent',border:`1px solid ${C.cardBorder}`,borderRadius:'12px',color:C.textDim,fontSize:'13px',cursor:'pointer',fontFamily:FB}}>{t.guestMode}</button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function calcBMI(height,weight){
  const h=parseFloat(height),w=parseFloat(weight)
  if(!h||!w||h<100||w<20)return null
  return (w/((h/100)**2)).toFixed(1)
}

// ═══════════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════════
function Onboarding({lang,setLang,userId,onComplete}){
  const[step,setStep]=useState(0)
  const[anim,setAnim]=useState(true)
  const[data,setData]=useState({name:'',usesMedication:false,enjoy:[],customEnjoy:[],rituals:[],customRituals:[],miss:[],weakMoments:[],anythingElse:[],pattern:'16-8',height:'',weight:'',goalWeight:''})
  const[welcome,setWelcome]=useState('');const[streaming,setStreaming]=useState(false);const[profileReady,setProfileReady]=useState(false)
  const[saving,setSaving]=useState(false)
  const t=T[lang]||T.nl;const TOTAL=8
  const next=()=>{setAnim(false);setTimeout(()=>{setStep(s=>s+1);setAnim(true)},80)}
  const toggle=(field,id)=>setData(d=>({...d,[field]:d[field].includes(id)?d[field].filter(x=>x!==id):[...d[field],id]}))
  const[built,setBuilt]=useState(false)
  const inputSt={width:'100%',padding:'15px 18px',background:C.card,border:`1.5px solid ${C.cardBorder}`,borderRadius:'14px',color:C.text,fontSize:'18px',fontFamily:FB,outline:'none',marginBottom:'24px',transition:'all 0.2s'}

  if(step===7&&!built){
    setBuilt(true)
    ;(async()=>{
      setStreaming(true);setWelcome('')
      try{await streamAI(buildProfilePrompt(data.name,data,lang),setWelcome)}
      catch{setWelcome(`${data.name}, welkom bij Ludwig Health!`)}
      setStreaming(false)
      // Save to Supabase if logged in
      if(userId){
        setSaving(true)
        await saveOnboarding(userId,{...data,lang})
        setSaving(false)
      }
      setTimeout(()=>setProfileReady(true),400)
    })()
  }

  const TopRow=()=>(
    <div style={{padding:'28px 24px 8px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
      <ProgBar step={step-1} total={TOTAL} t={t}/>
      <LangSwitcher lang={lang} setLang={setLang}/>
    </div>
  )
  const Body=({children})=><div style={{flex:1,padding:'16px 24px 0',overflowY:'auto',animation:anim?'slideIn 0.3s ease':'none'}}>{children}<div style={{height:'24px'}}/></div>
  const Foot=({children})=><div style={{padding:'12px 24px 36px'}}>{children}</div>

  if(step===0)return(
    <div style={{flex:1,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'20px 24px 12px',display:'flex',justifyContent:'flex-end'}}><LangSwitcher lang={lang} setLang={setLang}/></div>
      <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 24px',animation:'fadeUp 0.6s ease'}}>
        <div style={{marginBottom:'20px'}}><LHLogo size={64}/></div>
        <h1 style={{fontFamily:FD,fontSize:'46px',color:C.text,lineHeight:1,marginBottom:'12px'}}>Ludwig <span style={{color:C.accent}}>Health</span></h1>
        <p style={{color:C.textDim,fontSize:'15px',fontFamily:FB,lineHeight:1.65,marginBottom:'32px'}}>{t.appTagline}</p>
        {t.splashFeatures.map(([icon,text],i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'14px',animation:`fadeUp 0.5s ease ${i*0.1+0.2}s both`}}>
            <span style={{width:'36px',height:'36px',borderRadius:'10px',background:C.accentGlow,border:`1px solid ${C.cardBorder}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>{icon}</span>
            <span style={{color:C.text,fontSize:'14px',fontFamily:FB}}>{text}</span>
          </div>
        ))}
      </div>
      <Foot><PriBtn onClick={next}>{t.startBtn}</PriBtn><p style={{color:C.textDim,fontSize:'11px',textAlign:'center',marginTop:'10px',fontFamily:FB}}>{t.splashSub}</p></Foot>
    </div>
  )

  if(step===1)return(<><TopRow/><Body><Lbl c={t.step1Label}/><Heading c={t.step1Title}/><Sub c={t.step1Sub}/><input value={data.name} onChange={e=>setData(d=>({...d,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&data.name.trim()&&next()} placeholder={t.namePlaceholder} autoFocus style={inputSt}/></Body><Foot><PriBtn onClick={next} disabled={!data.name.trim()}>{t.next}</PriBtn></Foot></>)

  if(step===2){
    const items=data.enjoy.map(id=>[...ENJOY_DATA.drinks,...ENJOY_DATA.food].find(o=>o.id===id)?.[lang]).filter(Boolean)
    return(<><TopRow/><Body><Lbl c={t.step2Label}/><Heading c={t.step2Title}/><Sub c={t.step2Sub}/><SecLbl c={t.drinksSec}/><MultiSelect options={ENJOY_DATA.drinks} selected={data.enjoy} onToggle={id=>toggle('enjoy',id)} lang={lang}/><div style={{marginTop:'18px'}}><SecLbl c={t.foodSec}/></div><MultiSelect options={ENJOY_DATA.food} selected={data.enjoy} onToggle={id=>toggle('enjoy',id)} lang={lang}/><CustBox><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}><span>✏️</span><span style={{color:C.accent,fontSize:'13px',fontWeight:'600',fontFamily:FB}}>{t.addOwn}</span></div><TagInput value={data.customEnjoy} onChange={v=>setData(d=>({...d,customEnjoy:v}))} placeholder={t.enjoyPlaceholder} suggestions={SUGG.enjoy[lang]||SUGG.enjoy.nl} addLabel={t.add}/></CustBox>{(items.length+data.customEnjoy.length)>0&&<div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:'12px',padding:'12px 14px',marginTop:'14px'}}><span style={{color:C.textDim,fontSize:'11px',fontFamily:FB}}>{t.yourProfile}</span><div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'8px'}}>{items.map((l,i)=><span key={i} style={profileTagStyle}>{l}</span>)}{data.customEnjoy.map((l,i)=><span key={`c${i}`} style={{...profileTagStyle,borderColor:C.gold,color:C.gold,background:C.goldGlow}}>✏️ {l}</span>)}</div></div>}</Body><Foot><PriBtn onClick={next} disabled={data.enjoy.length+data.customEnjoy.length===0}>{t.step2Btn(data.enjoy.length+data.customEnjoy.length)}</PriBtn></Foot></>)
  }

  if(step===3){
    const items=data.rituals.map(id=>RITUAL_DATA.find(o=>o.id===id)?.[lang]).filter(Boolean)
    return(<><TopRow/><Body><Lbl c={t.step3Label}/><Heading c={t.step3Title}/><Sub c={t.step3Sub}/><MultiSelect options={RITUAL_DATA} selected={data.rituals} onToggle={id=>toggle('rituals',id)} lang={lang}/><CustBox><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}><span>✏️</span><span style={{color:C.accent,fontSize:'13px',fontWeight:'600',fontFamily:FB}}>{t.addRitual}</span></div><TagInput value={data.customRituals} onChange={v=>setData(d=>({...d,customRituals:v}))} placeholder={t.ritualPlaceholder} suggestions={SUGG.ritual[lang]||SUGG.ritual.nl} addLabel={t.add}/></CustBox>{(items.length+data.customRituals.length)>0&&<div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:'12px',padding:'12px 14px',marginTop:'14px'}}><span style={{color:C.textDim,fontSize:'11px',fontFamily:FB}}>{t.yourProfile}</span><div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'8px'}}>{items.map((l,i)=><span key={i} style={profileTagStyle}>{l}</span>)}{data.customRituals.map((l,i)=><span key={`c${i}`} style={{...profileTagStyle,borderColor:C.gold,color:C.gold,background:C.goldGlow}}>✏️ {l}</span>)}</div></div>}</Body><Foot><PriBtn onClick={next} disabled={data.rituals.length+data.customRituals.length===0}>{t.step3Btn(data.rituals.length+data.customRituals.length)}</PriBtn></Foot></>)
  }

  if(step===4)return(<><TopRow/><Body><Lbl c={t.step4Label}/><Heading c={t.step4Title}/><Sub c={t.step4Sub}/><MultiSelect options={MISS_DATA} selected={data.miss} onToggle={id=>toggle('miss',id)} lang={lang}/></Body><Foot><PriBtn onClick={next} disabled={data.miss.length===0}>{t.next}</PriBtn></Foot></>)

  if(step===5)return(<><TopRow/><Body><Lbl c={t.step5Label}/><Heading c={t.step5Title}/><Sub c={t.step5Sub}/><MultiSelect options={WEAK_DATA} selected={data.weakMoments} onToggle={id=>toggle('weakMoments',id)} lang={lang}/><div style={{marginTop:'28px'}}><SecLbl c={t.patternSec}/></div>{PATTERN_DATA.map(p=><div key={p.id} style={{position:'relative'}}>{p.recommended&&<span style={{position:'absolute',top:'12px',right:'12px',background:C.gold,color:'#000',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',zIndex:1}}>{t.recommended}</span>}<CardBtn onClick={()=>setData(d=>({...d,pattern:p.id}))} selected={data.pattern===p.id} icon={p.icon} label={`${p.id} — ${p.desc[lang]||p.desc.nl}`} desc={p.detail[lang]||p.detail.nl}/></div>)}</Body><Foot><PriBtn onClick={next} disabled={data.weakMoments.length===0}>{t.next}</PriBtn></Foot></>)

  if(step===6){
    const bmi=calcBMI(data.height,data.weight)
    const numSt={width:'100%',padding:'13px 16px',background:C.card,border:`1.5px solid ${C.cardBorder}`,borderRadius:'12px',color:C.text,fontSize:'16px',fontFamily:FB,outline:'none',marginBottom:'12px'}
    return(<><TopRow/><Body>
      <Lbl c={t.step6Label}/><Heading c={t.step6Title}/><Sub c={t.step6Sub}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'4px'}}>
        <div><div style={{color:C.textDim,fontSize:'11px',fontFamily:FB,marginBottom:'5px'}}>{t.heightLabel}</div><input type="number" value={data.height} onChange={e=>setData(d=>({...d,height:e.target.value}))} placeholder={t.heightPh||'178'} style={numSt}/></div>
        <div><div style={{color:C.textDim,fontSize:'11px',fontFamily:FB,marginBottom:'5px'}}>{t.weightLabel}</div><input type="number" value={data.weight} onChange={e=>setData(d=>({...d,weight:e.target.value}))} placeholder={t.weightPh||'85'} style={numSt}/></div>
      </div>
      <div style={{marginBottom:'16px'}}><div style={{color:C.textDim,fontSize:'11px',fontFamily:FB,marginBottom:'5px'}}>{t.goalWeightLabel}</div><input type="number" value={data.goalWeight} onChange={e=>setData(d=>({...d,goalWeight:e.target.value}))} placeholder={t.goalWeightPh||'75'} style={{...numSt,marginBottom:0}}/></div>
      {bmi&&<div style={{background:C.accentGlow,border:`1px solid ${C.accentDim}`,borderRadius:'12px',padding:'12px 16px',marginBottom:'20px',display:'flex',alignItems:'center',gap:'12px'}}>
        <div style={{textAlign:'center',minWidth:'50px'}}><div style={{color:C.accent,fontSize:'22px',fontFamily:FD,fontWeight:'700'}}>{bmi}</div><div style={{color:C.textDim,fontSize:'10px',fontFamily:FB}}>{t.bmiLabel||'BMI'}</div></div>
        <div style={{height:'40px',width:'1px',background:C.cardBorder}}/>
        <div style={{flex:1}}><div style={{height:'6px',background:C.muted,borderRadius:'3px',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(((parseFloat(bmi)-15)/25)*100,100)}%`,background:`linear-gradient(90deg,${C.accent},${C.good})`,borderRadius:'3px'}}/></div><div style={{color:C.textDim,fontSize:'11px',fontFamily:FB,marginTop:'4px'}}>{parseFloat(bmi)<18.5?'Ondergewicht':parseFloat(bmi)<25?'Gezond gewicht':parseFloat(bmi)<30?'Overgewicht':'Obesitas'}</div></div>
      </div>}
      <div style={{borderTop:`1px solid ${C.muted}`,paddingTop:'20px',marginTop:'4px'}}>
        <Heading c={t.step6bTitle||'Nog iets anders?'} s={{fontSize:'20px'}}/>
        <Sub c={t.step6bSub||t.step6Sub}/>
        <div style={{background:C.accentGlow,border:`1px solid ${C.cardBorder}`,borderRadius:'14px',padding:'12px 14px',marginBottom:'14px'}}>{t.step6Examples.map((ex,i)=><div key={i} style={{color:C.textDim,fontSize:'12px',fontFamily:FB,marginBottom:'4px'}}>{ex}</div>)}</div>
        <TagInput value={data.anythingElse} onChange={v=>setData(d=>({...d,anythingElse:v}))} placeholder={t.extraPlaceholder} suggestions={SUGG.extra[lang]||SUGG.extra.nl} addLabel={t.add}/>
      </div>
    </Body><Foot><PriBtn onClick={next}>{t.step6Btn(data.anythingElse.length)}</PriBtn></Foot></>)
  }

  // Step 7 — Profile result
  const allPreset=[...data.enjoy.map(id=>[...ENJOY_DATA.drinks,...ENJOY_DATA.food].find(o=>o.id===id)?.[lang]),...data.rituals.map(id=>RITUAL_DATA.find(o=>o.id===id)?.[lang])].filter(Boolean)
  const allCustom=[...data.customEnjoy,...data.customRituals,...data.anythingElse]
  return(
    <div style={{flex:1,padding:'36px 24px 20px',overflowY:'auto',animation:'fadeUp 0.5s ease',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'20px'}}><LangSwitcher lang={lang} setLang={setLang}/></div>
      <div style={{marginBottom:'20px'}}><LHLogo size={68}/></div>
      <h2 style={{fontFamily:FD,fontSize:'36px',color:C.text,marginBottom:'6px'}}>{t.greeting(data.name)}</h2>
      <p style={{color:C.textDim,fontSize:'13px',fontFamily:FB,marginBottom:'24px'}}>{t.greetingSub}</p>
      <div style={{background:C.card,borderRadius:'20px',border:`1.5px solid ${C.accentDim}`,padding:'20px',marginBottom:'20px',boxShadow:`0 0 32px ${C.accentGlow}`}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
          <span style={{color:C.accent,fontSize:'11px',fontWeight:'700',fontFamily:FB,letterSpacing:'1.5px',textTransform:'uppercase'}}>{t.coachSays}</span>
          {streaming&&<span style={{display:'inline-flex',gap:'3px'}}>{[0,1,2].map(i=><span key={i} style={{width:'5px',height:'5px',borderRadius:'50%',background:C.accent,animation:`bounce 0.9s ease ${i*0.15}s infinite`,display:'inline-block'}}/>)}</span>}
        </div>
        {!welcome?<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>{[75,90,60,80].map((w,i)=><div key={i} style={{height:'13px',borderRadius:'6px',background:C.muted,width:`${w}%`,animation:`pulse 1.5s ease ${i*0.15}s infinite`}}/>)}</div>:<p style={{color:C.text,fontSize:'15px',lineHeight:'1.75',fontFamily:FB,margin:0}}>{welcome}</p>}
      </div>
      {(allPreset.length+allCustom.length)>0&&<div style={{marginBottom:'20px'}}><span style={{color:C.textDim,fontSize:'11px',fontFamily:FB,letterSpacing:'1px',textTransform:'uppercase'}}>{t.profileItems(allPreset.length+allCustom.length)}</span><div style={{display:'flex',flexWrap:'wrap',gap:'7px',marginTop:'10px'}}>{allPreset.map((item,i)=><span key={i} style={profileTagStyle}>{item}</span>)}{allCustom.map((item,i)=><span key={`c${i}`} style={{...profileTagStyle,borderColor:C.gold,color:C.gold,background:C.goldGlow}}>✏️ {item}</span>)}</div><p style={{color:C.textDim,fontSize:'11px',fontFamily:FB,marginTop:'8px'}}>{t.ownLabel}</p></div>}
      <div style={{background:C.card,borderRadius:'14px',border:`1px solid ${C.cardBorder}`,padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px',marginBottom:'32px'}}>
        <span style={{fontSize:'24px'}}>⏱</span>
        <div><div style={{color:C.text,fontSize:'14px',fontWeight:'600',fontFamily:FB}}>{t.patternLabel}: {data.pattern.toUpperCase()} {t.fastingLabel}</div><div style={{color:C.textDim,fontSize:'12px',fontFamily:FB}}>{PATTERN_DATA.find(p=>p.id===data.pattern)?.detail[lang]}</div></div>
      </div>
      {saving&&<p style={{color:C.textDim,fontSize:'12px',fontFamily:FB,textAlign:'center',marginBottom:'8px'}}>{t.saving}</p>}
      <PriBtn onClick={()=>onComplete({...data,lang})} disabled={!profileReady||saving}>{profileReady&&!saving?t.startApp(data.name):saving?t.saving:t.coachBusy}</PriBtn>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
function MainApp({profile,lang,setLang,userId,onSignOut}){
  const[tab,setTab]=useState('home')
  const[showScanner,setShowScanner]=useState(false)
  const[tasks,setTasks]=useState(TASK_DEFINITIONS.map(t=>({...t,done:false})))
  const[tasksLoaded,setTasksLoaded]=useState(false)
  const[scanHistory,setScanHistory]=useState([])
  const[weekLogs,setWeekLogs]=useState([])
  const t=T[lang]||T.nl
  const pattern=PATTERN_DATA.find(p=>p.id===(profile.fasting_pattern||profile.pattern||'16-8'))||PATTERN_DATA[1]
  const done=tasks.filter(tk=>tk.done).length
  const pct=Math.round((done/tasks.length)*100)

  // Load from Supabase if logged in, else use defaults
  useEffect(()=>{
    if(!userId){setTasksLoaded(true);return}
    loadTodayTasks(userId).then(({tasks:loaded})=>{setTasks(loaded);setTasksLoaded(true)})
    loadScanHistory(userId,5).then(({scans})=>setScanHistory(scans))
    loadWeekLogs(userId).then(({logs})=>setWeekLogs(logs))
  },[userId])

  const handleToggle=async(taskKey)=>{
    const task=tasks.find(tk=>tk.key===taskKey)
    if(!task)return
    // Optimistic
    setTasks(prev=>prev.map(tk=>tk.key===taskKey?{...tk,done:!tk.done}:tk))
    if(userId){
      const{error}=await toggleTask(userId,taskKey,task.done,task.xp)
      if(error)setTasks(prev=>prev.map(tk=>tk.key===taskKey?{...tk,done:task.done}:tk))
    }
  }

  const handleScanSaved=(scan)=>{
    setScanHistory(prev=>[scan,...prev].slice(0,5))
  }

  if(showScanner)return(<Scanner lang={lang} t={t} userId={userId} onBack={()=>setShowScanner(false)} onScanSaved={handleScanSaved}/>)

  const tabs=[{id:'home',icon:'🏠',label:t.tabToday},{id:'scan',icon:'📷',label:t.tabScan},{id:'goals',icon:'🎯',label:t.tabGoals||'Doelen'},{id:'coach',icon:'💬',label:t.tabCoach}]

  // Week stats
  const weekFasting=weekLogs.filter(l=>l.fasting_kept).length
  const weekMovement=weekLogs.filter(l=>l.movement_minutes>=20).length
  const glucoseValues=weekLogs.filter(l=>l.glucose_morning).map(l=>l.glucose_morning)
  const avgGlucose=glucoseValues.length?( glucoseValues.reduce((a,b)=>a+b,0)/glucoseValues.length).toFixed(1):null

  return(
    <div style={{paddingBottom:'80px'}}>
      {/* Header */}
      <div style={{padding:'24px 20px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <div>
            <div style={{color:C.textDim,fontSize:'11px',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'3px',fontFamily:FB}}>
              {new Date().toLocaleDateString(lang==='nl'?'nl-NL':lang==='fr'?'fr-FR':lang==='de'?'de-DE':'en-GB',{weekday:'long',day:'numeric',month:'long'})}
            </div>
            <h1 style={{fontFamily:FD,fontSize:'28px',color:C.text,lineHeight:1}}>{t.goodMorning(profile.first_name||profile.name)}</h1>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px'}}>
            <LangSwitcher lang={lang} setLang={setLang}/>
            <div style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',borderRadius:'20px',background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.3)'}}>
              <span style={{fontSize:'13px'}}>🔥</span><span style={{color:C.gold,fontSize:'12px',fontWeight:'700',fontFamily:FB}}>{profile.streak||0} {t.streak}</span>
            </div>
          </div>
        </div>
        {/* Progress ring */}
        <div style={{background:C.card,borderRadius:'16px',border:`1px solid ${C.cardBorder}`,padding:'14px 16px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'14px'}}>
          <svg width="50" height="50" style={{flexShrink:0}}>
            <circle cx="25" cy="25" r="20" fill="none" stroke={C.muted} strokeWidth="5"/>
            <circle cx="25" cy="25" r="20" fill="none" stroke={C.accent} strokeWidth="5" strokeDasharray={`${2*Math.PI*20}`} strokeDashoffset={`${2*Math.PI*20*(1-pct/100)}`} strokeLinecap="round" transform="rotate(-90 25 25)" style={{transition:'stroke-dashoffset 0.8s ease',filter:`drop-shadow(0 0 4px ${C.accent})`}}/>
            <text x="25" y="30" textAnchor="middle" fill={C.accent} fontSize="12" fontFamily={FB} fontWeight="700">{pct}%</text>
          </svg>
          <div style={{flex:1}}>
            <div style={{color:C.text,fontSize:'14px',fontWeight:'600',fontFamily:FB}}>{done===tasks.length?'🎉':t.tasksOf(done,tasks.length)}</div>
            <div style={{color:C.textDim,fontSize:'12px',fontFamily:FB,marginTop:'2px'}}>{pattern.id.toUpperCase()} · {pattern.eatStart}:00–{pattern.eatEnd}:00</div>
          </div>
          <button onClick={()=>setShowScanner(true)} style={{width:'40px',height:'40px',borderRadius:'12px',background:`linear-gradient(135deg,${C.accentDim},${C.accent})`,border:'none',cursor:'pointer',fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 16px ${C.accentGlow}`}}>📷</button>
        </div>
      </div>

      <div style={{padding:'0 20px',animation:'fadeUp 0.3s ease'}}>
        {tab==='home'&&<HomeTab tasks={tasks} toggleTask={handleToggle} pattern={pattern} lang={lang} t={t} setShowScanner={setShowScanner} scanHistory={scanHistory} profile={profile}/>}
        {tab==='scan'&&<Scanner lang={lang} t={t} userId={userId} onBack={()=>setTab('home')} onScanSaved={handleScanSaved}/>}
        {tab==='goals'&&<GoalsTab pattern={pattern} lang={lang} t={t} profile={profile}/>}
        {tab==='coach'&&<CoachTab profile={profile} lang={lang} t={t} done={done} total={tasks.length} weekFasting={weekFasting} weekMovement={weekMovement} weekLogs={weekLogs}/>}
      </div>

      {/* Bottom nav */}
      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:'430px',background:`${C.surface}ee`,backdropFilter:'blur(16px)',borderTop:`1px solid ${C.cardBorder}`,display:'flex',padding:'8px 8px 10px',zIndex:50}}>
        {tabs.map(tb=>(
          <button key={tb.id} onClick={()=>tb.id==='scan'?setShowScanner(true):setTab(tb.id)} style={{flex:1,padding:'8px 4px',background:tab===tb.id?C.accentGlow:'transparent',border:'none',cursor:'pointer',borderRadius:'12px',transition:'all 0.2s',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px'}}>
            <span style={{fontSize:'20px'}}>{tb.icon}</span>
            <span style={{fontSize:'10px',fontFamily:FB,color:tab===tb.id?C.accent:C.textDim,fontWeight:tab===tb.id?'600':'400'}}>{tb.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── HOME TAB ─────────────────────────────────────────────────────
function HomeTab({tasks,toggleTask,pattern,lang,t,setShowScanner,scanHistory,profile}){
  const[now,setNow]=useState(new Date())
  useEffect(()=>{const i=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(i)},[])
  const h=now.getHours()+now.getMinutes()/60
  const inWin=h>=pattern.eatStart&&h<pattern.eatEnd
  const timeLeft=inWin?`${t.windowCloses} ${Math.floor(pattern.eatEnd-h)}u${Math.round(((pattern.eatEnd-h)%1)*60)}m`:`${t.windowOpens} ${pattern.eatStart}:00`
  const eatPct=((pattern.eatStart-5)/19)*100;const eatW=((pattern.eatEnd-pattern.eatStart)/19)*100;const nowPct=Math.min(Math.max(((h-5)/19)*100,1),99)
  return(<>
    <div style={{background:C.card,borderRadius:'16px',border:`1px solid ${inWin?C.accentDim:C.cardBorder}`,padding:'14px 16px',marginBottom:'14px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}>
        <span style={{color:C.text,fontSize:'14px',fontWeight:'600',fontFamily:FB}}>{inWin?t.windowOpen:t.windowClosed}</span>
        <span style={{color:inWin?C.accent:C.warn,fontSize:'12px',fontFamily:FB,fontWeight:'600'}}>{timeLeft}</span>
      </div>
      <div style={{position:'relative',height:'10px',background:C.muted,borderRadius:'5px'}}>
        <div style={{position:'absolute',top:0,bottom:0,left:`${eatPct}%`,width:`${eatW}%`,background:`linear-gradient(90deg,${C.accentDim},${C.accent})`,borderRadius:'5px',boxShadow:`0 0 8px ${C.accent}`}}/>
        <div style={{position:'absolute',top:'50%',transform:'translate(-50%,-50%)',left:`${nowPct}%`,width:'14px',height:'14px',borderRadius:'50%',background:inWin?C.accent:C.warn,boxShadow:`0 0 8px ${inWin?C.accent:C.warn}`,zIndex:2,transition:'left 0.5s'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:'6px'}}><span style={{color:C.textDim,fontSize:'10px'}}>05:00</span><span style={{color:C.accent,fontSize:'10px'}}>{pattern.eatStart}:00–{pattern.eatEnd}:00</span><span style={{color:C.textDim,fontSize:'10px'}}>00:00</span></div>
    </div>
    <button onClick={()=>setShowScanner(true)} style={{width:'100%',padding:'14px 16px',background:'rgba(96,165,250,0.06)',border:`1px dashed ${C.accentDim}`,borderRadius:'14px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px',fontFamily:FB}}>
      <span style={{fontSize:'26px'}}>📷</span>
      <div style={{textAlign:'left'}}><div style={{color:C.accent,fontSize:'14px',fontWeight:'600'}}>{t.scanCta}</div><div style={{color:C.textDim,fontSize:'12px'}}>{t.scanCtaSub}</div></div>
      <span style={{color:C.accent,marginLeft:'auto',fontSize:'18px'}}>→</span>
    </button>
    {profile?.weight&&profile?.goal_weight&&(()=>{
      const cur=parseFloat(profile.weight),goal=parseFloat(profile.goal_weight)
      const diff=cur-goal,pct=Math.max(0,Math.min(100,((cur-goal)/(cur-goal+0.001))*100))
      const lost=Math.max(0,(parseFloat(profile.start_weight||cur)-cur))
      return(
        <div style={{background:C.card,borderRadius:'16px',border:`1px solid ${C.cardBorder}`,padding:'14px 16px',marginBottom:'14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}>
            <span style={{color:C.text,fontSize:'14px',fontWeight:'600',fontFamily:FB}}>{t.weightWidget||'Gewichtsdoel'}</span>
            <span style={{color:diff>0?C.warn:C.good,fontSize:'12px',fontFamily:FB}}>{diff>0?`${diff.toFixed(1)}kg ${t.weightTo||'nog'}`:t.weightGoal||'Doel bereikt! 🎉'}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
            <span style={{color:C.textDim,fontSize:'12px',fontFamily:FB}}>{t.weightCurrent||'Huidig'}: <b style={{color:C.text}}>{cur}kg</b></span>
            <span style={{color:C.textDim,fontSize:'12px',fontFamily:FB}}>{t.weightGoal||'Doel'}: <b style={{color:C.accent}}>{goal}kg</b></span>
          </div>
          <div style={{height:'6px',background:C.muted,borderRadius:'3px',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${diff<=0?100:50}%`,background:`linear-gradient(90deg,${C.accentDim},${C.good})`,borderRadius:'3px',transition:'width 0.8s ease'}}/>
          </div>
        </div>
      )
    })()}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
      <h3 style={{fontFamily:FD,color:C.text,fontSize:'20px'}}>{t.todayTasks}</h3>
      <span style={{color:C.textDim,fontSize:'12px',fontFamily:FB}}>{tasks.filter(tk=>tk.done).length}/{tasks.length}</span>
    </div>
    {tasks.map(task=>(
      <div key={task.key||task.id} onClick={()=>toggleTask(task.key||task.id)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 14px',background:task.done?C.accentGlow:C.card,borderRadius:'12px',marginBottom:'8px',border:`1px solid ${task.done?C.accentDim:C.cardBorder}`,cursor:'pointer',transition:'all 0.25s'}}>
        <div style={{width:'22px',height:'22px',borderRadius:'50%',flexShrink:0,border:`2px solid ${task.done?C.accent:C.textDim}`,background:task.done?C.accent:'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>
          {task.done&&<span style={{color:'#000',fontSize:'11px',fontWeight:'700'}}>✓</span>}
        </div>
        <span style={{fontSize:'17px'}}>{task.icon}</span>
        <div style={{flex:1}}>
          <div style={{color:task.done?C.textDim:C.text,fontSize:'13px',fontFamily:FB,textDecoration:task.done?'line-through':'none'}}>{task[lang]||task.nl}</div>
          <div style={{color:C.textDim,fontSize:'11px'}}>{task.time}</div>
        </div>
        {!task.done&&<span style={{color:C.accent,fontSize:'11px',fontFamily:FB,background:C.accentGlow,padding:'2px 7px',borderRadius:'10px'}}>+{task.xp} XP</span>}
      </div>
    ))}
    {scanHistory.length>0&&(<>
      <h3 style={{fontFamily:FD,color:C.text,fontSize:'20px',marginTop:'20px',marginBottom:'10px'}}>{t.recentScans}</h3>
      {scanHistory.slice(0,3).map((s,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'11px 14px',background:C.card,borderRadius:'12px',marginBottom:'8px',border:`1px solid ${C.cardBorder}`}}>
          <span style={{fontSize:'20px'}}>{s.verdict==='good'?'🟢':s.verdict==='maybe'?'🟡':'🔴'}</span>
          <div style={{flex:1}}><div style={{color:C.text,fontSize:'13px',fontFamily:FB}}>{s.product_name}</div><div style={{color:C.textDim,fontSize:'11px'}}>{new Date(s.scanned_at).toLocaleDateString(lang==='nl'?'nl-NL':'en-GB')}</div></div>
          <span style={{color:s.verdict==='good'?C.good:s.verdict==='maybe'?C.gold:C.bad,fontSize:'13px',fontFamily:FB,fontWeight:'600'}}>{s.impact_score}/10</span>
        </div>
      ))}
    </>)}
  </>)
}

// ─── GOALS TAB ────────────────────────────────────────────────────
function GoalsTab({pattern,lang,t,profile}){
  const movements=[
    {time:'07:30',icon:'🌅',nl:'Ochtendwandeling',en:'Morning walk',fr:'Marche matinale',de:'Morgendlicher Spaziergang',dur:'15 min',tip:{nl:'Verlaagt nuchtere bloedsuiker',en:'Lowers fasting blood sugar',fr:'Réduit la glycémie à jeun',de:'Senkt nüchternen Blutzucker'}},
    {time:'13:00',icon:'🚶',nl:'Na-lunch wandeling',en:'Post-lunch walk',fr:'Marche après déjeuner',de:'Spaziergang nach dem Mittagessen',dur:'10 min',tip:{nl:'-20% glucose piek',en:'-20% glucose spike',fr:'-20% pic de glycémie',de:'-20% Blutzuckerspitze'}},
    {time:'16:00',icon:'🏃',nl:'Bewegingsblok',en:'Movement block',fr:'Bloc de mouvement',de:'Bewegungsblock',dur:'20 min',tip:{nl:'Beste window voor training',en:'Best window for exercise',fr:'Meilleure fenêtre d\'exercice',de:'Bestes Trainingsfenster'}},
    {time:'18:30',icon:'🌇',nl:'Avondwandeling',en:'Evening walk',fr:'Promenade du soir',de:'Abendspaziergang',dur:'15 min',tip:{nl:'Sluit eetvenster goed af',en:'Closes eating window well',fr:'Clôture bien la fenêtre',de:'Schließt das Essensfenster'}},
  ]
  const cur=profile?.weight?parseFloat(profile.weight):null
  const goal=profile?.goal_weight?parseFloat(profile.goal_weight):null
  const bmi=calcBMI(profile?.height,profile?.weight)
  const MILESTONES=[{kg:2,label:'-2kg'},{kg:5,label:'-5kg'},{kg:10,label:'-10kg'},{kg:15,label:'-15kg'}]
  return(<>
    <h3 style={{fontFamily:FD,color:C.text,fontSize:'22px',marginBottom:'14px'}}>{t.goalsTitle||'Doelen'}</h3>
    {cur&&goal&&<div style={{background:C.card,borderRadius:'16px',border:`1px solid ${C.cardBorder}`,padding:'16px',marginBottom:'14px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px'}}>
        <div style={{textAlign:'center'}}><div style={{color:C.text,fontSize:'22px',fontFamily:FD,fontWeight:'700'}}>{cur}kg</div><div style={{color:C.textDim,fontSize:'11px',fontFamily:FB}}>{t.weightCurrent||'Huidig'}</div></div>
        <div style={{textAlign:'center'}}>{bmi&&<><div style={{color:C.accent,fontSize:'22px',fontFamily:FD,fontWeight:'700'}}>{bmi}</div><div style={{color:C.textDim,fontSize:'11px',fontFamily:FB}}>BMI</div></>}</div>
        <div style={{textAlign:'center'}}><div style={{color:C.good,fontSize:'22px',fontFamily:FD,fontWeight:'700'}}>{goal}kg</div><div style={{color:C.textDim,fontSize:'11px',fontFamily:FB}}>{t.weightGoal||'Doel'}</div></div>
      </div>
      <div style={{marginBottom:'14px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{color:C.textDim,fontSize:'11px',fontFamily:FB}}>{t.milestones||'Mijlpalen'}</span></div>
        <div style={{display:'flex',gap:'8px'}}>{MILESTONES.map(m=>{const reached=cur&&goal&&(cur-goal)<=-(m.kg-0.01);return(<div key={m.kg} style={{flex:1,padding:'8px 4px',borderRadius:'10px',background:reached?C.goodGlow:C.muted,border:`1px solid ${reached?C.good:C.cardBorder}`,textAlign:'center'}}><div style={{color:reached?C.good:C.textDim,fontSize:'12px',fontFamily:FB,fontWeight:'600'}}>{m.label}</div>{reached&&<div style={{color:C.good,fontSize:'14px'}}>✓</div>}</div>)})}</div>
      </div>
    </div>}
    <h3 style={{fontFamily:FD,color:C.text,fontSize:'22px',marginBottom:'14px',marginTop:'4px'}}>{t.windowTitle}</h3>
    <div style={{background:C.card,borderRadius:'16px',border:`1px solid ${C.cardBorder}`,padding:'16px',marginBottom:'14px'}}>
      <div style={{display:'flex',justifyContent:'space-around',marginBottom:'14px'}}>
        {[{label:pattern.id.split('-')[0]+'u',sub:{nl:'eten',en:'eating',fr:'manger',de:'essen'}},{label:pattern.id.split('-')[1]+'u',sub:{nl:'vasten',en:'fasting',fr:'jeûne',de:'fasten'}}].map((item,i)=>(
          <div key={i} style={{textAlign:'center'}}><div style={{color:i===0?C.accent:C.textDim,fontSize:'26px',fontFamily:FD}}>{item.label}</div><div style={{color:C.textDim,fontSize:'12px',fontFamily:FB}}>{item.sub[lang]||item.sub.nl}</div></div>
        ))}
      </div>
      <div style={{height:'8px',background:C.muted,borderRadius:'4px',overflow:'hidden',marginBottom:'8px'}}>
        <div style={{height:'100%',width:`${((pattern.eatEnd-pattern.eatStart)/19)*100}%`,marginLeft:`${((pattern.eatStart-5)/19)*100}%`,background:`linear-gradient(90deg,${C.accentDim},${C.accent})`,borderRadius:'4px',boxShadow:`0 0 8px ${C.accent}`}}/>
      </div>
      <div style={{textAlign:'center',color:C.accent,fontSize:'13px',fontFamily:FB}}>{pattern.eatStart}:00 – {pattern.eatEnd}:00</div>
    </div>
    <h4 style={{color:C.text,fontFamily:FB,fontSize:'14px',fontWeight:'600',marginBottom:'10px'}}>{t.movementTitle}</h4>
    {movements.map((m,i)=>{
      const h=parseInt(m.time.split(':')[0])+parseInt(m.time.split(':')[1])/60
      const inWin=h>=pattern.eatStart&&h<pattern.eatEnd
      return(<div key={i} style={{display:'flex',gap:'12px',alignItems:'center',padding:'11px 14px',background:C.card,borderRadius:'12px',marginBottom:'8px',border:`1px solid ${inWin?C.accentDim:C.cardBorder}`}}>
        <span style={{fontSize:'20px'}}>{m.icon}</span>
        <div style={{flex:1}}><div style={{color:C.text,fontSize:'13px',fontFamily:FB}}>{m.time} — {m[lang]||m.nl}</div><div style={{color:C.textDim,fontSize:'11px'}}>{m.tip[lang]||m.tip.nl}</div></div>
        <span style={{color:inWin?C.accent:C.textDim,fontSize:'11px',fontFamily:FB,background:inWin?C.accentGlow:C.muted,padding:'2px 8px',borderRadius:'10px'}}>{m.dur}</span>
      </div>)
    })}
  </>)
}

// ─── COACH TAB ────────────────────────────────────────────────────
function CoachTab({profile,lang,t,done,total,weekFasting,weekMovement,weekLogs}){
  const[chat,setChat]=useState([])
  const[chatInput,setChatInput]=useState('')
  const[chatLoading,setChatLoading]=useState(false)
  const[streaming,setStreaming]=useState(false)
  const chatEndRef=useRef(null)

  useEffect(()=>{loadDaily()},[done,lang])
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'})},[chat])

  const loadDaily=async()=>{
    setChat([{role:'assistant',text:'',loading:true}])
    let full=''
    try{
      await streamAI(
        coachDailyPrompt(profile,lang,done,total),
        (t)=>{full=t;setChat([{role:'assistant',text:t,loading:false}])},
        coachSystemPrompt(profile,lang)
      )
    }catch{
      const name=profile.first_name||profile.name
      setChat([{role:'assistant',text:done===0?`${name}, een nieuwe dag begint. Zet de eerste stap — open je eetvenster.`:`${name}, goed bezig! ${done} van ${total} taken gedaan.`,loading:false}])
    }
  }

  const sendMessage=async()=>{
    const msg=chatInput.trim()
    if(!msg||chatLoading)return
    setChatInput('')
    const newChat=[...chat,{role:'user',text:msg}]
    setChat([...newChat,{role:'assistant',text:'',loading:true}])
    setChatLoading(true);setStreaming(true)
    // Build conversation history for context
    const messages=newChat.map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.text}))
    try{
      await streamAI(
        msg,
        (t)=>setChat(prev=>[...prev.slice(0,-1),{role:'assistant',text:t,loading:false}]),
        coachSystemPrompt(profile,lang)
      )
    }catch{
      setChat(prev=>[...prev.slice(0,-1),{role:'assistant',text:'Sorry, even geen verbinding. Probeer opnieuw.',loading:false}])
    }
    setChatLoading(false);setStreaming(false)
  }

  const weekData=[
    {label:t.weekFasting,val:weekLogs.length>0?t.fastingDays(weekFasting):t.noData,color:weekFasting>=5?C.good:weekFasting>=3?C.gold:C.textDim},
    {label:t.weekMovement,val:weekLogs.length>0?t.fastingDays(weekMovement):t.noData,color:weekMovement>=5?C.good:weekMovement>=3?C.gold:C.textDim},
    {label:t.weekStreak,val:`${profile.streak||0} 🔥`,color:C.gold},
  ]

  return(<>
    <h3 style={{fontFamily:FD,color:C.text,fontSize:'22px',marginBottom:'14px'}}>{t.coachTitle}</h3>

    {/* Chat thread */}
    <div style={{marginBottom:'10px'}}>
      {chat.map((m,i)=>(
        <div key={i} style={{display:'flex',gap:'10px',marginBottom:'12px',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
          {m.role==='assistant'&&<div style={{width:'36px',height:'36px',borderRadius:'50%',background:`linear-gradient(135deg,${C.accentDim},${C.accent})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0,alignSelf:'flex-end'}}>💬</div>}
          <div style={{maxWidth:'80%',padding:'12px 14px',borderRadius:m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',background:m.role==='user'?`linear-gradient(135deg,${C.accentDim},${C.accent})`:`${C.card}`,border:m.role==='user'?'none':`1px solid ${C.cardBorder}`}}>
            {m.loading?<span style={{display:'inline-flex',gap:'3px'}}>{[0,1,2].map(j=><span key={j} style={{width:'5px',height:'5px',borderRadius:'50%',background:C.accent,animation:`bounce 0.9s ease ${j*0.15}s infinite`,display:'inline-block'}}/>)}</span>:<p style={{color:m.role==='user'?'#fff':C.text,fontSize:'14px',lineHeight:'1.6',fontFamily:FB,margin:0}}>{m.text}</p>}
          </div>
        </div>
      ))}
      <div ref={chatEndRef}/>
    </div>

    {/* Chat input */}
    <div style={{display:'flex',gap:'8px',marginBottom:'20px',position:'sticky',bottom:'90px'}}>
      <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()} placeholder={t.chatPlaceholder||'Stel je coach een vraag...'} style={{flex:1,padding:'12px 16px',background:C.card,border:`1.5px solid ${C.cardBorder}`,borderRadius:'14px',color:C.text,fontSize:'14px',fontFamily:FB,outline:'none'}}/>
      <button onClick={sendMessage} disabled={!chatInput.trim()||chatLoading} style={{padding:'12px 18px',background:chatInput.trim()?`linear-gradient(135deg,${C.accentDim},${C.accent})`:C.muted,border:'none',borderRadius:'14px',color:'#fff',cursor:chatInput.trim()?'pointer':'default',fontSize:'16px',transition:'all 0.2s'}}>{t.chatSend||'→'}</button>
    </div>

    {/* Week stats */}
    <div style={{background:C.card,borderRadius:'16px',border:`1px solid ${C.cardBorder}`,padding:'16px'}}>
      <h4 style={{color:C.text,fontFamily:FB,fontSize:'14px',fontWeight:'600',marginBottom:'12px'}}>{t.weekInsight}</h4>
      {weekData.map((item,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:i<weekData.length-1?`1px solid ${C.muted}`:'none'}}>
          <span style={{color:C.textDim,fontSize:'13px',fontFamily:FB}}>{item.label}</span>
          <span style={{color:item.color,fontSize:'13px',fontFamily:FB,fontWeight:'600'}}>{item.val}</span>
        </div>
      ))}
    </div>
  </>)
}

// ─── SCANNER ──────────────────────────────────────────────────────
function Scanner({lang,t,userId,onBack,onScanSaved}){
  const[product,setProduct]=useState(null)
  const[aiAdvice,setAiAdvice]=useState(null)
  const[loadingAI,setLoadingAI]=useState(false)
  const[scanning,setScanning]=useState(false)
  const[manual,setManual]=useState('')
  const videoRef=useRef(null);const streamRef=useRef(null)

  const stopCam=useCallback(()=>{if(streamRef.current){streamRef.current.getTracks().forEach(tk=>tk.stop());streamRef.current=null}setScanning(false)},[])
  useEffect(()=>()=>stopCam(),[stopCam])

  const handleProduct=async(p)=>{
    setProduct(p);setLoadingAI(true)
    let advice=''
    try{
      // Check cache first, then generate
      if(p[`ai_advice_${lang}`]){advice=p[`ai_advice_${lang}`]}
      else{advice=await getProductAdvice(p,lang)}
      setAiAdvice(advice)
    }catch{setAiAdvice(null)}
    setLoadingAI(false)
    // Save scan to history
    if(userId){
      const saved=await saveScan(userId,p,advice)
      if(!saved.error&&onScanSaved)onScanSaved({...p,ai_advice:advice,scanned_at:new Date().toISOString()})
    }
  }

  const handleBarcode=async(code)=>{
    // Try real API first
    const{product:real}=await lookupBarcode(code,lang)
    if(real){handleProduct(real);return}
    // Fallback to demo
    const demo=DEMO_PRODUCTS[code]
    if(demo)handleProduct(demo)
    else setProduct({product_name:'Product niet gevonden',verdict:'maybe',impact_score:5,nutrients:null,alt:null})
  }

  const startCam=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})
      streamRef.current=stream;if(videoRef.current)videoRef.current.srcObject=stream;setScanning(true)
      // Demo: auto-scan after 2.5s
      setTimeout(()=>{
        const code=Object.keys(DEMO_PRODUCTS)[Math.floor(Math.random()*3)]
        handleBarcode(code);stopCam()
      },2500)
    }catch{
      const code=Object.keys(DEMO_PRODUCTS)[Math.floor(Math.random()*3)]
      handleBarcode(code)
    }
  }

  const vc=(v)=>v==='good'?C.good:v==='maybe'?C.gold:C.bad
  const vl=(v)=>v==='good'?t.verdictGood:v==='maybe'?t.verdictMaybe:t.verdictBad
  const vbg=(v)=>v==='good'?C.goodGlow:v==='maybe'?C.goldGlow:C.warnGlow

  return(
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'20px 20px 14px'}}>
        <button onClick={onBack} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:'10px',padding:'8px 12px',color:C.text,cursor:'pointer',fontSize:'16px'}}>←</button>
        <h2 style={{fontFamily:FD,color:C.text,fontSize:'22px'}}>{t.scanTitle}</h2>
      </div>
      {!product?(
        <div style={{padding:'0 20px'}}>
          <div style={{position:'relative',borderRadius:'20px',overflow:'hidden',background:'#000',height:'240px',marginBottom:'14px',border:`2px solid ${scanning?C.accent:C.cardBorder}`,transition:'all 0.3s'}}>
            <video ref={videoRef} autoPlay playsInline muted style={{width:'100%',height:'100%',objectFit:'cover',opacity:scanning?1:0}}/>
            {!scanning&&<div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.card}}><span style={{fontSize:'44px',marginBottom:'10px'}}>📷</span><span style={{color:C.textDim,fontSize:'14px',fontFamily:FB}}>{t.scanTitle}</span></div>}
            {scanning&&<><div style={{position:'absolute',left:'10%',right:'10%',height:'2px',background:C.accent,boxShadow:`0 0 8px ${C.accent}`,animation:'scanLine 1.5s ease-in-out infinite',top:'50%'}}/><div style={{position:'absolute',bottom:'12px',left:'50%',transform:'translateX(-50%)',color:C.accent,fontSize:'12px',fontFamily:FB,background:'rgba(0,0,0,0.6)',padding:'4px 12px',borderRadius:'20px'}}>{t.scanning}</div></>}
          </div>
          <button onClick={startCam} style={{width:'100%',padding:'15px',background:`linear-gradient(135deg,${C.accentDim},${C.accent})`,border:'none',borderRadius:'14px',color:'#fff',fontSize:'15px',fontWeight:'700',cursor:'pointer',fontFamily:FB,marginBottom:'12px',boxShadow:`0 4px 24px ${C.accentGlow}`}}>{t.scanStart}</button>
          <p style={{color:C.textDim,fontSize:'11px',textAlign:'center',marginBottom:'10px',fontFamily:FB}}>{t.scanDemo}</p>
          {Object.entries(DEMO_PRODUCTS).map(([code,p])=>(
            <button key={code} onClick={()=>handleBarcode(code)} style={{width:'100%',padding:'12px 14px',borderRadius:'12px',background:C.card,border:`1px solid ${C.cardBorder}`,color:C.text,cursor:'pointer',fontFamily:FB,display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'13px',marginBottom:'8px'}}>
              <span>{p.product_name}</span><span>{p.verdict==='good'?'🟢':p.verdict==='maybe'?'🟡':'🔴'}</span>
            </button>
          ))}
          <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
            <input value={manual} onChange={e=>setManual(e.target.value)} onKeyDown={e=>e.key==='Enter'&&manual.trim()&&handleBarcode(manual.trim())} placeholder={t.scanManual} style={{flex:1,padding:'11px 14px',background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:'10px',color:C.text,fontSize:'13px',fontFamily:FB,outline:'none'}}/>
            <button onClick={()=>{manual.trim()&&handleBarcode(manual.trim());setManual('')}} style={{padding:'11px 16px',background:C.accentDim,border:'none',borderRadius:'10px',color:'#fff',cursor:'pointer',fontWeight:'600',fontFamily:FB}}>→</button>
          </div>
        </div>
      ):(
        <div style={{padding:'0 20px',animation:'fadeUp 0.4s ease'}}>
          <div style={{background:vbg(product.verdict),border:`2px solid ${vc(product.verdict)}`,borderRadius:'20px',padding:'22px',marginBottom:'14px',textAlign:'center'}}>
            <div style={{fontSize:'48px',marginBottom:'8px'}}>{product.verdict==='good'?'✅':product.verdict==='maybe'?'⚠️':'❌'}</div>
            <div style={{color:vc(product.verdict),fontSize:'17px',fontWeight:'700',fontFamily:FB,marginBottom:'4px'}}>{vl(product.verdict)}</div>
            <div style={{color:C.text,fontSize:'19px',fontFamily:FD,marginBottom:'2px'}}>{product.product_name}</div>
            {product.brand&&<div style={{color:C.textDim,fontSize:'12px',fontFamily:FB}}>{product.brand}</div>}
          </div>
          <div style={{background:C.card,borderRadius:'14px',border:`1px solid ${C.cardBorder}`,padding:'14px',marginBottom:'10px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
              <span style={{color:C.text,fontSize:'13px',fontFamily:FB,fontWeight:'600'}}>{t.bloodSugarImpact}</span>
              <span style={{color:vc(product.verdict),fontSize:'18px',fontFamily:FD}}>{product.impact_score}/10</span>
            </div>
            <div style={{height:'8px',background:C.muted,borderRadius:'4px',overflow:'hidden'}}><div style={{height:'100%',width:`${product.impact_score*10}%`,background:`linear-gradient(90deg,${C.bad},${C.gold},${C.good})`,borderRadius:'4px',transition:'width 0.8s ease'}}/></div>
          </div>
          {product.nutrients&&<div style={{background:C.card,borderRadius:'14px',border:`1px solid ${C.cardBorder}`,padding:'12px',marginBottom:'10px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
            {[{icon:'🌾',val:`${product.nutrients.carbs}g`,k:'carbs'},{icon:'💪',val:`${product.nutrients.protein}g`,k:'prot'},{icon:'🫒',val:`${product.nutrients.fat}g`,k:'fat'},{icon:'🌿',val:`${product.nutrients.fiber}g`,k:'fib'}].map(n=>(
              <div key={n.k} style={{textAlign:'center'}}><div style={{fontSize:'16px'}}>{n.icon}</div><div style={{color:C.text,fontSize:'13px',fontWeight:'600',fontFamily:FB}}>{n.val}</div></div>
            ))}
          </div>}
          <div style={{background:C.card,borderRadius:'14px',border:`1px solid ${C.accentDim}`,padding:'14px',marginBottom:'10px'}}>
            <div style={{color:C.accent,fontSize:'11px',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'6px',fontFamily:FB}}>{t.coachAdvice}</div>
            {loadingAI?<p style={{color:C.textDim,fontSize:'13px',fontFamily:FB,animation:'pulse 1.5s infinite'}}>{t.analysing}</p>:<p style={{color:C.text,fontSize:'14px',lineHeight:'1.6',fontFamily:FB,margin:0}}>{aiAdvice||''}</p>}
          </div>
          {product.alt&&<div style={{background:C.goodGlow,border:`1px solid ${C.good}`,borderRadius:'14px',padding:'14px',marginBottom:'14px'}}>
            <div style={{color:C.good,fontSize:'12px',fontWeight:'600',marginBottom:'6px',fontFamily:FB}}>{t.betterAlt}</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:C.text,fontSize:'14px',fontFamily:FB}}>{product.alt[lang]||product.alt.nl||product.alt}</span>
              <span style={{color:C.good,fontSize:'12px',fontFamily:FB,background:'rgba(52,211,153,0.1)',padding:'3px 8px',borderRadius:'10px'}}>{t.score}: {product.altScore}/10</span>
            </div>
          </div>}
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={()=>{setProduct(null);setAiAdvice(null)}} style={{flex:1,padding:'14px',background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:'12px',color:C.text,fontSize:'14px',cursor:'pointer',fontFamily:FB}}>{t.scanAgain}</button>
            <button onClick={onBack} style={{flex:1,padding:'14px',background:`linear-gradient(135deg,${C.accentDim},${C.accent})`,border:'none',borderRadius:'12px',color:'#fff',fontSize:'14px',cursor:'pointer',fontFamily:FB,fontWeight:'600'}}>{t.toDashboard}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
export default function LudwigHealth(){
  const{session,user,loading:authLoading}=useAuth()
  const[screen,setScreen]=useState(null) // null=loading, 'auth', 'onboarding', 'app'
  const[profile,setProfile]=useState(null)
  const[lang,setLang]=useState('nl')
  const[guestMode,setGuestMode]=useState(false)

  // Determine initial screen
  useEffect(()=>{
    if(authLoading)return
    if(!hasSupabase){
      // No Supabase configured — go straight to onboarding (demo mode)
      setScreen('onboarding');return
    }
    if(!session&&!guestMode){setScreen('auth');return}
    if(session?.user){
      // Check if user has completed onboarding
      supabase.from('profiles').select('onboarding_done,language,first_name,fasting_pattern,streak,uses_medication').eq('id',session.user.id).single()
        .then(({data})=>{
          if(data?.onboarding_done){
            setProfile(data)
            setLang(data.language||'nl')
            setScreen('app')
          }else{
            setScreen('onboarding')
          }
        })
    }else if(guestMode){
      setScreen('onboarding')
    }
  },[session,authLoading,guestMode])

  const handleOnboardingComplete=(data)=>{
    const patternObj=PATTERN_DATA.find(p=>p.id===data.pattern)||PATTERN_DATA[1]
    setProfile({
      first_name:      data.name,
      fasting_pattern: data.pattern,
      eat_start:       patternObj.eatStart,
      eat_end:         patternObj.eatEnd,
      streak:          0,
      weight:          data.weight||null,
      goal_weight:     data.goalWeight||null,
      height:          data.height||null,
      enjoy:           [...data.enjoy.map(id=>[...ENJOY_DATA.drinks,...ENJOY_DATA.food].find(o=>o.id===id)?.[data.lang||'nl']),...(data.customEnjoy||[])].filter(Boolean),
    })
    setLang(data.lang||'nl')
    setScreen('app')
  }

  const handleLangChange=(l)=>{
    setLang(l)
    if(user){supabase.from('profiles').update({language:l}).eq('id',user.id)}
  }

  // Global styles
  const styles=`
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:${C.bg};}
    input::placeholder{color:${C.textDim};}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{background:${C.muted};border-radius:2px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
    @keyframes pulse{0%,100%{opacity:0.6}50%{opacity:0.2}}
    @keyframes bounce{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-5px);opacity:1}}
    @keyframes popIn{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes scanLine{0%{top:25%}50%{top:75%}100%{top:25%}}
  `

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{styles}</style>
      <div style={{background:C.bg,minHeight:'100vh',maxWidth:'430px',margin:'0 auto',display:'flex',flexDirection:'column'}}>

        {/* Loading */}
        {(!screen||authLoading)&&(
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}}>
            <div style={{animation:'bounce 1s ease infinite'}}><LHLogo size={56}/></div>
            <h1 style={{fontFamily:FD,fontSize:'32px',color:C.text}}>Ludwig <span style={{color:C.accent}}>Health</span></h1>
          </div>
        )}

        {/* Auth */}
        {screen==='auth'&&!authLoading&&(
          <AuthScreen lang={lang} setLang={setLang} onGuest={()=>setGuestMode(true)}/>
        )}

        {/* Onboarding */}
        {screen==='onboarding'&&(
          <Onboarding lang={lang} setLang={setLang} userId={user?.id||null} onComplete={handleOnboardingComplete}/>
        )}

        {/* Main App */}
        {screen==='app'&&profile&&(
          <MainApp profile={profile} lang={lang} setLang={handleLangChange} userId={user?.id||null} onSignOut={()=>{signOut();setScreen('auth');setProfile(null)}}/>
        )}

      </div>
    </>
  )
}
