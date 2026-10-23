import type { Brew } from './types'
import { describeMix, mixSignature } from './beans'
import { mokaPotName } from './utils'

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

export const average = (nums: number[]): number =>
  nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0

const stddev = (nums: number[]): number => {
  if (nums.length < 2) return 0
  const m = average(nums)
  return Math.sqrt(average(nums.map((n) => (n - m) ** 2)))
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const byDateAsc = (a: Brew, b: Brew) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()

export const brewLabel = (brew: Brew): string =>
  brew.mix && brew.mix.length > 1 ? describeMix(brew.mix) : brew.bean?.name || '?'

const daysPastRoast = (brew: Brew): number | null => {
  if (!brew.bean?.roast_date) return null
  const diff = new Date(brew.created_at).getTime() - new Date(brew.bean.roast_date).getTime()
  return Math.max(0, Math.floor(diff / 86_400_000))
}

const BITTER_WORDS = ['bitter', 'burnt', 'burned', 'harsh', 'astringent', 'ashy', 'amaro', 'bruciat', 'astringen']
// "acidity" is deliberately absent: bright acidity is usually praise, not a flaw
const SOUR_WORDS = ['sour', 'acidic', 'watery', 'weak', 'aspro', 'acerbo', 'acida', 'acido', 'debole']
const NEGATIONS = /\b(not|no|non|never|without|less|barely|neither|nor|zero|senza|niente|mai|poco)\b|n't\b/
const MILD = /\b(slightly|slight|bit|touch|hint|little|mild|mildly|tad|leggermente|lieve)\b/

/** How strongly the notes state one of the words: 0 (absent or negated), 0.35 (mild) or 1. */
function mention(text: string, words: string[]): number {
  let best = 0
  for (const w of words) {
    let from = 0
    for (;;) {
      const at = text.indexOf(w, from)
      if (at === -1) break
      from = at + w.length
      const before = text.slice(Math.max(0, at - 24), at)
      // A negation earlier in the same clause ("not too bitter", "no harsh finish") cancels the word
      const clause = before.split(/[,.;!?]/).pop() ?? ''
      if (NEGATIONS.test(clause)) continue
      best = Math.max(best, MILD.test(clause) ? 0.35 : 1)
    }
  }
  return best
}

/** -1 (sour / under-extracted) .. +1 (bitter / over-extracted), or null if the notes don't say. */
export function notesBalance(notes: string | undefined | null): number | null {
  const text = (notes || '').toLowerCase()
  if (!text) return null
  const bitter = mention(text, BITTER_WORDS)
  const sour = mention(text, SOUR_WORDS)
  if (bitter === sour) return null
  return bitter > sour ? bitter : -sour
}

/* ------------------------------------------------------------------ */
/* Aggregate stats                                                     */
/* ------------------------------------------------------------------ */

export interface NamedAverage {
  name: string
  avg: number
  count: number
}

export interface BrewStats {
  total: number
  avgRating: number
  /** Share (0-1) of brews rated 8 or higher */
  highShare: number
  /** Average of the latest 5 minus average of the 5 before them; null if not enough data */
  trend: number | null
  recentAvg: number | null
  consistency: number | null
  bestBean: NamedAverage | null
  worstBean: NamedAverage | null
  bestHeat: NamedAverage | null
  bestFilter: { filter: boolean; avg: number; otherAvg: number } | null
  freshVsStale: { freshAvg: number; staleAvg: number; thresholdDays: number } | null
  goodTimeRange: { min: number; max: number } | null
  bestSetting: { setting: number; avg: number; count: number; untestedNeighbour: number | null; recipe: string } | null
  bitterShare: number
  sourShare: number
  notesCount: number
  streakDays: number
}

const groupAverages = (items: { name: string; rating: number }[]): NamedAverage[] => {
  const map = new Map<string, number[]>()
  for (const i of items) map.set(i.name, [...(map.get(i.name) || []), i.rating])
  return [...map.entries()].map(([name, list]) => ({ name, avg: average(list), count: list.length }))
}

export function computeStats(brews: Brew[]): BrewStats {
  const sorted = [...brews].sort(byDateAsc)
  const ratings = sorted.map((b) => b.vibe_rating)
  const total = sorted.length

  const recent = ratings.slice(-5)
  const prior = ratings.slice(-10, -5)
  const trend = total >= 8 && prior.length >= 3 ? average(recent) - average(prior) : null

  const beanAvgs = groupAverages(sorted.map((b) => ({ name: brewLabel(b), rating: b.vibe_rating }))).filter(
    (b) => b.count >= 2
  )
  const rankedBeans = [...beanAvgs].sort((a, b) => b.avg - a.avg)
  const bestBean = rankedBeans[0] ?? null
  const worstBean = rankedBeans.length > 1 ? rankedBeans[rankedBeans.length - 1] : null

  const heatAvgs = groupAverages(
    sorted.filter((b) => b.heat_level).map((b) => ({ name: b.heat_level as string, rating: b.vibe_rating }))
  ).filter((h) => h.count >= 3)
  const bestHeat = heatAvgs.length > 1 ? [...heatAvgs].sort((a, b) => b.avg - a.avg)[0] : null

  const withFilter = sorted.filter((b) => b.has_paper_filter).map((b) => b.vibe_rating)
  const noFilter = sorted.filter((b) => !b.has_paper_filter).map((b) => b.vibe_rating)
  const bestFilter =
    withFilter.length >= 3 && noFilter.length >= 3 && Math.abs(average(withFilter) - average(noFilter)) >= 0.7
      ? {
          filter: average(withFilter) > average(noFilter),
          avg: Math.max(average(withFilter), average(noFilter)),
          otherAvg: Math.min(average(withFilter), average(noFilter)),
        }
      : null

  const thresholdDays = 14
  const fresh = sorted.filter((b) => (daysPastRoast(b) ?? 999) <= thresholdDays && daysPastRoast(b) !== null)
  const stale = sorted.filter((b) => (daysPastRoast(b) ?? -1) > thresholdDays)
  const freshVsStale =
    fresh.length >= 3 && stale.length >= 3
      ? {
          freshAvg: average(fresh.map((b) => b.vibe_rating)),
          staleAvg: average(stale.map((b) => b.vibe_rating)),
          thresholdDays,
        }
      : null

  const winners = sorted.filter((b) => b.vibe_rating >= 8 && b.extraction_time_s > 0)
  const goodTimeRange =
    winners.length >= 3
      ? (() => {
          const times = winners.map((b) => b.extraction_time_s).sort((a, b) => a - b)
          const lo = times[Math.floor(times.length * 0.1)]
          const hi = times[Math.ceil(times.length * 0.9) - 1]
          return { min: lo, max: hi }
        })()
      : null

  const groups = groupRecipes(sorted)
  const topGroup = groups.find((g) => g.brews.some((b) => b.grinder_id && b.grinder_setting != null))
  let bestSetting: BrewStats['bestSetting'] = null
  if (topGroup) {
    const bySetting = new Map<number, number[]>()
    for (const b of topGroup.brews) {
      if (b.grinder_id && b.grinder_setting != null) {
        bySetting.set(b.grinder_setting, [...(bySetting.get(b.grinder_setting) || []), b.vibe_rating])
      }
    }
    const rows = [...bySetting.entries()].map(([setting, list]) => ({ setting, avg: average(list), count: list.length }))
    const pick = [...rows].filter((r) => r.count >= 2).sort((a, b) => b.avg - a.avg)[0]
    if (pick) {
      const neighbour = [pick.setting - 1, pick.setting + 1].find((s) => s >= 0 && !bySetting.has(s))
      bestSetting = { ...pick, untestedNeighbour: neighbour ?? null, recipe: topGroup.label }
    }
  }

  const balances = sorted.map((b) => notesBalance(b.tasting_notes)).filter((v): v is number => v !== null)
  const notesCount = sorted.filter((b) => (b.tasting_notes || '').trim()).length

  // Consecutive days (ending today or yesterday) with at least one brew
  const days = new Set(sorted.map((b) => new Date(b.created_at).toDateString()))
  let streakDays = 0
  const cursor = new Date()
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1)
  while (days.has(cursor.toDateString())) {
    streakDays++
    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    total,
    avgRating: average(ratings),
    highShare: total ? ratings.filter((r) => r >= 8).length / total : 0,
    trend,
    recentAvg: recent.length ? average(recent) : null,
    consistency: total >= 6 ? stddev(ratings.slice(-10)) : null,
    bestBean,
    worstBean: worstBean && bestBean && worstBean.name !== bestBean.name ? worstBean : null,
    bestHeat,
    bestFilter,
    freshVsStale,
    goodTimeRange,
    bestSetting,
    bitterShare: notesCount ? balances.filter((v) => v > 0).length / notesCount : 0,
    sourShare: notesCount ? balances.filter((v) => v < 0).length / notesCount : 0,
    notesCount,
    streakDays,
  }
}

