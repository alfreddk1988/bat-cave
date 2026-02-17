import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MemoryLog } from '../lib/supabase'
import { Search, Filter, Plus, Brain, Lightbulb, AlertCircle, User, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

const categoryIcons = {
  decision: Brain,
  lesson: Lightbulb,
  insight: Brain,
  preference: User,
  relationship: User,
  project_update: AlertCircle
}

const importanceColors = {
  low: 'text-green-400',
  normal: 'text-blue-400',
  high: 'text-yellow-400',
  critical: 'text-red-400'
}

export function Memory() {
  const [memories, setMemories] = useState<MemoryLog[]>([])
  const [filteredMemories, setFilteredMemories] = useState<MemoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [importanceFilter, setImportanceFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')

  useEffect(() => {
    loadMemories()
  }, [])

  useEffect(() => {
    filterMemories()
  }, [memories, searchTerm, categoryFilter, importanceFilter, projectFilter])

  const loadMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('memory_log')
        .select('*')
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      setMemories(data || [])
    } catch (error) {
      console.error('Error loading memories:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMemories = () => {
    let filtered = memories

    if (searchTerm) {
      filtered = filtered.filter(memory => 
        memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(memory => memory.category === categoryFilter)
    }

    if (importanceFilter !== 'all') {
      filtered = filtered.filter(memory => memory.importance === importanceFilter)
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(memory => memory.project === projectFilter)
    }

    setFilteredMemories(filtered)
  }

  const categories = [...new Set(memories.map(m => m.category))]
  const projects = [...new Set(memories.map(m => m.project).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-3 text-gray-300">
            <div className="animate-spin">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-medium">Loading memory log...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-light text-white">Memory & Context</h1>
          <p className="text-gray-400 text-lg font-light">Searchable log of decisions, lessons, and insights</p>
        </div>
        <div className="flex space-x-4">
          <button className="btn-secondary flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filter</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search memories..."
              className="glass-input pl-12 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="glass-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          <select 
            className="glass-input"
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
          >
            <option value="all">All Importance</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <select 
            className="glass-input"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map(category => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons] || Brain
          const count = memories.filter(m => m.category === category).length
          
          return (
            <div key={category} className="metric-card group">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm capitalize font-medium">{category.replace('_', ' ')}</p>
                  <p className="text-3xl font-light text-white">{count}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Icon className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Memory Timeline */}
      <div className="space-y-6">
        {filteredMemories.map((memory) => {
          const Icon = categoryIcons[memory.category as keyof typeof categoryIcons] || Brain
          
          return (
            <div key={memory.id} className="glass-card p-6 hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-start space-x-5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 glass-card p-3 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-medium text-white leading-tight">{memory.title}</h3>
                    <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                      <span className={`text-sm font-medium glass-card px-3 py-1 ${importanceColors[memory.importance]}`}>
                        {memory.importance.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-400">
                        {format(new Date(memory.timestamp), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 font-light leading-relaxed">{memory.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="glass-card text-gray-300 px-3 py-1 text-sm capitalize font-medium">
                        {memory.category.replace('_', ' ')}
                      </span>
                      
                      {memory.project && (
                        <span className="px-3 py-1 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                          {memory.project}
                        </span>
                      )}
                    </div>
                    
                    {memory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {memory.tags.map((tag) => (
                          <span key={tag} className="glass-card text-gray-400 px-2 py-1 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredMemories.length === 0 && (
        <div className="text-center py-16">
          <div className="glass-card p-12 max-w-md mx-auto">
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-6" />
            <p className="text-gray-400 text-lg font-light">No memories found matching your filters.</p>
          </div>
        </div>
      )}
    </div>
  )
}