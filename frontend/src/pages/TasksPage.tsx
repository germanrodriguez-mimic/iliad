import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Link } from 'react-router-dom'

interface TaskList {
  id: number
  name: string
  status: string
  created_at: string
  is_external: boolean
  variants?: TaskVariant[]
}

interface TaskVariantItemInfo {
  item_id: number
  item_name: string
  quantity: number
  url?: string
  images?: string[]
  notes?: string
}

interface TaskVariant {
  id: number
  name: string
  description: string
  items: TaskVariantItemInfo[] | null
  embodiment_id: number | null
  teleop_mode_id: number | null
  embodiment?: { id: number; name: string } | null
  teleop_mode?: { id: number; name: string } | null
  notes: string
  media: string[]
}

interface Task {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  is_external: boolean
  variants: TaskVariant[]
}

function TasksPage() {
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [expandedVariantId, setExpandedVariantId] = useState<number | null>(null)

  // Task status columns for kanban
  const TASK_STATUSES = [
    'created',
    'collecting data',
    'ready for training',
    'training',
    'evaluating',
    'done',
    'discarded',
  ]

  // State for visible columns
  const [visibleStatuses, setVisibleStatuses] = useState<string[]>(() => {
    const stored = localStorage.getItem('kanban_visible_statuses')
    return stored ? JSON.parse(stored) : [...TASK_STATUSES]
  })

  // Persist visibleStatuses to localStorage
  useEffect(() => {
    localStorage.setItem('kanban_visible_statuses', JSON.stringify(visibleStatuses))
  }, [visibleStatuses])

  // State for search box
  const [search, setSearch] = useState('')

  // State for dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // Query for task list
  const { data: tasks, isLoading } = useQuery<TaskList[]>({
    queryKey: ['tasks-list'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/v1/tasks/list')
      return response.data
    }
  })

  // Query for expanded task details
  const { data: expandedTask } = useQuery<Task>({
    queryKey: ['task', expandedTaskId],
    queryFn: async () => {
      if (!expandedTaskId) return null
      const response = await axios.get(`http://localhost:8000/api/v1/tasks/${expandedTaskId}`)
      return response.data
    },
    enabled: !!expandedTaskId
  })

  // Filter tasks by search string (case-insensitive)
  const filteredTasks = search.trim() === ''
    ? tasks
    : tasks?.filter(task => task.name.toLowerCase().includes(search.trim().toLowerCase()))

  // Group filtered tasks by status
  const tasksByStatus: { [status: string]: TaskList[] } = {}
  TASK_STATUSES.forEach(status => {
    tasksByStatus[status] = filteredTasks?.filter(task => task.status === status) || []
  })

  // Handle filter checkbox change
  const handleStatusToggle = (status: string) => {
    setVisibleStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  const queryClient = useQueryClient()
  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false })
  // For drag-and-drop
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null)

  // Toast effect
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast({ ...toast, visible: false }), 2000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Drag handlers
  const handleDragStart = (taskId: number) => {
    setDraggedTaskId(taskId)
  }
  const handleDragEnd = () => {
    setDraggedTaskId(null)
  }
  const handleDrop = async (status: string) => {
    if (draggedTaskId == null) return
    // Find the task
    const task = tasks?.find(t => t.id === draggedTaskId)
    if (!task || task.status === status) return
    try {
      await axios.put(`http://localhost:8000/api/v1/tasks/${draggedTaskId}`, { status })
      setToast({ message: `Task "${task.name}" moved to "${status}"`, visible: true })
      queryClient.invalidateQueries(['tasks-list'])
    } catch (e) {
      setToast({ message: 'Failed to update task status', visible: true })
    } finally {
      setDraggedTaskId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto">
      {/* Toast popup */}
      {toast.visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-accent text-black px-6 py-2 rounded shadow z-50 text-sm animate-fade-in">
          {toast.message}
        </div>
      )}
      <div className="flex justify-between items-center mb-8 px-4">
        <h1 className="text-3xl">Tasks</h1>
        <div className="space-x-4">
          <Link to="/items" className="action-button py-2 px-4">Manage Items</Link>
          <Link to="/tasks/create" className="action-button py-2 px-4">Add New Task</Link>
          <Link to="/tasks/variants/create" className="action-button py-2 px-4">Add Task Variant</Link>
        </div>
      </div>

      {/* Search and Filter UI */}
      <div className="flex flex-wrap gap-4 mb-6 px-4 items-center relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="border border-border rounded px-3 py-1 text-sm bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ minWidth: 220 }}
        />
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="action-button py-1.5 px-4 text-sm font-semibold"
            onClick={() => setDropdownOpen((open) => !open)}
          >
            Show columns
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 mt-2 z-20 bg-surface border border-border rounded shadow-lg p-3 min-w-[200px] flex flex-col gap-2">
              {TASK_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleStatuses.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                    className="accent-accent"
                  />
                  <span className="capitalize">{status}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex flex-row gap-6 min-w-max">
          {TASK_STATUSES.filter((status) => visibleStatuses.includes(status)).map((status) => (
            <div
              key={status}
              className="flex-shrink-0 w-80 bg-surface rounded-lg p-4 border border-border min-h-[70vh] flex flex-col"
              onDragOver={e => { e.preventDefault(); }}
              onDrop={() => handleDrop(status)}
            >
              <div className="font-bold text-lg mb-4 capitalize text-center text-accent">{status}</div>
              <div className="flex-1 space-y-4">
                {tasksByStatus[status].length === 0 && (
                  <div className="text-gray-500 text-center">No tasks</div>
                )}
                {tasksByStatus[status].map((task) => (
                  <div
                    key={task.id}
                    className={`bg-background rounded-lg overflow-hidden shadow group ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div
                      className="w-full px-4 py-3 flex justify-between items-center transition-colors group-hover:bg-accent group-hover:text-black"
                    >
                      <span
                        className="text-lg font-semibold text-left cursor-pointer group-hover:text-black"
                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                      >
                        {task.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {task.is_external && (
                          <span className="text-xs px-2 py-1 rounded bg-background text-white border border-accent">External</span>
                        )}
                      </div>
                    </div>
                    <div className="px-4 pb-2 flex gap-2 transition-colors group-hover:bg-accent group-hover:text-black">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="action-button py-1 px-3 text-xs hover:bg-accent hover:text-black"
                      >
                        Full View
                      </Link>
                      <Link
                        to={`/tasks/${task.id}/edit`}
                        className="action-button py-1 px-3 text-xs hover:bg-accent hover:text-black"
                      >
                        Edit
                      </Link>
                    </div>

                    {expandedTaskId === task.id && (
                      <div className="px-4 py-3 border-t border-border bg-surface">
                        {expandedTask ? (
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-base font-bold mb-1">Description</h3>
                              <p className="text-gray-300 text-sm">{expandedTask.description}</p>
                            </div>

                            <div>
                              <h3 className="text-base font-bold mb-1">Task Variants</h3>
                              <div className="space-y-3">
                                {expandedTask.variants?.map((variant) => (
                                  <div key={variant.id} className="bg-background rounded overflow-hidden">
                                    <button
                                      onClick={() => setExpandedVariantId(expandedVariantId === variant.id ? null : variant.id)}
                                      className="w-full px-3 py-2 flex justify-between items-center hover:bg-accent hover:text-black transition-colors"
                                    >
                                      <span className="font-bold text-sm">{variant.name}</span>
                                    </button>

                                    {expandedVariantId === variant.id && (
                                      <div className="px-3 py-2 border-t border-border space-y-2">
                                        <div>
                                          <span className="font-bold">Description: </span>
                                          <p className="text-gray-300 mt-1 text-xs">{variant.description}</p>
                                        </div>

                                        {variant.items && variant.items.length > 0 && (
                                          <div>
                                            <span className="font-bold">Items: </span>
                                            <div className="space-y-1 text-xs">
                                              {variant.items.map((item, index) => (
                                                <div key={index} className="flex items-center gap-1">
                                                  <span>{item.quantity}x</span>
                                                  <span>{item.item_name}</span>
                                                  {item.url && (
                                                    <a
                                                      href={item.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-accent hover:underline"
                                                    >
                                                      (Link)
                                                    </a>
                                                  )}
                                                  {item.images && item.images.length > 0 && (
                                                    <span className="text-gray-400 text-xs">({item.images.length} images)</span>
                                                  )}
                                                  {item.notes && (
                                                    <span className="text-gray-400 text-xs">({item.notes})</span>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {variant.embodiment && (
                                          <div>
                                            <span className="font-bold">Embodiment: </span>
                                            <span className="text-gray-300 text-xs">{variant.embodiment.name}</span>
                                          </div>
                                        )}

                                        {variant.teleop_mode && (
                                          <div>
                                            <span className="font-bold">Teleop Mode: </span>
                                            <span className="text-gray-300 text-xs">{variant.teleop_mode.name}</span>
                                          </div>
                                        )}

                                        {variant.notes && (
                                          <div>
                                            <span className="font-bold">Notes: </span>
                                            <p className="text-gray-300 mt-1 text-xs">{variant.notes}</p>
                                          </div>
                                        )}

                                        {variant.media && variant.media.length > 0 && (
                                          <div>
                                            <span className="font-bold">Media: </span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                              {variant.media.map((url, index) => (
                                                <a
                                                  key={index}
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-accent hover:underline text-xs"
                                                >
                                                  Link {index + 1}
                                                </a>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="text-xs text-gray-400">
                              Created: {new Date(expandedTask.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center py-2">
                            <div className="text-gray-400 text-xs">Loading task details...</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TasksPage 