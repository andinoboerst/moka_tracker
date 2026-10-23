'use client'

import React from 'react'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
} from 'recharts'
import { useLanguage } from '@/lib/LanguageContext'

export interface ScatterPoint {
  id: string
  rating: number
  grind?: number
  roast: number
}

export interface LinePoint {
  index: number
  time: number
}

export interface RatingPoint {
  index: number
  rating: number
  avg: number
}

export interface BarPoint {
  name: string
  avg: number
  count: number
}

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--line-strong)',
  borderRadius: 8,
  color: 'var(--ink)',
  fontSize: 12,
}

const axisTick = { fontSize: 11, fill: 'var(--muted)' }

interface ScatterPlotProps {
  data: ScatterPoint[]
  yKey: string
  yLabel: string
}

export function AnalyticsScatterPlot({ data, yKey, yLabel }: ScatterPlotProps) {
  const { t } = useLanguage()

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 16, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis
            type="number"
            dataKey="rating"
            name={t('analytics.rating_axis')}
            unit="/10"
            stroke="var(--line-strong)"
            tick={axisTick}
            domain={[0, 10]}
          />
          <YAxis type="number" dataKey={yKey} name={yLabel} stroke="var(--line-strong)" tick={axisTick} />
          <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'var(--line-strong)' }} contentStyle={tooltipStyle} />
          <Scatter name="Brews" data={data} fill="var(--accent)">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.rating >= 8 ? 'var(--accent)' : 'var(--muted)'} fillOpacity={0.85} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AnalyticsLineGraph({ data }: { data: LinePoint[] }) {
  const { t } = useLanguage()

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: -8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="index" name={t('analytics.session_axis')} stroke="var(--line-strong)" tick={axisTick} />
          <YAxis name={t('analytics.time_axis')} unit="s" stroke="var(--line-strong)" tick={axisTick} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="time"
            stroke="var(--sage)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: 'var(--sage)', stroke: 'var(--surface)', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Rating of every brew over time, plus a rolling average line. */
export function RatingTrendChart({ data }: { data: RatingPoint[] }) {
  const { t } = useLanguage()

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="index" stroke="var(--line-strong)" tick={axisTick} />
          <YAxis domain={[0, 10]} stroke="var(--line-strong)" tick={axisTick} />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine y={8} stroke="var(--sage)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="rating"
            name={t('analytics.rating_axis')}
            stroke="var(--muted)"
            strokeWidth={1.5}
            dot={{ r: 3, fill: 'var(--muted)', strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="avg"
            name={t('analytics.rolling_avg')}
            stroke="var(--accent)"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Horizontal bars: average rating by bean. */
export function BeanBarChart({ data }: { data: BarPoint[] }) {
  const { t } = useLanguage()
  const height = Math.max(180, data.length * 44 + 24)

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
          <XAxis type="number" domain={[0, 10]} stroke="var(--line-strong)" tick={axisTick} />
          <YAxis type="category" dataKey="name" width={110} stroke="var(--line-strong)" tick={axisTick} interval={0} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: 'var(--line)', fillOpacity: 0.4 }}
            formatter={(value, _name, item) => [
              `${Number(value).toFixed(1)}/10 (${(item.payload as BarPoint).count}×)`,
              t('analytics.rating_axis'),
            ]}
          />
          <Bar dataKey="avg" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.avg >= 8 ? 'var(--accent)' : 'var(--line-strong)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
