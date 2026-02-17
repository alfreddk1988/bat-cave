import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Project, Task, MemoryLog } from '../lib/supabase'
import { Plus, Calendar,  FileText, CheckCircle, Clock, Sparkles, FolderOpen } from 'lucide-react'
import { format } from 'date-fns'

const statusColors = {
  active: 'bg-green-400',
  paused: 'bg-yellow-400',
  completed: 'bg-blue-400',
  cancelled: 'bg-gray-400'
}

const statusBgColors = {
  active: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
  paused: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
  completed: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20',
  cancelled: 'bg-gradient-to-br from-gray-500/20 to-gray-600/20'
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectTasks, setProjectTasks] = useState<Task[]>([])
  const [projectMemories, setProjectMemories] = useState<MemoryLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadProjectDetails(selectedProject.slug)
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProjects(data || [])
      if (data && data.length > 0) {
        setSelectedProject(data[0])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectDetails = async (projectSlug: string) => {
    try {
      // Load tasks for this project
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project', projectSlug)
        .order('created_at', { ascending: false })

      setProjectTasks(tasks || [])

      // Load memories for this project
      const { data: memories } = await supabase
        .from('memory_log')
        .select('*')
        .eq('project', projectSlug)
        .order('timestamp', { ascending: false })

      setProjectMemories(memories || [])
    } catch (error) {
      console.error('Error loading project details:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-3 text-gray-300">
            <div className="animate-spin">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-medium">Loading projects...</span>
          </div>
        </div>
      </div>
    )
  }

  const taskCounts = projectTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-light text-white">Projects</h1>
          <p className="text-gray-400 text-lg font-light">Manage and track project progress</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Total Projects</p>
              <p className="text-3xl font-light text-white">{projects.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <FolderOpen className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Active</p>
              <p className="text-3xl font-light text-green-400">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Completed</p>
              <p className="text-3xl font-light text-blue-400">
                {projects.filter(p => p.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Tasks</p>
              <p className="text-3xl font-light text-purple-400">{projectTasks.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project List */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-light text-white mb-6">All Projects</h3>
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`glass-card p-5 cursor-pointer transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5 ${
                  selectedProject?.id === project.id ? 'ring-2 ring-indigo-500/50' : ''
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <h4 className="font-medium text-white">{project.name}</h4>
                    <p className="text-sm text-gray-400 font-light">{project.slug}</p>
                  </div>
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded-full ${statusBgColors[project.status as keyof typeof statusBgColors]}`}>
                    <div className={`w-2 h-2 rounded-full ${statusColors[project.status as keyof typeof statusColors]}`}></div>
                    <span className="text-xs font-medium text-white capitalize">{project.status}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 font-light leading-relaxed mb-3">
                  {project.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Created {format(new Date(project.updated_at), 'MMM dd')}</span>
                  {project.updated_at && (
                    <span>Updated {format(new Date(project.updated_at), 'MMM dd')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Details */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="space-y-8">
              {/* Project Header */}
              <div className="glass-card p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-light text-white">{selectedProject.name}</h2>
                    <p className="text-gray-400">{selectedProject.slug}</p>
                  </div>
                  <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl ${statusBgColors[selectedProject.status as keyof typeof statusBgColors]}`}>
                    <div className={`w-3 h-3 rounded-full ${statusColors[selectedProject.status as keyof typeof statusColors]}`}></div>
                    <span className="font-medium text-white capitalize">{selectedProject.status}</span>
                  </div>
                </div>
                
                <p className="text-gray-300 font-light leading-relaxed mb-6">
                  {selectedProject.description}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created {format(new Date(selectedProject.updated_at), 'MMM dd, yyyy')}</span>
                  </div>
                  {selectedProject.updated_at && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Updated {format(new Date(selectedProject.updated_at), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Task Summary */}
              <div className="glass-card p-8">
                <h3 className="text-xl font-light text-white mb-6">Task Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-light text-green-400">{taskCounts.done || 0}</div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-light text-blue-400">{taskCounts.in_progress || 0}</div>
                    <div className="text-sm text-gray-400">In Progress</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-light text-yellow-400">{taskCounts.pending || 0}</div>
                    <div className="text-sm text-gray-400">Pending</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-light text-red-400">{taskCounts.blocked || 0}</div>
                    <div className="text-sm text-gray-400">Blocked</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {projectTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="glass-card p-4 hover:bg-white/5 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">{task.title}</h4>
                          <p className="text-sm text-gray-400 font-light">{task.description}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium glass-card ${
                          task.status === 'done' ? 'text-green-400' :
                          task.status === 'in_progress' ? 'text-blue-400' :
                          task.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Memories */}
              <div className="glass-card p-8">
                <h3 className="text-xl font-light text-white mb-6">Project Memories</h3>
                {projectMemories.length > 0 ? (
                  <div className="space-y-4">
                    {projectMemories.slice(0, 3).map((memory) => (
                      <div key={memory.id} className="glass-card p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-white">{memory.title}</h4>
                          <span className="text-xs text-gray-400">
                            {format(new Date(memory.timestamp), 'MMM dd')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 font-light leading-relaxed">
                          {memory.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-light">No memories logged for this project yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-6" />
              <p className="text-gray-400 text-lg font-light">Select a project to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}