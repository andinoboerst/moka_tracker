/**
 * Pressure profile of an espresso shot: an ordered list of stages.
 *  - preinfusion / hold: pressure stays flat at `pressure_bar`
 *  - ramp / decline:     pressure moves linearly from the previous stage's pressure to `pressure_bar`
 */
export const PRESSURE_STAGE_TYPES = ['preinfusion', 'ramp', 'hold', 'decline'] as const
export type PressureStageType = (typeof PRESSURE_STAGE_TYPES)[number]

export interface PressureStage {
  type: PressureStageType
  duration_s: number
  pressure_bar: number
}

export const MAX_PRESSURE_STAGES = 12

export const isRamping = (type: PressureStageType) => type === 'ramp' || type === 'decline'

/** Validates untrusted input. Returns null for "no profile", or an error string. */
export function parsePressureProfile(input: unknown): { profile: PressureStage[] | null } | { error: string } {
  if (input === undefined || input === null || (Array.isArray(input) && input.length === 0)) return { profile: null }
  if (!Array.isArray(input) || input.length > MAX_PRESSURE_STAGES) return { error: 'Invalid pressure profile' }
  const profile: PressureStage[] = []
  for (const raw of input) {
    const type = (raw as PressureStage)?.type
    const duration = Number((raw as PressureStage)?.duration_s)
    const pressure = Number((raw as PressureStage)?.pressure_bar)
    if (
      !(PRESSURE_STAGE_TYPES as readonly string[]).includes(type) ||
      !Number.isFinite(duration) || duration <= 0 || duration > 600 ||
      !Number.isFinite(pressure) || pressure < 0 || pressure > 20
    ) {
      return { error: 'Invalid pressure profile' }
    }
    profile.push({ type, duration_s: Math.round(duration * 10) / 10, pressure_bar: Math.round(pressure * 10) / 10 })
  }
  return { profile }
}

export const profileDuration = (profile: PressureStage[]) =>
  Math.round(profile.reduce((sum, s) => sum + s.duration_s, 0) * 10) / 10

export const profilePeak = (profile: PressureStage[]) => Math.max(0, ...profile.map((s) => s.pressure_bar))

/** Curve vertices as [seconds, bar]. Flat stages start at their own pressure; ramps start at the previous one. */
export function profilePoints(profile: PressureStage[]): [number, number][] {
  const points: [number, number][] = []
  let t = 0
  let prev = 0
  profile.forEach((stage, i) => {
    const start = isRamping(stage.type) && i > 0 ? prev : stage.pressure_bar
    points.push([t, start])
    t += stage.duration_s
    points.push([t, stage.pressure_bar])
    prev = stage.pressure_bar
  })
  return points
}

/** Short text such as "10s @ 3 bar → 4s to 9 bar → 15s @ 9 bar": "@" holds a pressure, "to" moves towards it. */
export function describeProfile(profile: PressureStage[]): string {
  return profile
    .map((s) => `${s.duration_s}s ${isRamping(s.type) ? 'to' : '@'} ${s.pressure_bar} bar`)
    .join(' → ')
}
