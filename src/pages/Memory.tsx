import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MemoryLog } from '../lib/supabase'
import { Search, Filter, Plus, Brain, Lightbulb, AlertCircle, User } from 'lucide-react'
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
        <div className="text-gray-400">Loading memory log...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Memory & Context</h1>
          <p className="text-gray-400">Searchable log of decisions, lessons, and insights</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Memory
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search memories..."
              className="input-field pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="input-field"
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
            className="input-field"
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
            className="input-field"
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
      <div className="grid grid-cols-4 gap-6">
        {categories.map(category => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons] || Brain
          const count = memories.filter(m => m.category === category).length
          
          return (
            <div key={category} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm capitalize">{category.replace('_', ' ')}</p>
                  <p className="text-2xl font-bold text-white">{count}</p>
                </div>
                <Icon className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Memory Timeline */}
      <div className="space-y-4">
        {filteredMemories.map((memory) => {
          const Icon = categoryIcons[memory.category as keyof typeof categoryIcons] || Brain
          
          return (
            <div key={memory.id} className="card">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-white">{memory.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${importanceColors[memory.importance]}`}>
                        {memory.importance.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-400">
                        {format(new Date(memory.timestamp), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-3">{memory.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm capitalize">
                        {memory.category.replace('_', ' ')}
                      </span>
                      
                      {memory.project && (
                        <span className="bg-amber-500 text-gray-900 px-2 py-1 rounded text-sm font-medium">
                          {memory.project}
                        </span>
                      )}
                    </div>
                    
                    {memory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {memory.tags.map((tag) => (
                          <span key={tag} className="bg-gray-800 text-gray-400 px-2 py-1 rounded-full text-xs">
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
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No memories found matching your filters.</p>
        </div>
      )}
    </div>
  )
}