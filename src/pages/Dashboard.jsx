import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Users, TrendingUp, CreditCard, Award, CheckCircle, Clock, ArrowUpRight, ArrowDownLeft, Zap, Target, Award as AwardIcon, BarChart3 } from 'lucide-react'

const StatCard = ({ icon: Icon, title, value, subtitle, trend, color, bgColor, gradient }) => (
  <div className={`${bgColor} ${gradient} rounded-lg p-6 border hover:border-gray-300 transition-all duration-300 group hover:shadow-md cursor-pointer`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {trend.isPositive ? (
            <ArrowUpRight className="w-4 h-4 text-green-600" />
          ) : (
            <ArrowDownLeft className="w-4 h-4 text-red-600" />
          )}
          <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
            {trend.percentage}%
          </span>
        </div>
      )}
    </div>
    <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">{title}</h3>
    <p className="text-xl font-bold text-gray-900 mb-2">{value}</p>
    {subtitle && <p className="text-xs text-gray-600 font-medium">{subtitle}</p>}
  </div>
)

const ChartCard = ({ title, subtitle, children, gradient }) => (
  <div className={`${gradient || 'bg-white'} rounded-lg p-6 border border-gray-200 hover:shadow-md transition-all duration-300`}>
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-600 font-medium mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
)

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalLeads: 0,
    acceptedApplications: 0,
    interviewsScheduled: 0,
    leadsThisMonth: 0,
    conversionRate: 0,
    avgResponseTime: 0
  })
  const [recentLeads, setRecentLeads] = useState([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      const leadsRes = await api.get('/leads')
      const leadsArray = leadsRes.data.data || []

      const totalLeads = leadsArray.length
      const accepted = leadsArray.filter(l => l.application_status === 'ACCEPTED').length
      const interviewScheduled = leadsArray.filter(l => l.application_status === 'INTERVIEW_SCHEDULED').length
      const leadsThisMonth = leadsArray.filter(l => {
        const date = new Date(l.created_at)
        const now = new Date()
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }).length

      const conversionRate = totalLeads > 0 ? Math.round((accepted / totalLeads) * 100) : 0

      setStats({
        totalLeads,
        acceptedApplications: accepted,
        interviewsScheduled: interviewScheduled,
        leadsThisMonth,
        conversionRate,
        avgResponseTime: 24
      })

      // Generate chart data
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        const dayLeads = leadsArray.filter(l => {
          const leadDate = new Date(l.created_at)
          return leadDate.toLocaleDateString() === date.toLocaleDateString()
        }).length
        last7Days.push({ name: dayName, leads: dayLeads, target: 2 })
      }
      setChartData(last7Days)

      setRecentLeads(leadsArray.slice(0, 6).reverse())
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch dashboard data'
      setError(errorMsg)
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const paymentStats = [
    { name: 'Paid', value: 45, fill: '#10b981' },
    { name: 'Pending', value: 35, fill: '#f59e0b' },
    { name: 'Failed', value: 20, fill: '#ef4444' }
  ]

  if (loading && recentLeads.length === 0) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-indigo-600 animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-8 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-16 bg-white/80 backdrop-blur-sm z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-gray-900">
                📊 Dashboard
              </h1>
              <p className="text-xs text-gray-600 font-medium">Welcome back! Real-time admission analytics</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="px-4 py-2 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-xs text-green-800 font-medium">Live Data</p>
              </div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Leads"
            value={stats.totalLeads}
            subtitle={`${stats.leadsThisMonth} this month`}
            trend={{ isPositive: true, percentage: 12 }}
            color="bg-indigo-600"
            bgColor="bg-white"
            gradient="border-gray-200"
          />
          <StatCard
            icon={CheckCircle}
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            subtitle={`${stats.acceptedApplications} accepted`}
            trend={{ isPositive: true, percentage: 8 }}
            color="bg-emerald-600"
            bgColor="bg-white"
            gradient="border-gray-200"
          />
          <StatCard
            icon={Clock}
            title="Interviews"
            value={stats.interviewsScheduled}
            subtitle="Scheduled & pending"
            trend={{ isPositive: true, percentage: 5 }}
            color="bg-cyan-600"
            bgColor="bg-white"
            gradient="border-gray-200"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ChartCard 
              title="Lead Generation Trend" 
              subtitle="Last 7 days"
            >
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '2px solid #a855f7',
                      borderRadius: '0.5rem',
                      color: '#111827'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#a855f7" 
                    strokeWidth={3}
                    fill="url(#colorLeads)"
                    dot={{ fill: '#a855f7', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div>
            <ChartCard 
              title="Payment Status" 
              subtitle="Current distribution"
            >
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '2px solid #f59e0b',
                      borderRadius: '0.5rem',
                      color: '#111827'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        {/* Recent Leads Table */}
        <ChartCard 
          title="Recent Leads" 
          subtitle="Latest student registrations"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Counselor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentLeads && recentLeads.length > 0 ? (
                  recentLeads.map((lead, idx) => (
                    <tr key={lead.id ?? idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                        >
                          {lead.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 truncate">{lead.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded inline-flex items-center gap-1 ${
                          lead.application_status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : lead.application_status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : lead.application_status === 'INTERVIEW_SCHEDULED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lead.application_status === 'ACCEPTED' && '✓'}
                          {lead.application_status === 'REJECTED' && '✕'}
                          {lead.application_status === 'INTERVIEW_SCHEDULED' && '◐'}
                          {!lead.application_status && '●'}
                          {lead.application_status || 'NEW'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">{lead.counselor_name || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-xs text-gray-500">
                      No leads available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
