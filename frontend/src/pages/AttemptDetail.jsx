import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { 
  ArrowLeft, 
  User, 
  FileText, 
  RotateCw, 
  Flag, 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Code,
  Calendar,
  AlertTriangle
} from "lucide-react"
import { getAttemptDetail, recomputeAttempt, flagAttempt } from "../api/api"

export default function AttemptDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [attempt, setAttempt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false) 
  const [flagReason, setFlagReason] = useState("")

  useEffect(() => {
    fetchAttempt()
  }, [id])

  const fetchAttempt = async () => {
  try {
    const res = await getAttemptDetail(id)
    setAttempt(res.data)
  } catch (err) {
    console.error("Error loading attempt", err)
  } finally {
    setLoading(false)
  }
}


  const handleRecompute = async () => {
    if(!window.confirm("Recalculate score for this attempt?")) return;
    setProcessing(true)
    try {
      await recomputeAttempt(id)
      await fetchAttempt()
    } catch (err) {
      alert("Recompute failed")
    } finally {
      setProcessing(false)
    }
  }

  const handleFlag = async () => {
    if (!flagReason) return alert("Please enter a reason for flagging.")
    setProcessing(true)
    try {
      await flagAttempt(id, flagReason)
      setFlagReason("")
      await fetchAttempt()
    } catch (err) {
      alert("Flagging failed")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-12 w-12 bg-zinc-900 rounded-full"></div>
        <p>Loading attempt data...</p>
      </div>
    </div>
  )

  if (!attempt) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
      <AlertTriangle className="w-12 h-12 mb-4 text-red-500" />
      <h2 className="text-xl text-white font-bold">Attempt Not Found</h2>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-400 hover:underline">Go Back</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- Header & Nav --- */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-sm text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Attempts
            </button>
            
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Attempt Details
              </h1>
              <StatusBadge status={attempt.status} />
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-600" />
                <span className="text-zinc-200">{attempt.student_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-600" />
                <span className="text-zinc-200">{attempt.test_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-600" />
                <span>{new Date(attempt.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
             <button
              disabled={processing}
              onClick={handleRecompute}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm font-medium transition-all text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
              Recompute Score
            </button>
          </div>
        </div>

        {/* --- Score Cards Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ScoreCard 
            label="Total Score" 
            value={attempt.score ?? 0} 
            subValue="Points"
            color="text-white"
            bg="bg-zinc-900"
          />
          <ScoreCard 
            label="Accuracy" 
            value={`${attempt.accuracy ?? 0}%`} 
            subValue="Precision"
            color="text-blue-400"
            bg="bg-blue-500/5"
            border="border-blue-500/20"
          />
           <ScoreCard 
            label="Net Correct" 
            value={attempt.net_correct ?? 0} 
            subValue="Correct - Wrong"
            color="text-emerald-400"
            bg="bg-emerald-500/5"
            border="border-emerald-500/20"
          />
          
          {/* Mini Breakdown Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-zinc-400"><CheckCircle className="w-3 h-3 text-emerald-500"/> Correct</span>
              <span className="font-mono text-white">{attempt.correct}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-zinc-400"><XCircle className="w-3 h-3 text-red-500"/> Wrong</span>
              <span className="font-mono text-white">{attempt.wrong}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-zinc-400"><MinusCircle className="w-3 h-3 text-zinc-500"/> Skipped</span>
              <span className="font-mono text-white">{attempt.skipped}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* --- Left Col: Raw Payload (Dev View) --- */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold">
              <Code className="w-5 h-5 text-zinc-500" />
              <h3>Ingested Payload</h3>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-mono">JSON Preview</span>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-400 leading-relaxed max-h-[400px]">
                {JSON.stringify(attempt.raw_payload || {}, null, 2)}
              </pre>
            </div>
          </div>

          {/* --- Right Col: Moderation --- */}
          <div className="space-y-6">
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4 text-zinc-100 font-semibold">
                  <Flag className="w-5 h-5 text-red-500" />
                  <h3>Moderation</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Flag Reason</label>
                    <textarea 
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      placeholder="Describe why this attempt is invalid..."
                      className="w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 outline-none resize-none h-24"
                    />
                  </div>
                  <button 
                    onClick={handleFlag}
                    disabled={processing || !flagReason}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? "Processing..." : "Flag Attempt"}
                  </button>
                </div>
             </div>

             {/* Metadata Info */}
             <div className="px-4 py-2">
               <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">System Meta</h4>
               <ul className="space-y-2 text-sm text-zinc-400">
                 <li className="flex justify-between">
                   <span>Attempt ID</span>
                   <span className="font-mono text-xs text-zinc-600">{attempt.attempt_id?.substring(0,8)}...</span>
                 </li>
                 <li className="flex justify-between">
                   <span>Is Duplicate?</span>
                   <span className={attempt.duplicate_of_attempt_id ? "text-red-400" : "text-zinc-600"}>
                     {attempt.duplicate_of_attempt_id ? "Yes" : "No"}
                   </span>
                 </li>
               </ul>
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// --- Sub Components ---

function ScoreCard({ label, value, subValue, color, bg, border = "border-zinc-800" }) {
  return (
    <div className={`${bg} border ${border} rounded-xl p-5 flex flex-col justify-between`}>
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
      <div className="mt-2">
        <span className={`text-3xl font-bold tracking-tight ${color}`}>{value}</span>
        <span className="text-zinc-600 text-xs ml-2">{subValue}</span>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    SCORED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    DEDUPED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    FLAGGED: "bg-red-500/10 text-red-400 border-red-500/20",
    INGESTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  }
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-zinc-800 text-zinc-500 border-zinc-700"}`}>
      {status}
    </span>
  )
}