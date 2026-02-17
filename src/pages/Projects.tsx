import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Project, Task, MemoryLog } from '../lib/supabase'
import { Plus, Calendar, Users, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

const statusColors = {
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-gray-500'
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
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectDetails = async (slug: string) => {
    try {
      // Load tasks for this project
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project', slug)
        .order('created_at', { ascending: false })
      
      setProjectTasks(tasks || [])

      // Load memory entries for this project
      const { data: memories } = await supabase
        .from('memory_log')
        .select('*')
        .eq('project', slug)
        .order('timestamp', { ascending: false })
      
      setProjectMemories(memories || [])

    } catch (error) {
      console.error('Error loading project details:', error)
    }
  }

  // Calculate project stats
  const getProjectStats = (project: Project) => {
    const tasks = projectTasks.filter(t => t.project === project.slug)
    const activeTasks = tasks.filter(t => ['pending', 'in_progress'].includes(t.status))
    const completedTasks = tasks.filter(t => t.status === 'done')
    const blockedTasks = tasks.filter(t => t.status === 'blocked')
    
    return {
      totalTasks: tasks.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      blockedTasks: blockedTasks.length
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400">Manage your business and personal projects</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      {!selectedProject ? (
        /* Project Grid */
        <div className="grid grid-cols-3 gap-6">
          {projects.map((project) => {
            const allTasks = projectTasks.filter(t => t.project === project.slug)
            const activeTasks = allTasks.filter(t => ['pending', 'in_progress'].includes(t.status))
            const recentMemories = projectMemories.filter(m => m.project === project.slug).slice(0, 3)
            
            return (
              <div
                key={project.id}
                className="card cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${statusColors[project.status as keyof typeof statusColors] || 'bg-gray-500'}`}></div>
                </div>
                
                {project.description && (
                  <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                )}

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{allTasks.length}</div>
                    <div className="text-xs text-gray-400">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-500">{activeTasks.length}</div>
                    <div className="text-xs text-gray-400">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-500">
                      {allTasks.filter(t => t.status === 'done').length}
                    </div>
                    <div className="text-xs text-gray-400">Done</div>
                  </div>
                </div>

                {/* Recent Activity */}
                {recentMemories.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Recent Activity</div>
                    <div className="space-y-1">
                      {recentMemories.map((memory) => (
                        <div key={memory.id} className="text-xs text-gray-400 truncate">
                          {memory.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                  <span>Updated {format(new Date(project.updated_at), 'MMM dd')}</span>
                  <span className="uppercase">{project.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Project Detail View */
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedProject(null)}
              className="text-gray-400 hover:text-white"
            >
              ← Back to Projects
            </button>
            <div className={`w-3 h-3 rounded-full ${statusColors[selectedProject.status as keyof typeof statusColors] || 'bg-gray-500'}`}></div>
            <h2 className="text-2xl font-bold text-white">{selectedProject.name}</h2>
          </div>

          {selectedProject.description && (
            <div className="card">
              <p className="text-gray-300">{selectedProject.description}</p>
            </div>
          )}

          {/* Project Stats */}
          <div className="grid grid-cols-4 gap-6">
            {(() => {
              const stats = getProjectStats(selectedProject)
              return (
                <>
                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Tasks</p>
                        <p className="text-2xl font-bold text-white">{stats.totalTasks}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Active</p>
                        <p className="text-2xl font-bold text-amber-500">{stats.activeTasks}</p>
                      </div>
                      <Clock className="w-8 h-8 text-amber-500" />
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Completed</p>
                        <p className="text-2xl font-bold text-green-500">{stats.completedTasks}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Blocked</p>
                        <p className="text-2xl font-bold text-red-500">{stats.blockedTasks}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                  </div>
                </>
              )
            })()}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Project Tasks */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Tasks</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {projectTasks.slice(0, 10).map((task) => (
                  <div key={task.id} className="p-3 bg-gray-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{task.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        task.status === 'done' ? 'bg-green-600 text-white' :
                        task.status === 'in_progress' ? 'bg-blue-600 text-white' :
                        task.status === 'blocked' ? 'bg-red-600 text-white' :
                        'bg-gray-600 text-gray-200'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Priority: {task.priority}</span>
                      <span>{format(new Date(task.created_at), 'MMM dd')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Memories */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Project Memory</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {projectMemories.slice(0, 10).map((memory) => (
                  <div key={memory.id} className="p-3 bg-gray-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{memory.title}</h4>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded capitalize">
                        {memory.category.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-2">{memory.content}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className={`${
                        memory.importance === 'critical' ? 'text-red-400' :
                        memory.importance === 'high' ? 'text-yellow-400' :
                        memory.importance === 'normal' ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {memory.importance.toUpperCase()}
                      </span>
                      <span>{format(new Date(memory.timestamp), 'MMM dd')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Dates & Contacts */}
          <div className="grid grid-cols-2 gap-6">
            {selectedProject.key_dates && Object.keys(selectedProject.key_dates).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-amber-500" />
                  Key Dates
                </h3>
                <div className="space-y-2">
                  {Object.entries(selectedProject.key_dates).map(([key, date]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-300 capitalize">{key.replace('_', ' ')}</span>
                      <span className="text-gray-400">{format(new Date(date as string), 'MMM dd, yyyy')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedProject.contacts && selectedProject.contacts.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-amber-500" />
                  Contacts
                </h3>
                <div className="space-y-2">
                  {selectedProject.contacts.map((contact: any, index: number) => (
                    <div key={index} className="p-2 bg-gray-900 rounded">
                      <div className="font-medium text-white">{contact.name}</div>
                      <div className="text-sm text-gray-400">{contact.role}</div>
                      {contact.email && (
                        <div className="text-xs text-gray-500">{contact.email}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedProject.notes && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Notes</h3>
              <p className="text-gray-300 whitespace-pre-line">{selectedProject.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}