/* ------------------------------------------------------------------ */
/* Deterministic findings (the no-AI baseline)                         */
/* ------------------------------------------------------------------ */

export type FindingKind = 'good' | 'bad' | 'improve'

export interface Finding {
  kind: FindingKind
  /** Translation key suffix, resolved as analytics.finding_<key> */
  key: string
  vars?: Record<string, string | number>
}

const f1 = (n: number) => n.toFixed(1)

export function deriveFindings(s: BrewStats): Finding[] {
  const out: Finding[] = []
  if (s.total === 0) return out

  // Going well
  if (s.avgRating >= 7.5) out.push({ kind: 'good', key: 'strong_avg', vars: { avg: f1(s.avgRating) } })
  if (s.highShare >= 0.4) out.push({ kind: 'good', key: 'high_share', vars: { pct: Math.round(s.highShare * 100) } })
  if (s.trend !== null && s.trend >= 0.6) out.push({ kind: 'good', key: 'trend_up', vars: { delta: f1(s.trend) } })
  if (s.bestBean && s.bestBean.avg >= 7) {
    out.push({ kind: 'good', key: 'best_bean', vars: { name: s.bestBean.name, avg: f1(s.bestBean.avg), count: s.bestBean.count } })
  }
  if (s.consistency !== null && s.consistency <= 1.2) out.push({ kind: 'good', key: 'consistent' })
  if (s.streakDays >= 3) out.push({ kind: 'good', key: 'streak', vars: { days: s.streakDays } })

  // Going badly
  if (s.avgRating < 6) out.push({ kind: 'bad', key: 'low_avg', vars: { avg: f1(s.avgRating) } })
  if (s.trend !== null && s.trend <= -0.6) out.push({ kind: 'bad', key: 'trend_down', vars: { delta: f1(Math.abs(s.trend)) } })
  if (s.worstBean && s.worstBean.avg < 6) {
    out.push({ kind: 'bad', key: 'worst_bean', vars: { name: s.worstBean.name, avg: f1(s.worstBean.avg), count: s.worstBean.count } })
  }
  if (s.bitterShare >= 0.3 && s.bitterShare > s.sourShare) {
    out.push({ kind: 'bad', key: 'bitter', vars: { pct: Math.round(s.bitterShare * 100) } })
  } else if (s.sourShare >= 0.3) {
    out.push({ kind: 'bad', key: 'sour', vars: { pct: Math.round(s.sourShare * 100) } })
  }
  if (s.consistency !== null && s.consistency >= 2.2) out.push({ kind: 'bad', key: 'erratic', vars: { sd: f1(s.consistency) } })

  // To improve
  if (s.total < 5) out.push({ kind: 'improve', key: 'log_more', vars: { count: s.total } })
  if (s.bestSetting) {
    out.push({
      kind: 'improve',
      key: s.bestSetting.untestedNeighbour !== null ? 'setting_try' : 'setting_keep',
      vars: {
        setting: s.bestSetting.setting,
        avg: f1(s.bestSetting.avg),
        neighbour: s.bestSetting.untestedNeighbour ?? '',
        recipe: s.bestSetting.recipe,
      },
    })
  }
  if (s.goodTimeRange) {
    out.push({ kind: 'improve', key: 'time_range', vars: { min: Math.round(s.goodTimeRange.min), max: Math.round(s.goodTimeRange.max) } })
  }
  if (s.freshVsStale && Math.abs(s.freshVsStale.freshAvg - s.freshVsStale.staleAvg) >= 0.7) {
    out.push({
      kind: 'improve',
      key: s.freshVsStale.freshAvg > s.freshVsStale.staleAvg ? 'fresher' : 'age_fine',
      vars: { fresh: f1(s.freshVsStale.freshAvg), stale: f1(s.freshVsStale.staleAvg), days: s.freshVsStale.thresholdDays },
    })
  }
  if (s.bestHeat) out.push({ kind: 'improve', key: 'heat', vars: { heat: s.bestHeat.name, avg: f1(s.bestHeat.avg) } })
  if (s.bestFilter) {
    out.push({
      kind: 'improve',
      key: s.bestFilter.filter ? 'filter_yes' : 'filter_no',
      vars: { avg: f1(s.bestFilter.avg), other: f1(s.bestFilter.otherAvg) },
    })
  }
  if (s.notesCount < s.total / 2 && s.total >= 5) out.push({ kind: 'improve', key: 'more_notes' })

  return out
}

