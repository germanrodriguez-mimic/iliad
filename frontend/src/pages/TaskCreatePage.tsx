import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface TaskVariant {
  id: number
  name: string
  description: string | null
  items: string | null
  embodiment_id: number | null
  teleop_mode_id: number | null
  notes: string | null
  media: string[]
}

const TASK_STATUSES = [
  'created',
  'collecting data',
  'ready for training',
  'training',
  'evaluating',
  'done',
  'discarded',
]

const TaskCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Form state
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [status, setStatus] = useState<string>('created')
  const [isExternal, setIsExternal] = useState<boolean>(false)
  
  // Default variant state (will be updated after task creation)
  const [defaultVariantDescription, setDefaultVariantDescription] = useState<string>('')
  const [defaultVariantItems, setDefaultVariantItems] = useState<string>('')
  const [defaultVariantNotes, setDefaultVariantNotes] = useState<string>('')
  const [defaultVariantMedia, setDefaultVariantMedia] = useState<string>('')

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { name: string; description: string; status: string; is_external: boolean }) => {
      const response = await axios.post('http://localhost:8000/api/v1/tasks/', taskData)
      return response.data
    },
    onSuccess: async (createdTask) => {
      // If user provided default variant information, update the default variant
      if (defaultVariantDescription || defaultVariantItems || defaultVariantNotes || defaultVariantMedia) {
        try {
          // Find the default variant (it should be the first one created for this task)
          const variantsResponse = await axios.get(`http://localhost:8000/api/v1/tasks/${createdTask.id}/variants/`)
          const defaultVariant = variantsResponse.data.find((v: TaskVariant) => v.name === 'default')
          
          if (defaultVariant) {
            const updateData: any = {}
            if (defaultVariantDescription) updateData.description = defaultVariantDescription
            if (defaultVariantItems) updateData.items = defaultVariantItems
            if (defaultVariantNotes) updateData.notes = defaultVariantNotes
            if (defaultVariantMedia) {
              // Split media by comma and trim whitespace
              updateData.media = defaultVariantMedia.split(',').map((url: string) => url.trim()).filter((url: string) => url)
            }
            
            await axios.put(`http://localhost:8000/api/v1/tasks/variants/${defaultVariant.id}`, updateData)
          }
        } catch (error) {
          console.error('Failed to update default variant:', error)
        }
      }
      
      // Invalidate queries and navigate to the new task
      queryClient.invalidateQueries(['tasks-list'])
      navigate(`/tasks/${createdTask.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Task name is required')
      return
    }
    
    createTaskMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      status,
      is_external: isExternal
    })
  }

  return (
    <div className="max-w-3xl mx-auto bg-surface rounded-lg shadow p-8">
      <Link to="/tasks" className="text-accent hover:underline">&larr; Back to Tasks</Link>
      <h1 className="text-3xl font-bold mt-2 mb-4">Create New Task</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block font-semibold mb-1">Task Name *</label>
          <input
            type="text"
            className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter task name"
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
            placeholder="Enter task description"
          />
        </div>
        
        <div>
          <label className="block font-semibold mb-1">Status</label>
          <select
            className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {TASK_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isExternal}
              onChange={e => setIsExternal(e.target.checked)}
              className="accent-accent"
            />
            <span className="font-semibold">External Task</span>
          </label>
        </div>

        {/* Default Variant Section */}
        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-4">Default Task Variant (Optional)</h2>
          <p className="text-gray-400 text-sm mb-4">
            A default variant will be automatically created. You can optionally provide additional details for it.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Description</label>
              <textarea
                className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
                rows={2}
                value={defaultVariantDescription}
                onChange={e => setDefaultVariantDescription(e.target.value)}
                placeholder="Enter variant description"
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-1">Items</label>
              <input
                type="text"
                className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
                value={defaultVariantItems}
                onChange={e => setDefaultVariantItems(e.target.value)}
                placeholder="Enter items (e.g., objects, tools needed)"
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-1">Notes</label>
              <textarea
                className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
                rows={2}
                value={defaultVariantNotes}
                onChange={e => setDefaultVariantNotes(e.target.value)}
                placeholder="Enter additional notes"
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-1">Media Links</label>
              <input
                type="text"
                className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
                value={defaultVariantMedia}
                onChange={e => setDefaultVariantMedia(e.target.value)}
                placeholder="Enter media URLs separated by commas"
              />
              <p className="text-gray-400 text-xs mt-1">Separate multiple URLs with commas</p>
            </div>
          </div>
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
            disabled={createTaskMutation.isLoading}
          >
            {createTaskMutation.isLoading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskCreatePage 