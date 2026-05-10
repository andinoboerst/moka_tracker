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

interface ScatterPlotProps {
  data: any[]
  yKey: string
  yLabel: string
}

export function AnalyticsScatterPlot({ data, yKey, yLabel }: ScatterPlotProps) {
  const { t } = useLanguage()

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3d3530" />
          <XAxis 
            type="number" 
            dataKey="rating" 
            name={t('analytics.rating_axis')} 
            unit="/10" 
            stroke="#8b6f47"
            domain={[0, 10]}
          />
          <YAxis 
            type="number" 
            dataKey={yKey} 
            name={yLabel} 
            stroke="#8b6f47" 
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#2d2520', border: '1px solid #5a4f4a', color: '#f5f1ed' }}
          />
          <Scatter name="Brews" data={data} fill="#d4a574">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.rating >= 8 ? '#d4a574' : '#8b6f47'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

interface LineGraphProps {
  data: any[]
}

export function AnalyticsLineGraph({ data }: LineGraphProps) {
  const { t } = useLanguage()

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3d3530" />
          <XAxis 
            dataKey="index" 
            name={t('analytics.session_axis')} 
            stroke="#8b6f47" 
          />
          <YAxis 
            name={t('analytics.time_axis')} 
            unit="s" 
            stroke="#8b6f47" 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#2d2520', border: '1px solid #5a4f4a', color: '#f5f1ed' }}
          />
          <Line 
            type="monotone" 
            dataKey="time" 
            stroke="#d4a574" 
            strokeWidth={3}
            dot={{ r: 6, fill: '#d4a574', stroke: '#1a1410', strokeWidth: 2 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
