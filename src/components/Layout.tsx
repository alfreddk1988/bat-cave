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
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <Zap className="w-8 h-8 text-amber-500" />
            <h1 className="text-xl font-bold text-amber-500">Bat Cave</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">Alfred Command Center</p>
        </div>
        
        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  isActive
                    ? 'bg-amber-500 text-gray-900'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Alfred Online</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}