/** Compact, privacy-light payload sent to the AI for narration. */
export function summariseForAI(brews: Brew[], stats: BrewStats) {
  const recent = [...brews].sort(byDateAsc).slice(-12)
  return {
    stats: {
      total_brews: stats.total,
      average_rating: Number(stats.avgRating.toFixed(2)),
      share_rated_8_plus: Number(stats.highShare.toFixed(2)),
      trend_last5_vs_prev5: stats.trend === null ? null : Number(stats.trend.toFixed(2)),
      rating_stddev_last10: stats.consistency === null ? null : Number(stats.consistency.toFixed(2)),
      best_bean: stats.bestBean,
      worst_bean: stats.worstBean,
      best_heat: stats.bestHeat,
      paper_filter_effect: stats.bestFilter,
      freshness_effect: stats.freshVsStale,
      time_range_of_8_plus_brews_s: stats.goodTimeRange,
      best_grinder_setting: stats.bestSetting,
      share_notes_mentioning_bitter: Number(stats.bitterShare.toFixed(2)),
      share_notes_mentioning_sour: Number(stats.sourShare.toFixed(2)),
    },
    recent_brews: recent.map((b) => ({
      bean: brewLabel(b),
      rating: b.vibe_rating,
      grinder_clicks: b.grinder_setting ?? null,
      coffee_g: b.coffee_weight_g,
      water_g: b.water_added_g,
      yield_g: b.final_yield_g,
      time_s: b.extraction_time_s,
      heat: b.heat_level ?? null,
      start_water: b.water_temp ?? null,
      paper_filter: !!b.has_paper_filter,
      days_past_roast: daysPastRoast(b),
      notes: (b.tasting_notes || '').slice(0, 120),
    })),
  }
}

/* ------------------------------------------------------------------ */
/* Recipes                                                             */
/* ------------------------------------------------------------------ */

export interface RecipeGroup {
  key: string
  label: string
  brews: Brew[]
}

/** One group per recipe of beans in a given moka pot, biggest first. */
export function groupRecipes(brews: Brew[]): RecipeGroup[] {
  const map = new Map<string, RecipeGroup>()
  for (const brew of brews) {
    const key = `${mixSignature({ bean_id: brew.bean_id, mix: brew.mix })}@${brew.moka_pot_id}`
    const label = `${brewLabel(brew)} · ${brew.moka_pot ? mokaPotName(brew.moka_pot) : '?'}`
    const group = map.get(key) || { key, label, brews: [] }
    group.brews.push(brew)
    map.set(key, group)
  }
  return [...map.values()].sort((a, b) => b.brews.length - a.brews.length)
}

/* ------------------------------------------------------------------ */
/* "What if" simulator model                                           */
/* ------------------------------------------------------------------ */

export interface SimPoint {
  setting: number
  time: number
  rating: number
  balance: number | null
  yieldG: number
  coffeeG: number
}

export interface SimModel {
  points: SimPoint[]
  distinct: number
  minX: number
  maxX: number
  meanX: number
  meanTime: number
  meanRating: number
  meanYield: number
  timeSlope: number
  balanceBase: number
  balanceSlope: number
  /** 0..1, how much of the slopes comes from the user's data instead of coffee-physics priors */
  dataWeight: number
  micronsPerClick: number | null
}

