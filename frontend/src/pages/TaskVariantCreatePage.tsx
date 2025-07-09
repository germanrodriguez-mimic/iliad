import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import ItemSelector from '../components/ItemSelector'

interface TaskList {
  id: number
  name: string
  status: string
  created_at: string
  is_external: boolean
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
  description: string | null
  items: TaskVariantItemInfo[] | null
  embodiment_id: number | null
  teleop_mode_id: number | null
  notes: string | null
  media: string[]
}

const TaskVariantCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Form state
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [items, setItems] = useState<TaskVariantItemInfo[]>([])
  const [notes, setNotes] = useState<string>('')
  const [media, setMedia] = useState<string>('')

  // Query for task list
  const { data: tasks, isLoading: tasksLoading } = useQuery<TaskList[]>({
    queryKey: ['tasks-list'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/v1/tasks/list')
      return response.data
    }
  })

  // Query for task variants when a task is selected
  const { data: existingVariants, isLoading: variantsLoading } = useQuery<TaskVariant[]>({
    queryKey: ['task-variants', selectedTaskId],
    queryFn: async () => {
      if (!selectedTaskId) return []
      const response = await axios.get(`http://localhost:8000/api/v1/tasks/${selectedTaskId}/variants/`)
      return response.data
    },
    enabled: !!selectedTaskId
  })

  // Create task variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async (variantData: { name: string; description: string; notes: string; media: string[] }) => {
      const response = await axios.post(`http://localhost:8000/api/v1/tasks/${selectedTaskId}/variants/`, variantData)
      return response.data
    },
    onSuccess: async (createdVariant) => {
      // Add items to the variant
      for (const item of items) {
        await axios.post(`http://localhost:8000/api/v1/tasks/variants/${createdVariant.id}/items/`, {
          item_id: item.item_id,
          quantity: item.quantity
        })
      }
      
      queryClient.invalidateQueries(['task-variants', selectedTaskId])
      queryClient.invalidateQueries(['task-detail', selectedTaskId])
      navigate(`/tasks/${selectedTaskId}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTaskId) {
      alert('Please select a task')
      return
    }
    if (!name.trim()) {
      alert('Variant name is required')
      return
    }
    
    // Check if variant name already exists
    const existingVariantNames = existingVariants?.map(v => v.name.toLowerCase()) || []
    if (existingVariantNames.includes(name.trim().toLowerCase())) {
      alert('A variant with this name already exists for this task')
      return
    }
    
    const mediaArray = media.trim() 
      ? media.split(',').map(url => url.trim()).filter(url => url)
      : []
    
    createVariantMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      notes: notes.trim(),
      media: mediaArray
    })
  }

  const selectedTask = tasks?.find(task => task.id === selectedTaskId)

  if (tasksLoading) {
    return (
      <div className="max-w-3xl mx-auto bg-surface rounded-lg shadow p-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-xl">Loading tasks...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto bg-surface rounded-lg shadow p-8">
      <Link to="/tasks" className="text-accent hover:underline">&larr; Back to Tasks</Link>
      <h1 className="text-3xl font-bold mt-2 mb-4">Create New Task Variant</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block font-semibold mb-1">Select Task *</label>
          <select
            className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
            value={selectedTaskId || ''}
            onChange={e => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
            required
          >
            <option value="">Choose a task...</option>
            {tasks?.map(task => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTask && (
          <div className="bg-background rounded-lg p-4 border border-border">
            <h3 className="font-semibold mb-2">Selected Task: {selectedTask.name}</h3>
            <p className="text-sm text-gray-400 mb-3">Status: {selectedTask.status}</p>
            
            {variantsLoading ? (
              <div className="text-sm text-gray-400">Loading existing variants...</div>
            ) : (
              <div>
                <h4 className="font-semibold text-sm mb-2">Existing Variants:</h4>
                {existingVariants && existingVariants.length > 0 ? (
                  <div className="space-y-2">
                    {existingVariants.map(variant => (
                      <div key={variant.id} className="text-sm bg-surface rounded px-3 py-2 border border-border">
                        <div className="font-medium">{variant.name}</div>
                        {variant.description && (
                          <div className="text-gray-400 text-xs">{variant.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No variants yet (only default variant exists)</div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block font-semibold mb-1">Variant Name *</label>
          <input
            type="text"
            className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter variant name"
            required
          />
        </div>
        
        <div>
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter variant description"
          />
        </div>
        
        <div>
          <label className="block font-semibold mb-1">Items</label>
          <ItemSelector
            selectedItems={items}
            onItemsChange={setItems}
          />
        </div>
        
        <div>
          <label className="block font-semibold mb-1">Notes</label>
          <textarea
            className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Enter additional notes"
          />
        </div>
        
        <div>
          <label className="block font-semibold mb-1">Media Links</label>
          <input
            type="text"
            className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
            value={media}
            onChange={e => setMedia(e.target.value)}
            placeholder="Enter media URLs separated by commas"
          />
          <p className="text-gray-400 text-xs mt-1">Separate multiple URLs with commas</p>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            to="/tasks"
            className="px-6 py-2 border border-border rounded hover:bg-background transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="action-button py-2 px-6"
            disabled={createVariantMutation.isLoading || !selectedTaskId}
          >
            {createVariantMutation.isLoading ? 'Creating...' : 'Create Variant'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskVariantCreatePage 