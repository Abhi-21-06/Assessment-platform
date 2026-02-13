import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Leaderboard from "./pages/Leaderboard"
import Attempts from "./pages/Attempts"
import Tests from "./pages/Tests"
import Flags from "./pages/Flags"
import Navbar from "./components/Navbar"
import AttemptDetail from "./pages/AttemptDetail"




function App() {
  return (
    <BrowserRouter>
      
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <main className="pt-5">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/attempts" element={<Attempts />} />
          <Route path="/attempts/:id" element={<AttemptDetail />} />
          <Route path="/flags" element={<Flags />} />
        </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
