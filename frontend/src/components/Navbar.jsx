import { Link, NavLink } from "react-router-dom"
import { 
  LayoutDashboard, 
  Trophy, 
  ListChecks, 
  Flag, 
  Hexagon 
} from "lucide-react"

export default function Navbar() {
  return (
    <div className="sticky top-4 z-50 flex justify-center w-full px-4 mb-4">
      <nav className="flex items-center gap-1 p-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
        
        
        <Link 
          to="/" 
          className="flex items-center gap-2 pl-3 pr-2 py-1.5 mr-1 text-sm font-bold text-white hover:text-zinc-300 transition-colors"
        >
          <Hexagon className="w-4 h-4 text-blue-500 fill-blue-500/20" />
          <span className="tracking-tight">ASSESSMENT</span>
        </Link>

        
        <div className="w-px h-4 bg-zinc-800 mx-1" />

        
        <NavItem to="/" icon={LayoutDashboard}>
          Dashboard
        </NavItem>
        
        <NavItem to="/attempts" icon={ListChecks}>
          Attempts
        </NavItem>
        
        <NavItem to="/leaderboard" icon={Trophy}>
          Leaderboard
        </NavItem>
        
        <NavItem to="/flags" icon={Flag}>
          Flags
        </NavItem>

      </nav>
    </div>
  )
}


function NavItem({ to, children, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
          isActive
            ? "bg-zinc-800 text-white shadow-sm"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
        }`
      }
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{children}</span>
    </NavLink>
  )
}