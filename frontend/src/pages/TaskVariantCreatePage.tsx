import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import ItemSelector from '../components/ItemSelector'
import { BACKEND_URL } from '../config/api'

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
  
  // Image upload state
  const [startConfigImage, setStartConfigImage] = useState<File | null>(null)
  const [endConfigImage, setEndConfigImage] = useState<File | null>(null)
  const [startConfigPreview, setStartConfigPreview] = useState<string>('')
  const [endConfigPreview, setEndConfigPreview] = useState<string>('')
  const [isDragOverStart, setIsDragOverStart] = useState<boolean>(false)
  const [isDragOverEnd, setIsDragOverEnd] = useState<boolean>(false)

  // Query for task list
  const { data: tasks, isLoading: tasksLoading } = useQuery<TaskList[]>({
    queryKey: ['tasks-list'],
    queryFn: async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/tasks/list`)
      return response.data
    }
  })

  // Query for task variants when a task is selected
  const { data: existingVariants, isLoading: variantsLoading } = useQuery<TaskVariant[]>({
    queryKey: ['task-variants', selectedTaskId],
    queryFn: async () => {
      if (!selectedTaskId) return []
      const response = await axios.get(`${BACKEND_URL}/api/v1/tasks/${selectedTaskId}/variants/`)
      return response.data
    },
    enabled: !!selectedTaskId
  })

  // Create task variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async (variantData: { name: string; description: string; notes: string; media: string[] }) => {
      const response = await axios.post(`${BACKEND_URL}/api/v1/tasks/${selectedTaskId}/variants/`, variantData)
      return response.data
    },
    onSuccess: async (createdVariant) => {
      // Upload images if provided
      let imageUris: string[] = []
      if (startConfigImage || endConfigImage) {
        try {
          const formData = new FormData()
          const selectedTask = tasks?.find(task => task.id === selectedTaskId)
          formData.append('task_name', selectedTask?.name || '')
          formData.append('task_id', selectedTaskId!.toString())
          formData.append('variant_id', createdVariant.id.toString())
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
          
          // Update the variant with the uploaded image URIs
          if (imageUris.length > 0) {
            await axios.put(`${BACKEND_URL}/api/v1/tasks/variants/${createdVariant.id}`, {
              media: imageUris
            })
          }
        } catch (error) {
          console.error('Failed to upload images:', error)
        }
      }
      
      // Add items to the variant
      for (const item of items) {
        await axios.post(`${BACKEND_URL}/api/v1/tasks/variants/${createdVariant.id}/items/`, {
          item_id: item.item_id,
          quantity: item.quantity
        })
      }
      
      queryClient.invalidateQueries(['task-variants', selectedTaskId])
      queryClient.invalidateQueries(['task-detail', selectedTaskId])
      navigate(`/tasks/${selectedTaskId}`)
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
    
    createVariantMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      notes: notes.trim(),
      media: []
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
          <p className="text-gray-400 text-xs mt-2">Upload images showing the start and end configurations of the task variant</p>
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