export type Confidence = 'low' | 'medium' | 'high'

export interface SimPrediction {
  time: number
  rating: number
  /** -1 sour .. +1 bitter */
  balance: number
  support: number
  confidence: Confidence
  yieldG: number
}

// Coffee-physics priors: each click finer slows the brew ~4% and tilts the cup ~0.18 towards bitter.
const PRIOR_TIME_PER_CLICK = -0.04
const PRIOR_BALANCE_PER_CLICK = -0.18
const PRIOR_RATING_WEIGHT = 0.35

/** Ordinary least squares slope of y on x. Returns null if x has no spread. */
function slopeOf(xs: number[], ys: number[]): number | null {
  const mx = average(xs)
  const my = average(ys)
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0)
  if (den === 0) return null
  return xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den
}

export function buildSimModel(brews: Brew[]): SimModel | null {
  const usable = brews.filter(
    (b) => b.grinder_id && b.grinder_setting != null && b.extraction_time_s > 0 && b.vibe_rating != null
  )
  if (!usable.length) return null

  // Stick to the grinder used most, clicks are not comparable across grinders
  const counts = new Map<string, number>()
  for (const b of usable) counts.set(b.grinder_id as string, (counts.get(b.grinder_id as string) || 0) + 1)
  const mainGrinder = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
  const mine = usable.filter((b) => b.grinder_id === mainGrinder)

  const points: SimPoint[] = mine.map((b) => ({
    setting: b.grinder_setting as number,
    time: b.extraction_time_s,
    rating: b.vibe_rating,
    balance: notesBalance(b.tasting_notes),
    yieldG: b.final_yield_g,
    coffeeG: b.coffee_weight_g,
  }))

  const xs = points.map((p) => p.setting)
  const distinct = new Set(xs).size
  const meanX = average(xs)
  const meanTime = average(points.map((p) => p.time))
  const dataWeight = distinct >= 2 ? clamp((distinct - 1) / 4, 0, 1) : 0

  const priorTimeSlope = PRIOR_TIME_PER_CLICK * meanTime
  let fitTime = slopeOf(xs, points.map((p) => p.time))
  // Finer is never faster; if noise says otherwise, trust the physics
  if (fitTime === null || fitTime > 0) fitTime = priorTimeSlope
  const timeSlope = dataWeight * fitTime + (1 - dataWeight) * priorTimeSlope

  const balPts = points.filter((p) => p.balance !== null)
  const balDistinct = new Set(balPts.map((p) => p.setting)).size
  const balWeight = balDistinct >= 3 ? clamp((balDistinct - 1) / 5, 0, 1) : 0
  let fitBal = slopeOf(
    balPts.map((p) => p.setting),
    balPts.map((p) => p.balance as number)
  )
  if (fitBal === null || fitBal > 0) fitBal = PRIOR_BALANCE_PER_CLICK
  const balanceSlope = balWeight * fitBal + (1 - balWeight) * PRIOR_BALANCE_PER_CLICK
  const balanceBase = balPts.length ? average(balPts.map((p) => p.balance as number)) : 0

  const microns = mine.find((b) => b.grinder?.microns_per_click)?.grinder?.microns_per_click ?? null

  return {
    points,
    distinct,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    meanX,
    meanTime,
    meanRating: average(points.map((p) => p.rating)),
    meanYield: average(points.map((p) => p.yieldG)),
    timeSlope,
    balanceBase,
    balanceSlope,
    dataWeight,
    micronsPerClick: microns,
  }
}

/**
 * Predicts a brew at a given grinder setting.
 * `shift` is extra extraction from other variables in click-equivalents (positive acts like a finer grind);
 * `timeFactor` scales the extraction time. Both come from `setupEffect`.
 */
