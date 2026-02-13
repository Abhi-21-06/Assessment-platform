import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FileText, Loader2, ChevronRight } from "lucide-react"
import { getTests } from "../api/api"

export default function Tests() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTests()
      .then((res) => setTests(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-zinc-500" />
            Assessments
          </h1>
          <span className="text-sm text-zinc-500 font-mono">
            {tests.length} Total
          </span>
        </div>

        {/* Content Area */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          
          {loading && (
            <div className="p-12 flex justify-center text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          {!loading && tests.length === 0 && (
            <div className="p-12 text-center text-zinc-500 text-sm">
              No tests found.
            </div>
          )}

          {!loading && tests.length > 0 && (
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-950/50 text-zinc-500 font-medium border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3">Test Name</th>
                  <th className="px-6 py-3 text-right">Max Marks</th>
                  <th className="px-6 py-3 text-right">Attempts</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {tests.map((test) => (
                  <tr key={test.test_id} className="hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-zinc-200">
                      {test.name}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400">
                      {test.max_marks}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400">
                      {test.total_attempts || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/leaderboard?test_id=${test.test_id}`}
                        className="inline-flex items-center text-xs text-blue-500 hover:text-blue-400 font-medium"
                      >
                        Leaderboard <ChevronRight className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}