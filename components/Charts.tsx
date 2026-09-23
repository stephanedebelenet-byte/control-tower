'use client'

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface FuelData {
  time: string
  consumption: number
  avg: number
}

interface EcoScoreData {
  date: string
  score: number
  speed: number
  acceleration: number
  braking: number
}

export function FuelConsumptionChart({ data }: { data: FuelData[] }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-bold text-cyan-400 mb-4">Fuel Consumption</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ background: '#1F2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#E5E7EB' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="consumption"
            stroke="#06B6D4"
            dot={false}
            strokeWidth={2}
            name="Current"
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#6B7280"
            dot={false}
            strokeWidth={1}
            strokeDasharray="5 5"
            name="Fleet Avg"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EcoScoreChart({ data }: { data: EcoScoreData[] }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-bold text-cyan-400 mb-4">Eco-Score Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ background: '#1F2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#E5E7EB' }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.3}
            name="Eco-Score"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PerformanceBreakdownChart({ data }: { data: EcoScoreData }) {
  const chartData = [
    { name: 'Speed', value: data.speed },
    { name: 'Acceleration', value: data.acceleration },
    { name: 'Braking', value: data.braking },
  ]

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-bold text-cyan-400 mb-4">Performance Breakdown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ background: '#1F2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#E5E7EB' }}
          />
          <Bar dataKey="value" fill="#06B6D4" name="Score" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