export function predictBrew(model: SimModel, setting: number, shift = 0, timeFactor = 1): SimPrediction {
  const effective = setting - shift
  const time = Math.max(8, model.meanTime + model.timeSlope * (setting - model.meanX)) * timeFactor

  const balance = clamp(model.balanceBase + model.balanceSlope * (effective - model.meanX), -1, 1)

  // Kernel-weighted average of the user's own ratings, shrunk to their mean where there is no data
  const bandwidth = Math.max(1, (model.maxX - model.minX) / 6)
  let wSum = 0
  let rSum = 0
  for (const p of model.points) {
    const w = Math.exp(-0.5 * ((effective - p.setting) / bandwidth) ** 2)
    wSum += w
    rSum += w * p.rating
  }
  const rating = (rSum + PRIOR_RATING_WEIGHT * model.meanRating) / (wSum + PRIOR_RATING_WEIGHT)

  const confidence: Confidence = wSum < 0.6 ? 'low' : wSum < 2 ? 'medium' : 'high'
  return { time, rating, balance, support: wSum, confidence, yieldG: model.meanYield }
}

export function simCurve(model: SimModel, shift: number, timeFactor: number, from?: number, to?: number) {
  const lo = from ?? Math.max(0, Math.floor(model.minX) - 4)
  const hi = to ?? Math.ceil(model.maxX) + 4
  const rows: { x: number; rating: number; time: number }[] = []
  for (let x = lo; x <= hi; x++) {
    const p = predictBrew(model, x, shift, timeFactor)
    rows.push({ x, rating: Number(p.rating.toFixed(2)), time: Math.round(p.time) })
  }
  return rows
}

/* ------------------------------------------------------------------ */
/* Pre-brew setup effects (rules of thumb, not learned from the data)  */
/* ------------------------------------------------------------------ */

/** Everything that can be decided before the pot goes on the stove (milk is added afterwards). */
export interface BrewSetup {
  coffeeG: number
  waterG: number
  waterTemp: 'Boiling' | 'Warm' | 'Cold'
  heat: 'Low' | 'Medium-Low' | 'Medium' | 'High'
  paperFilter: boolean
}

export interface SetupEffect {
  /** Click-equivalents of extra extraction (positive behaves like a finer grind) */
  shift: number
  timeFactor: number
  /** Grams of liquid in the cup relative to the original brew */
  yieldDelta: number
}

const TEMP_EFFECT = { Boiling: { shift: 0, time: 1 }, Warm: { shift: -0.8, time: 1.15 }, Cold: { shift: -1.5, time: 1.3 } }
const HEAT_ORDER = ['Low', 'Medium-Low', 'Medium', 'High'] as const
// Grams of water a gram of ground coffee holds on to
const ABSORPTION = 1.5

/**
 * Translates differences between two setups into extraction shift, time change and yield change.
 * More coffee packs tighter (slower, stronger); more water dilutes; warmer start and higher heat extract faster;
 * a paper filter adds resistance.
 */
export function setupEffect(from: BrewSetup, to: BrewSetup): SetupEffect {
  const dCoffee = from.coffeeG > 0 ? (to.coffeeG - from.coffeeG) / from.coffeeG : 0
  const dWater = from.waterG > 0 ? (to.waterG - from.waterG) / from.waterG : 0
  const heatSteps = HEAT_ORDER.indexOf(to.heat) - HEAT_ORDER.indexOf(from.heat)

  let shift = 8 * dCoffee - 4 * dWater + 0.8 * heatSteps
  let timeFactor = (1 + 0.6 * dCoffee) * (1 + 0.8 * dWater) * (1 - 0.1 * heatSteps)

  shift += TEMP_EFFECT[to.waterTemp].shift - TEMP_EFFECT[from.waterTemp].shift
  timeFactor *= TEMP_EFFECT[to.waterTemp].time / TEMP_EFFECT[from.waterTemp].time

  if (to.paperFilter !== from.paperFilter) {
    shift += to.paperFilter ? 0.5 : -0.5
    timeFactor *= to.paperFilter ? 1.08 : 1 / 1.08
  }

  return {
    shift: clamp(shift, -6, 6),
    timeFactor: clamp(timeFactor, 0.5, 2),
    yieldDelta: to.waterG - from.waterG - ABSORPTION * (to.coffeeG - from.coffeeG),
  }
}


