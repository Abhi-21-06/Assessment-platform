import { useEffect, useState } from "react"
import { Trophy, Loader2, Award } from "lucide-react"
import { getTests, getLeaderboard } from "../api/api"

export default function Leaderboard() {
  const [tests, setTests] = useState([])
  const [selectedTest, setSelectedTest] = useState("")
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(false)

  // 1. Load Tests
  useEffect(() => {
    getTests().then((res) => setTests(res.data)).catch(console.error)
  }, [])

  // 2. Load Leaderboard (Direct String ID logic)
  useEffect(() => {
    if (!selectedTest) {
      setLeaders([])
      return
    }

    setLoading(true)
    getLeaderboard(selectedTest)
      .then((res) => {
        setLeaders(res.data || [])
      })
      .catch((err) => {
        console.error(err)
        setLeaders([])
      })
      .finally(() => setLoading(false))
  }, [selectedTest])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header & Filter */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-zinc-500" />
            Leaderboard
          </h1>

          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-sm rounded-lg px-4 py-2 outline-none focus:border-zinc-600 min-w-[200px]"
          >
            <option value="">Select Assessment...</option>
            {tests.map((t) => (
              <option key={t.test_id} value={t.test_id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Content Area */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          
          {/* State 1: Loading */}
          {loading && (
            <div className="p-12 flex justify-center text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          {/* State 2: No Test Selected */}
          {!loading && !selectedTest && (
            <div className="p-12 text-center text-zinc-500 text-sm">
              Select an assessment to view rankings.
            </div>
          )}

          {/* State 3: Empty Data */}
          {!loading && selectedTest && leaders.length === 0 && (
            <div className="p-12 text-center text-zinc-500 text-sm">
              No results found for this test.
            </div>
          )}

          {/* State 4: Data Table */}
          {!loading && leaders.length > 0 && (
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-950/50 text-zinc-500 font-medium border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3 w-16">#</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3 text-right">Score</th>
                  <th className="px-6 py-3 text-right">Accuracy</th>
                  <th className="px-6 py-3 text-right">Net Correct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {leaders.map((item, index) => {
                  const rank = index + 1
                  const isTop = rank <= 3
                  
                  return (
                    <tr key={index} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-zinc-500">
                        {isTop ? (
                          <span className={`font-bold ${
                            rank === 1 ? "text-yellow-500" : 
                            rank === 2 ? "text-zinc-300" : "text-amber-700"
                          }`}>
                            #{rank}
                          </span>
                        ) : (
                          <span>{rank}</span>
                        )}
                      </td>
                      <td className="px-6 py-3 font-medium text-zinc-200">
                        {item.student_name}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-zinc-100 font-semibold">
                        {item.score}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-zinc-400">
                        {item.accuracy}%
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-zinc-400">
                        {item.net_correct}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
