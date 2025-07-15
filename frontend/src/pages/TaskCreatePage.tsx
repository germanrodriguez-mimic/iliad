import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import ItemSelector from '../components/ItemSelector'
import { BACKEND_URL } from '../config/api'

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
  const [defaultVariantItems, setDefaultVariantItems] = useState<TaskVariantItemInfo[]>([])
  const [defaultVariantNotes, setDefaultVariantNotes] = useState<string>('')
  
  // Image upload state
  const [startConfigImage, setStartConfigImage] = useState<File | null>(null)
  const [endConfigImage, setEndConfigImage] = useState<File | null>(null)
  const [startConfigPreview, setStartConfigPreview] = useState<string>('')
  const [endConfigPreview, setEndConfigPreview] = useState<string>('')
  const [isDragOverStart, setIsDragOverStart] = useState<boolean>(false)
  const [isDragOverEnd, setIsDragOverEnd] = useState<boolean>(false)

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { name: string; description: string; status: string; is_external: boolean }) => {
      const response = await axios.post(`${BACKEND_URL}/api/v1/tasks/`, taskData)
      return response.data
    },
    onSuccess: async (createdTask) => {
      // Upload images if provided
      let imageUris: string[] = []
      if (startConfigImage || endConfigImage) {
        try {
          // Find the default variant to get its ID
          const variantsResponse = await axios.get(`${BACKEND_URL}/api/v1/tasks/${createdTask.id}/variants/`)
          const defaultVariant = variantsResponse.data.find((v: TaskVariant) => v.name === 'default')
          
          if (defaultVariant) {
            const formData = new FormData()
            formData.append('task_name', createdTask.name)
            formData.append('task_id', createdTask.id.toString())
            formData.append('variant_id', defaultVariant.id.toString())
            if (startConfigImage) {
              formData.append('start_image', startConfigImage)
            }
            if (endConfigImage) {
              formData.append('end_image', endConfigImage)
            }
            
            const uploadResponse = await axios.post(`${BACKEND_URL}/api/v1/upload/images`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
            
            imageUris = uploadResponse.data.uris
          }
        } catch (error) {
          console.error('Failed to upload images:', error)
        }
      }
      
      // If user provided default variant information, update the default variant
      if (defaultVariantDescription || defaultVariantItems.length > 0 || defaultVariantNotes || imageUris.length > 0) {
        try {
          // Find the default variant (it should be the first one created for this task)
          const variantsResponse = await axios.get(`${BACKEND_URL}/api/v1/tasks/${createdTask.id}/variants/`)
          const defaultVariant = variantsResponse.data.find((v: TaskVariant) => v.name === 'default')
          
          if (defaultVariant) {
            const updateData: any = {}
            if (defaultVariantDescription) updateData.description = defaultVariantDescription
            if (defaultVariantNotes) updateData.notes = defaultVariantNotes
            if (imageUris.length > 0) {
              updateData.media = imageUris
            }
            
            await axios.put(`${BACKEND_URL}/api/v1/tasks/variants/${defaultVariant.id}`, updateData)
            
            // Add items to the variant
            for (const item of defaultVariantItems) {
              await axios.post(`${BACKEND_URL}/api/v1/tasks/variants/${defaultVariant.id}/items/`, {
                item_id: item.item_id,
                quantity: item.quantity
              })
            }
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

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, isStart: boolean) => {
    e.preventDefault()
    if (isStart) {
      setIsDragOverStart(true)
    } else {
      setIsDragOverEnd(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent, isStart: boolean) => {
    e.preventDefault()
    if (isStart) {
      setIsDragOverStart(false)
    } else {
      setIsDragOverEnd(false)
    }
  }

  const handleDrop = (e: React.DragEvent, isStart: boolean) => {
    e.preventDefault()
    if (isStart) {
      setIsDragOverStart(false)
    } else {
      setIsDragOverEnd(false)
    }

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file): file is File => file instanceof File && file.type.startsWith('image/'))
    
    if (imageFile) {
      if (isStart) {
        setStartConfigImage(imageFile)
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          if (typeof result === 'string') {
            setStartConfigPreview(result)
          }
        }
        reader.readAsDataURL(imageFile)
      } else {
        setEndConfigImage(imageFile)
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          if (typeof result === 'string') {
            setEndConfigPreview(result)
          }
        }
        reader.readAsDataURL(imageFile)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isStart: boolean) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (isStart) {
        setStartConfigImage(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          if (typeof result === 'string') {
            setStartConfigPreview(result)
          }
        }
        reader.readAsDataURL(file)
      } else {
        setEndConfigImage(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          if (typeof result === 'string') {
            setEndConfigPreview(result)
          }
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const removeImage = (isStart: boolean) => {
    if (isStart) {
      setStartConfigImage(null)
      setStartConfigPreview('')
    } else {
      setEndConfigImage(null)
      setEndConfigPreview('')
    }
  }

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
              <ItemSelector
                selectedItems={defaultVariantItems}
                onItemsChange={setDefaultVariantItems}
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
            
            {/* Configuration Images Section */}
            <div>
              <label className="block font-semibold mb-3">Configuration Images</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Configuration */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-300">Start Configuration</h3>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      isDragOverStart 
                        ? 'border-accent bg-accent/10' 
                        : startConfigPreview 
                          ? 'border-green-500' 
                          : 'border-border hover:border-accent'
                    }`}
                    onDragOver={(e) => handleDragOver(e, true)}
                    onDragLeave={(e) => handleDragLeave(e, true)}
                    onDrop={(e) => handleDrop(e, true)}
                  >
                    {startConfigPreview ? (
                      <div className="relative">
                        <img 
                          src={startConfigPreview} 
                          alt="Start configuration" 
                          className="max-w-full h-32 object-contain mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(true)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-400 mb-2">
                          <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-400">Drag and drop an image here</p>
                        <p className="text-xs text-gray-500 mt-1">or</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e, true)}
                          className="hidden"
                          id="start-config-file"
                        />
                        <label 
                          htmlFor="start-config-file"
                          className="text-accent hover:underline cursor-pointer text-sm"
                        >
                          browse files
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* End Configuration */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-300">End Configuration</h3>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      isDragOverEnd 
                        ? 'border-accent bg-accent/10' 
                        : endConfigPreview 
                          ? 'border-green-500' 
                          : 'border-border hover:border-accent'
                    }`}
                    onDragOver={(e) => handleDragOver(e, false)}
                    onDragLeave={(e) => handleDragLeave(e, false)}
                    onDrop={(e) => handleDrop(e, false)}
                  >
                    {endConfigPreview ? (
                      <div className="relative">
                        <img 
                          src={endConfigPreview} 
                          alt="End configuration" 
                          className="max-w-full h-32 object-contain mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(false)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-400 mb-2">
                          <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-400">Drag and drop an image here</p>
                        <p className="text-xs text-gray-500 mt-1">or</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e, false)}
                          className="hidden"
                          id="end-config-file"
                        />
                        <label 
                          htmlFor="end-config-file"
                          className="text-accent hover:underline cursor-pointer text-sm"
                        >
                          browse files
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-2">Upload images showing the start and end configurations of the task</p>
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