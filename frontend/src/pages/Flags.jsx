import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Flag, Loader2, Eye } from "lucide-react"
import { getFlags } from "../api/api"

export default function Flags() {
  const navigate = useNavigate()

  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    try {
      const res = await getFlags()
      setFlags(res.data)
    } catch (err) {
      console.error("Error loading flags", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Flag className="w-7 h-7 text-red-500" />
            Flagged Attempts
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Attempts requiring manual review
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading flags...
          </div>
        )}

        {/* Empty State */}
        {!loading && flags.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            🎉 No flagged attempts found.
          </div>
        )}

        {/* Table */}
        {!loading && flags.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 text-left">Student</th>
                  <th className="px-6 py-4 text-left">Test</th>
                  <th className="px-6 py-4 text-left">Reason</th>
                  <th className="px-6 py-4 text-left">Flagged At</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {flags.map((flag) => (
                  <tr key={flag.flag_id} className="hover:bg-zinc-800/40">
                    
                    <td className="px-6 py-4 text-zinc-200">
                      {flag.student_name}
                    </td>

                    <td className="px-6 py-4 text-zinc-400">
                      {flag.test_name}
                    </td>

                    <td className="px-6 py-4 text-red-400">
                      {flag.reason}
                    </td>

                    <td className="px-6 py-4 text-zinc-500 text-xs">
                      {new Date(flag.created_at).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/attempts/${flag.attempt_id}`)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
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
  )
}

