import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function RevenueChart({ data }) {
  const months = data?.map(d => d.month) || []
  const revenue = data?.map(d => d.revenue) || []
  const orders = data?.map(d => d.orders) || []

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: revenue,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20,184,166,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#14b8a6',
      },
      {
        label: 'Orders',
        data: orders,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { family: 'DM Sans' }, boxWidth: 12 } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 12 } } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { family: 'DM Sans', size: 12 } } }
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
      <h3 className="font-display font-semibold text-gray-900 mb-4">Monthly Overview</h3>
      <Line data={chartData} options={options} />
    </div>
  )
}
