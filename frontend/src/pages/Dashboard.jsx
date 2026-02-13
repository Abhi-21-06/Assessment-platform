import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { 
  Users, 
  FileText, 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  RefreshCcw 
} from "lucide-react"
import { getStudents, getTests, getAttempts, getFlags } from "../api/api"

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    tests: 0,
    attempts: 0,
    flagged: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      
      const results = await Promise.allSettled([
        getStudents(),
        getTests(),
        getAttempts(),
        getFlags(),
      ])
      
      setStats({
        students: results[0].status === 'fulfilled' ? results[0].value.data.length : 0,
        tests: results[1].status === 'fulfilled' ? results[1].value.data.length : 0,
        attempts: results[2].status === 'fulfilled' ? (results[2].value.data.total || 0) : 0,
        flagged: results[3].status === 'fulfilled' ? results[3].value.data.length : 0,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans selection:bg-zinc-700">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-zinc-500 mt-1 text-sm">Assessment Operations Platform</p>
          </div>
          <button 
            onClick={fetchStats}
            className="p-2 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white transition-all"
            title="Refresh Data"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard 
            label="Total Students" 
            value={stats.students} 
            loading={loading}
          />
          <StatCard 
            label="Active Tests" 
            value={stats.tests} 
            loading={loading} 
          />
          <StatCard 
            label="Total Attempts" 
            value={stats.attempts} 
            loading={loading} 
          />
          <StatCard 
            label="Flagged Issues" 
            value={stats.flagged} 
            loading={loading}
            highlight={stats.flagged > 0} 
          />
        </div>

        {/* Navigation Grid */}
        <h2 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-6">Menu</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <NavCard 
            to="/leaderboard" 
            title="Leaderboard" 
            icon={Activity}
            desc="Rankings & Metrics"
          />
          <NavCard 
            to="/attempts" 
            title="Attempts" 
            icon={FileText}
            desc="Review Submissions"
          />
          <NavCard 
            to="/tests" 
            title="Tests" 
            icon={Users}
            desc="Manage Assessments"
          />
        </div>
      </div>
    </div>
  )
}

// --- Components ---

function StatCard({ label, value, loading, highlight }) {
  if (loading) {
    return <div className="h-32 bg-zinc-900/50 rounded-xl animate-pulse" />
  }

  return (
    <div className={`p-6 rounded-xl border transition-all duration-300 ${
      highlight 
        ? 'bg-red-500/10 border-red-500/20 text-red-200' 
        : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700 text-zinc-100'
    }`}>
      <p className={`text-sm font-medium mb-1 ${highlight ? 'text-red-400' : 'text-zinc-500'}`}>
        {label}
      </p>
      <p className="text-4xl font-bold tracking-tighter">
        {value}
      </p>
    </div>
  )
}

function NavCard({ to, title, icon: Icon, desc }) {
  return (
    <Link 
      to={to} 
      className="group relative p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 hover:border-zinc-700 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-zinc-950 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-zinc-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
      </div>
      
      <h3 className="text-lg font-semibold text-zinc-200 group-hover:text-white">
        {title}
      </h3>
      <p className="text-sm text-zinc-500 mt-1 group-hover:text-zinc-400">
        {desc}
      </p>
    </Link>
  )
}