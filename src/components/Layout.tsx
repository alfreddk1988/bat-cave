import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  CheckSquare, 
  DollarSign, 
  Brain, 
  Activity, 
  FileText, 
  FolderOpen,
  Zap
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Token Usage', href: '/tokens', icon: DollarSign },
  { name: 'Memory & Context', href: '/memory', icon: Brain },
  { name: 'System Health', href: '/health', icon: Activity },
  { name: 'Audit Reports', href: '/audits', icon: FileText },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
]

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 glass-sidebar relative">
        {/* Logo Area */}
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Zap className="w-8 h-8 text-indigo-400" />
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg blur opacity-75"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Bat Cave</h1>
              <p className="text-sm text-gray-400 font-light">Alfred Command Center</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-4 px-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Status Indicator */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="glass-card p-4 border-white/5">
            <div className="flex items-center space-x-3">
              <div className="pulse-dot"></div>
              <div>
                <div className="text-sm font-medium text-white">Alfred Online</div>
                <div className="text-xs text-gray-400">All systems operational</div>
              </div>
            </div>
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}