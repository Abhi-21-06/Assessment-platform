import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Search, 
  Filter, 
  RefreshCcw, 
  Eye, 
  FileText, 
  Copy
} from "lucide-react"
import { getAttempts, getTests } from "../api/api"

export default function Attempts() {

  const navigate = useNavigate()

  // Data State
  const [attempts, setAttempts] = useState([])
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter State
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [testId, setTestId] = useState("")
  const [hasDuplicates, setHasDuplicates] = useState("")

  // Load Tests
  useEffect(() => {
    const loadTests = async () => {
      try {
        const res = await getTests()
        setTests(res.data)
      } catch (err) {
        console.error("Failed to load tests", err)
      }
    }
    loadTests()
  }, [])

  // Fetch Attempts
  const fetchAttempts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAttempts({
        search,
        status: status || undefined,
        test_id: testId || undefined,
        has_duplicates: hasDuplicates === "" ? undefined : hasDuplicates
      })

      setAttempts(Array.isArray(res.data) ? res.data : (res.data.data || []))
    } catch (error) {
      console.error("Error fetching attempts", error)
    } finally {
      setLoading(false)
    }
  }, [search, status, testId, hasDuplicates])

  useEffect(() => {
    fetchAttempts()
  }, [fetchAttempts])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Attempts</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Review student performance and data quality
            </p>
          </div>

          <button 
            onClick={fetchAttempts}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 pl-10 pr-4 py-2 rounded-lg outline-none"
            />
          </div>

          {/* Status */}
          <SelectWrapper icon={Filter}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
            >
              <option value="">All Statuses</option>
              <option value="SCORED">Scored</option>
              <option value="DEDUPED">Deduped</option>
              <option value="FLAGGED">Flagged</option>
              <option value="INGESTED">Ingested</option>
            </select>
          </SelectWrapper>

          {/* Test */}
          <SelectWrapper icon={FileText}>
            <select
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
            >
              <option value="">All Tests</option>
              {tests.map((test) => (
                <option key={test.test_id} value={test.test_id}>
                  {test.name}
                </option>
              ))}
            </select>
          </SelectWrapper>

          {/* Duplicates */}
          <SelectWrapper icon={Copy}>
            <select
              value={hasDuplicates}
              onChange={(e) => setHasDuplicates(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
            >
              <option value="">All Records</option>
              <option value="true">Has Duplicates</option>
              <option value="false">Unique Only</option>
            </select>
          </SelectWrapper>

        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {loading && attempts.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              Loading...
            </div>
          ) : attempts.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              No attempts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Test</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Score</th>
                    <th className="px-6 py-4 text-center">Duplicate</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-800">
                  {attempts.map((a) => (
                    <tr
                      key={a.attempt_id}
                      onClick={() => navigate(`/attempts/${a.attempt_id}`)}
                      className="hover:bg-zinc-800 cursor-pointer transition"
                    >
                      <td className="px-6 py-4 font-medium">
                        {a.student_name || "Unknown"}
                      </td>

                      <td className="px-6 py-4 text-zinc-400">
                        {a.test_name || "Unknown Test"}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={a.status} />
                      </td>

                      <td className="px-6 py-4 text-right font-mono">
                        {a.score ?? "—"}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {a.duplicate_of_attempt_id ? "Yes" : "-"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation() // 🔥 prevents row click double trigger
                            navigate(`/attempts/${a.attempt_id}`)
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// -------- Status Badge --------
function StatusBadge({ status }) {
  const styles = {
    SCORED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    DEDUPED: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    FLAGGED: "bg-red-500/10 text-red-400 border border-red-500/20",
    INGESTED: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-zinc-800 text-zinc-500"}`}>
      {status}
    </span>
  )
}

// -------- Select Wrapper --------
function SelectWrapper({ children, icon: Icon }) {
  return (
    <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2">
      <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
      {children}
    </div>
  )
}

