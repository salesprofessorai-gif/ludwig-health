// ─── SCANNER SERVICE ──────────────────────────────────────────────
// Open Food Facts API + Supabase product cache + scan history
import { supabase } from '../lib/supabase'

const OFF_API = 'https://world.openfoodfacts.org/api/v2/product'

// ── BARCODE LOOKUP ────────────────────────────────────────────────

export async function lookupBarcode(barcode, lang = 'nl') {
  // 1. Check Supabase cache first
  const cached = await getCachedProduct(barcode)
  if (cached) return { product: cached, source: 'cache' }

  // 2. Fetch from Open Food Facts
  const offProduct = await fetchFromOFF(barcode)
  if (!offProduct) return { product: null, source: 'not_found' }

  // 3. Score the product
  const scored = scoreProduct(offProduct)

  // 4. Cache it in Supabase (no AI advice yet — generated on demand)
  await cacheProduct(barcode, scored)

  return { product: scored, source: 'open_food_facts' }
}

async function getCachedProduct(barcode) {
  const { data } = await supabase
    .from('product_cache')
    .select('*')
    .eq('barcode', barcode)
    .single()
  return data || null
}

async function fetchFromOFF(barcode) {
  try {
    const res = await fetch(
      `${OFF_API}/${barcode}?fields=product_name,brands,nutriments,nutriscore_grade,nova_group`,
      { headers: { 'User-Agent': 'GlycoDay/1.0 (pilot)' } }
    )
    const json = await res.json()
    if (json.status !== 1) return null
    return json.product
  } catch {
    return null
  }
}

function scoreProduct(p) {
  const n = p.nutriments || {}
  const sugar = n['sugars_100g'] || 0
  const fiber = n['fiber_100g']  || 0
  const carbs = n['carbohydrates_100g'] || 0

  // Glycemic impact score (1-10, 10 = best)
  let score = 10
  if (sugar > 20) score -= 4
  else if (sugar > 10) score -= 2
  else if (sugar > 5)  score -= 1

  if (fiber > 5) score += 1
  if (carbs > 50) score -= 1

  // Clamp 1-10
  score = Math.max(1, Math.min(10, score))

  const verdict =
    score >= 7 ? 'good' :
    score >= 4 ? 'maybe' : 'bad'

  return {
    barcode:      p.code || '',
    product_name: p.product_name || 'Onbekend product',
    brand:        p.brands || '',
    impact_score: score,
    verdict,
    sugar_g:      sugar,
    nutrients: {
      carbs:   Math.round(carbs),
      protein: Math.round(n['proteins_100g'] || 0),
      fat:     Math.round(n['fat_100g'] || 0),
      fiber:   Math.round(fiber),
    },
  }
}

async function cacheProduct(barcode, product) {
  await supabase.from('product_cache').upsert({
    barcode,
    product_name: product.product_name,
    brand:        product.brand,
    impact_score: product.impact_score,
    verdict:      product.verdict,
    sugar_g:      product.sugar_g,
    nutrients:    product.nutrients,
    cached_at:    new Date().toISOString(),
  }, { onConflict: 'barcode' })
}

// ── AI ADVICE (cached per lang) ──────────────────────────────────

export async function getProductAdvice(product, lang) {
  const col = `ai_advice_${lang}`

  // Check if already cached for this language
  if (product[col]) return product[col]

  // Generate via Anthropic
  const advice = await generateAdvice(product, lang)

  // Save to cache
  if (product.barcode) {
    await supabase.from('product_cache')
      .update({ [col]: advice })
      .eq('barcode', product.barcode)
  }

  return advice
}

async function generateAdvice(product, lang) {
  const prompts = {
    nl: `Diabetes voedingscoach. 1 zin (max 15 woorden): waarom is ${product.product_name} ${product.verdict === 'good' ? 'goed' : 'slecht'} voor bloedsuiker? Suiker: ${product.sugar_g}g per 100g.`,
    en: `Diabetes nutrition coach. 1 sentence (max 15 words): why is ${product.product_name} ${product.verdict} for blood sugar? Sugar: ${product.sugar_g}g per 100g.`,
    fr: `Coach nutrition diabète. 1 phrase (max 15 mots): pourquoi ${product.product_name} est ${product.verdict === 'good' ? 'bon' : 'mauvais'} pour la glycémie? Sucre: ${product.sugar_g}g/100g.`,
    de: `Diabetes-Ernährungscoach. 1 Satz (max 15 Wörter): warum ist ${product.product_name} ${product.verdict === 'good' ? 'gut' : 'schlecht'} für den Blutzucker? Zucker: ${product.sugar_g}g/100g.`,
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 80,
        messages: [{ role: 'user', content: prompts[lang] || prompts.nl }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text || ''
  } catch {
    return ''
  }
}

// ── SCAN HISTORY ─────────────────────────────────────────────────

export async function saveScan(userId, product, aiAdvice) {
  const { error } = await supabase.from('scan_history').insert({
    user_id:      userId,
    barcode:      product.barcode || null,
    product_name: product.product_name,
    brand:        product.brand || null,
    impact_score: product.impact_score,
    verdict:      product.verdict,
    sugar_g:      product.sugar_g,
    ai_advice:    aiAdvice || null,
  })
  return { error }
}

export async function loadScanHistory(userId, limit = 10) {
  const { data, error } = await supabase
    .from('scan_history')
    .select('*')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false })
    .limit(limit)

  return { scans: data || [], error }
}
