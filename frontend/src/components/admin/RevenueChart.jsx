import { useMemo, useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip
} from 'chart.js'
import { motion } from 'framer-motion'
import { adminService } from '../../services/adminService'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

const chartDefaults = (suggestedMax) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600 },
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'DM Sans', size: 11 }, maxRotation: 0, maxTicksLimit: 15 },
    },
    y: {
      min: 0,
      suggestedMax: suggestedMax ? Math.max(suggestedMax * 1.1, 1) : undefined,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { font: { family: 'DM Sans', size: 11 } },
    },
  },
})

function RevenueChartCard({ data }) {
  const months = data?.map(d => d.month) || []
  const values = data?.map(d => Number(d.revenue) || 0) || []
  const maxVal = Math.max(...values, 1)

  const chartData = useMemo(() => ({
    labels: months,
    datasets: [{
      label: 'Revenue (₹)',
      data: values,
      backgroundColor: 'rgba(20,184,166,0.7)',
      borderColor: '#14b8a6',
      borderWidth: 1,
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(20,184,166,0.9)',
    }],
  }), [JSON.stringify({ months, values })])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft overflow-hidden"
    >
      <h3 className="font-display font-semibold text-gray-900 mb-4 text-base">Revenue</h3>
      <div className="h-[220px] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-50/30 to-transparent pointer-events-none rounded-xl" />
        <Bar data={chartData} options={chartDefaults(maxVal)} />
      </div>
    </motion.div>
  )
}

function OrdersChartCard({ data }) {
  const months = data?.map(d => d.month) || []
  const values = data?.map(d => Number(d.orders) || 0) || []
  const maxVal = Math.max(...values, 1)

  const chartData = useMemo(() => ({
    labels: months,
    datasets: [{
      label: 'Orders',
      data: values,
      backgroundColor: 'rgba(99,102,241,0.7)',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(99,102,241,0.9)',
    }],
  }), [JSON.stringify({ months, values })])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft overflow-hidden"
    >
      <h3 className="font-display font-semibold text-gray-900 mb-4 text-base">Order</h3>
      <div className="h-[220px] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none rounded-xl" />
        <Bar data={chartData} options={chartDefaults(maxVal)} />
      </div>
    </motion.div>
  )
}

function getDefaultDays() {
  const d = new Date()
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => ({ month: String(i + 1), orders: 0, revenue: 0 }))
}

export default function RevenueChart({ data }) {
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    adminService.getChartData()
      .then(r => {
        const daily = r.data?.monthly_data ?? []
        setChartData(Array.isArray(daily) && daily.length > 0 ? daily : null)
      })
      .catch(() => setChartData(null))
  }, [])

  const displayData = chartData ?? (Array.isArray(data) && data.length > 0 ? data : null) ?? getDefaultDays()
  return (
    <div>
      <h3 className="font-display font-semibold text-gray-900 mb-4">This Month – Daily Overview</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChartCard data={displayData} />
        <OrdersChartCard data={displayData} />
      </div>
    </div>
  )
}
