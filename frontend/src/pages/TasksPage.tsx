import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface TaskList {
  id: number
  name: string
  status: string
  created_at: string
  is_external: boolean
}

interface Task {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  is_external: boolean
  variants?: TaskVariant[]
}

interface TaskVariant {
  id: number
  name: string
  description: string
  items: string
  embodiment_id: number | null
  teleop_mode_id: number | null
  notes: string
  media: string[]
}

function TasksPage() {
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [expandedVariantId, setExpandedVariantId] = useState<number | null>(null)

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">Tasks</h1>
        <div className="space-x-4">
          <button className="action-button py-2 px-4">Add New Task</button>
          <button className="action-button py-2 px-4">Add Task Variant</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-6 text-sm text-gray-400">
          <span>tasks</span>
          <span>status</span>
        </div>

        {tasks?.map((task) => (
          <div key={task.id} className="bg-surface rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-accent hover:text-black transition-colors"
            >
              <span className="text-xl">{task.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm px-2 py-1 rounded bg-background text-white">{task.status}</span>
                {task.is_external && (
                  <span className="text-sm px-2 py-1 rounded bg-background text-white">External</span>
                )}
              </div>
            </button>

            {expandedTaskId === task.id && (
              <div className="px-6 py-4 border-t border-border">
                {expandedTask ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold mb-2">Description</h3>
                      <p className="text-gray-300">{expandedTask.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-2">Task Variants</h3>
                      <div className="space-y-4">
                        {expandedTask.variants?.map((variant) => (
                          <div key={variant.id} className="bg-background rounded overflow-hidden">
                            <button
                              onClick={() => setExpandedVariantId(expandedVariantId === variant.id ? null : variant.id)}
                              className="w-full px-4 py-3 flex justify-between items-center hover:bg-accent hover:text-black transition-colors"
                            >
                              <span className="font-bold">{variant.name}</span>
                              <span className="text-sm">Click to expand</span>
                            </button>

                            {expandedVariantId === variant.id && (
                              <div className="px-4 py-3 border-t border-border space-y-3">
                                <div>
                                  <span className="font-bold">Description: </span>
                                  <p className="text-gray-300 mt-1">{variant.description}</p>
                                </div>

                                {variant.items && (
                                  <div>
                                    <span className="font-bold">Items: </span>
                                    <p className="text-gray-300 mt-1">{variant.items}</p>
                                  </div>
                                )}

                                {variant.embodiment_id && (
                                  <div>
                                    <span className="font-bold">Embodiment ID: </span>
                                    <span className="text-gray-300">{variant.embodiment_id}</span>
                                  </div>
                                )}

                                {variant.teleop_mode_id && (
                                  <div>
                                    <span className="font-bold">Teleop Mode ID: </span>
                                    <span className="text-gray-300">{variant.teleop_mode_id}</span>
                                  </div>
                                )}

                                {variant.notes && (
                                  <div>
                                    <span className="font-bold">Notes: </span>
                                    <p className="text-gray-300 mt-1">{variant.notes}</p>
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
                                          className="text-accent hover:underline"
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

                    <div className="text-sm text-gray-400">
                      Created: {new Date(expandedTask.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-4">
                    <div className="text-gray-400">Loading task details...</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TasksPage 