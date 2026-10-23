'use client'

import React from 'react'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  Cell
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
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis 
            type="number" 
            dataKey="rating" 
            name={t('analytics.rating_axis')} 
            unit="/10" 
            stroke="var(--muted)"
            domain={[0, 10]}
          />
          <YAxis 
            type="number" 
            dataKey={yKey} 
            name={yLabel} 
            stroke="var(--muted)" 
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line-strong)', color: 'var(--ink)' }}
          />
          <Scatter name="Brews" data={data} fill="var(--accent)">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.rating >= 8 ? 'var(--accent)' : 'var(--muted)'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

interface LineGraphProps {
  data: LinePoint[]
}

export function AnalyticsLineGraph({ data }: LineGraphProps) {
  const { t } = useLanguage()

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis 
            dataKey="index" 
            name={t('analytics.session_axis')} 
            stroke="var(--muted)" 
          />
          <YAxis 
            name={t('analytics.time_axis')} 
            unit="s" 
            stroke="var(--muted)" 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line-strong)', color: 'var(--ink)' }}
          />
          <Line 
            type="monotone" 
            dataKey="time" 
            stroke="var(--accent)" 
            strokeWidth={3}
            dot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--canvas)', strokeWidth: 2 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
