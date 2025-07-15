import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BACKEND_URL } from '../config/api'

interface TaskVariantItemInfo {
  item_id: number
  item_name: string
  quantity: number
}

interface TaskVariant {
  id: number
  name: string
  description: string | null
  embodiment_id: number | null
  teleop_mode_id: number | null
  notes: string | null
  media?: string[]
  items: TaskVariantItemInfo[]
}

interface Task {
  id: number
  name: string
}

interface Embodiment {
  id: number
  name: string
}

interface TeleopMode {
  id: number
  name: string
}

interface Item {
  id: number
  name: string
}

const TaskVariantEditPage: React.FC = () => {
  const { variantId } = useParams<{ variantId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Form state
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [selectedEmbodimentId, setSelectedEmbodimentId] = useState<number | null>(null)
  const [selectedTeleopModeId, setSelectedTeleopModeId] = useState<number | null>(null)
  const [items, setItems] = useState<TaskVariantItemInfo[]>([])
  
  // Image upload state
  const [startConfigImage, setStartConfigImage] = useState<File | null>(null)
  const [endConfigImage, setEndConfigImage] = useState<File | null>(null)
  const [startConfigPreview, setStartConfigPreview] = useState<string>('')
  const [endConfigPreview, setEndConfigPreview] = useState<string>('')
  const [isDragOverStart, setIsDragOverStart] = useState<boolean>(false)
  const [isDragOverEnd, setIsDragOverEnd] = useState<boolean>(false)
  const [existingStartImage, setExistingStartImage] = useState<string>('')
  const [existingEndImage, setExistingEndImage] = useState<string>('')
  const [existingStartImageBase64, setExistingStartImageBase64] = useState<string>('')
  const [existingEndImageBase64, setExistingEndImageBase64] = useState<string>('')
  const [shouldDeleteStartImage, setShouldDeleteStartImage] = useState<boolean>(false)
  const [shouldDeleteEndImage, setShouldDeleteEndImage] = useState<boolean>(false)

  // Item selection state
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [itemQuantity, setItemQuantity] = useState<number>(1)

  // Query for task variant data
  const { data: variant, isLoading: variantLoading } = useQuery<TaskVariant>({
    queryKey: ['task-variant', variantId],
    queryFn: async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/tasks/variants/${variantId}`)
      return response.data
    },
    enabled: !!variantId
  })

  // Query for task data
  const { data: task } = useQuery<Task>({
    queryKey: ['task', variant?.task_id],
    queryFn: async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/tasks/${variant?.task_id}`)
      return response.data
    },
    enabled: !!variant?.task_id
  })

  // Query for embodiments
  const { data: embodiments } = useQuery<Embodiment[]>({
    queryKey: ['embodiments'],
    queryFn: async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/embodiments/`)
      return response.data
    }
  })

  // Query for teleop modes
  const { data: teleopModes } = useQuery<TeleopMode[]>({
    queryKey: ['teleop-modes'],
    queryFn: async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/teleop-modes/`)
      return response.data
    }
  })

  // Query for items
  const { data: availableItems } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/items/`)
      return response.data
    }
  })

  // Function to download existing images as base64
  const downloadExistingImages = async (startImageUri: string, endImageUri: string) => {
    try {
      const gsutilUris = [startImageUri, endImageUri].filter(Boolean)
      if (gsutilUris.length > 0) {
        const response = await axios.post(`${BACKEND_URL}/api/v1/upload/images/base64`, gsutilUris)
        const base64Images = response.data.images
        
        if (startImageUri && base64Images[0]) {
          setExistingStartImageBase64(base64Images[0])
        }
        if (endImageUri && base64Images[1]) {
          setExistingEndImageBase64(base64Images[1])
        }
      }
    } catch (error) {
      console.error('Failed to download existing images:', error)
    }
  }

  // Update form state when variant data loads
  useEffect(() => {
    if (variant) {
      setName(variant.name)
      setDescription(variant.description || '')
      setNotes(variant.notes || '')
      setSelectedEmbodimentId(variant.embodiment_id)
      setSelectedTeleopModeId(variant.teleop_mode_id)
      setItems(variant.items || [])

      // Set existing images
      const startImage = variant.media?.find(url => url.includes(`_${variant.id}_start`))
      const endImage = variant.media?.find(url => url.includes(`_${variant.id}_end`))
      
      if (startImage) {
        setExistingStartImage(startImage)
      }
      if (endImage) {
        setExistingEndImage(endImage)
      }

      // Download existing images as base64 for preview
      if (startImage || endImage) {
        downloadExistingImages(startImage || '', endImage || '')
      }
    }
  }, [variant])

  // Update task variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: async (variantData: { 
      name: string; 
      description: string; 
      notes: string; 
      embodiment_id: number | null;
      teleop_mode_id: number | null;
      media: string[];
    }) => {
      const response = await axios.put(`${BACKEND_URL}/api/v1/tasks/variants/${variantId}`, variantData)
      return response.data
    },
    onSuccess: async (updatedVariant) => {
      // Handle image uploads and deletions
      if (startConfigImage || endConfigImage || shouldDeleteStartImage || shouldDeleteEndImage) {
        try {
          // Delete existing images if needed
          const imagesToDelete: string[] = []
          if (shouldDeleteStartImage && existingStartImage) {
            imagesToDelete.push(existingStartImage)
          }
          if (shouldDeleteEndImage && existingEndImage) {
            imagesToDelete.push(existingEndImage)
          }

          if (imagesToDelete.length > 0) {
            await axios.delete(`${BACKEND_URL}/api/v1/upload/images`, {
              data: imagesToDelete
            })
          }

          // Upload new images if provided
          let newImageUris: string[] = []
          if (startConfigImage || endConfigImage) {
            const formData = new FormData()
            formData.append('task_name', task?.name || '')
            formData.append('task_id', task?.id.toString() || '')
            formData.append('variant_id', variantId!)
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
            
            newImageUris = uploadResponse.data.uris
          }

          // Update the variant with new image URIs
          const finalMedia = [
            ...(shouldDeleteStartImage ? [] : [existingStartImage]).filter(Boolean),
            ...(shouldDeleteEndImage ? [] : [existingEndImage]).filter(Boolean),
            ...newImageUris
          ]

          await axios.put(`${BACKEND_URL}/api/v1/tasks/variants/${variantId}`, {
            media: finalMedia
          })
        } catch (error) {
          console.error('Failed to handle images:', error)
        }
      }

      // Update items
      // First, remove all existing items
      for (const item of variant?.items || []) {
        await axios.delete(`${BACKEND_URL}/api/v1/tasks/variants/${variantId}/items/${item.item_id}`)
      }

      // Then add the new items
      for (const item of items) {
        await axios.post(`${BACKEND_URL}/api/v1/tasks/variants/${variantId}/items/`, {
          item_id: item.item_id,
          quantity: item.quantity
        })
      }

      queryClient.invalidateQueries(['task-variant', variantId])
      queryClient.invalidateQueries(['task-detail', task?.id])
      navigate(`/tasks/${task?.id}`)
    },
  })

  // File selection handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isStart: boolean) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (isStart) {
        setStartConfigImage(file)
        setShouldDeleteStartImage(false)
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
        setShouldDeleteEndImage(false)
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
      setShouldDeleteStartImage(true)
    } else {
      setEndConfigImage(null)
      setEndConfigPreview('')
      setShouldDeleteEndImage(true)
    }
  }

  const removeExistingImage = (isStart: boolean) => {
    if (isStart) {
      setShouldDeleteStartImage(true)
    } else {
      setShouldDeleteEndImage(true)
    }
  }

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

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        handleFileSelect({ target: { files: [file] } } as any, isStart)
      }
    }
  }

  // Item management
  const addItem = () => {
    if (selectedItemId && itemQuantity > 0) {
      const selectedItem = availableItems?.find(item => item.id === selectedItemId)
      if (selectedItem) {
        const newItem: TaskVariantItemInfo = {
          item_id: selectedItemId,
          item_name: selectedItem.name,
          quantity: itemQuantity
        }
        setItems([...items, newItem])
        setSelectedItemId(null)
        setItemQuantity(1)
      }
    }
  }

  const removeItem = (itemId: number) => {
    setItems(items.filter(item => item.item_id !== itemId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Variant name is required')
      return
    }
    
    updateVariantMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      notes: notes.trim(),
      embodiment_id: selectedEmbodimentId,
      teleop_mode_id: selectedTeleopModeId,
      media: variant?.media || []
    })
  }

  if (variantLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading task variant...</div>
  }

  if (!variant) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Failed to load task variant.</div>
  }

  return (
    <div className="max-w-4xl mx-auto bg-surface rounded-lg shadow p-8">
      <Link to={`/tasks/${task?.id}`} className="text-accent hover:underline">&larr; Back to Task</Link>
      <h1 className="text-3xl font-bold mt-2 mb-4">
        Edit Task Variant "{variant.name}" for Task "{task?.name}"
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <input
              type="text"
              className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block font-semibold mb-1">Embodiment</label>
            <select
              className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
              value={selectedEmbodimentId || ''}
              onChange={e => setSelectedEmbodimentId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Select embodiment</option>
              {embodiments?.map(embodiment => (
                <option key={embodiment.id} value={embodiment.id}>
                  {embodiment.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block font-semibold mb-1">Teleop Mode</label>
            <select
              className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
              value={selectedTeleopModeId || ''}
              onChange={e => setSelectedTeleopModeId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Select teleop mode</option>
              {teleopModes?.map(mode => (
                <option key={mode.id} value={mode.id}>
                  {mode.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Notes</label>
          <textarea
            className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Configuration Images */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Configuration Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Configuration */}
            <div>
              <label className="block font-semibold mb-2">Start Configuration</label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragOverStart ? 'border-accent bg-accent/10' : 'border-border'
                }`}
                onDragOver={e => handleDragOver(e, true)}
                onDragLeave={e => handleDragLeave(e, true)}
                onDrop={e => handleDrop(e, true)}
              >
                {(startConfigPreview || existingStartImageBase64) && !shouldDeleteStartImage ? (
                  <div className="space-y-2">
                    <img
                      src={startConfigPreview || existingStartImageBase64}
                      alt="Start configuration"
                      className="max-w-full h-32 object-contain mx-auto"
                    />
                    <div className="flex justify-center space-x-2">
                      {startConfigPreview && (
                        <button
                          type="button"
                          className="text-red-400 hover:underline text-xs"
                          onClick={() => removeImage(true)}
                        >
                          Remove
                        </button>
                      )}
                      {existingStartImage && !shouldDeleteStartImage && (
                        <button
                          type="button"
                          className="text-red-400 hover:underline text-xs"
                          onClick={() => removeExistingImage(true)}
                        >
                          Replace
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 mb-2">Drag & drop or click to upload</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileSelect(e, true)}
                      className="hidden"
                      id="start-image-input"
                    />
                    <label
                      htmlFor="start-image-input"
                      className="action-button py-1 px-3 text-xs cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* End Configuration */}
            <div>
              <label className="block font-semibold mb-2">End Configuration</label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragOverEnd ? 'border-accent bg-accent/10' : 'border-border'
                }`}
                onDragOver={e => handleDragOver(e, false)}
                onDragLeave={e => handleDragLeave(e, false)}
                onDrop={e => handleDrop(e, false)}
              >
                {(endConfigPreview || existingEndImageBase64) && !shouldDeleteEndImage ? (
                  <div className="space-y-2">
                    <img
                      src={endConfigPreview || existingEndImageBase64}
                      alt="End configuration"
                      className="max-w-full h-32 object-contain mx-auto"
                    />
                    <div className="flex justify-center space-x-2">
                      {endConfigPreview && (
                        <button
                          type="button"
                          className="text-red-400 hover:underline text-xs"
                          onClick={() => removeImage(false)}
                        >
                          Remove
                        </button>
                      )}
                      {existingEndImage && !shouldDeleteEndImage && (
                        <button
                          type="button"
                          className="text-red-400 hover:underline text-xs"
                          onClick={() => removeExistingImage(false)}
                        >
                          Replace
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 mb-2">Drag & drop or click to upload</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileSelect(e, false)}
                      className="hidden"
                      id="end-image-input"
                    />
                    <label
                      htmlFor="end-image-input"
                      className="action-button py-1 px-3 text-xs cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Required Items</h3>
          <div className="space-y-4">
            {/* Current Items */}
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.item_id} className="flex items-center justify-between border border-border rounded px-3 py-2 bg-background">
                    <div>
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-xs text-gray-400">Quantity: {item.quantity}</div>
                    </div>
                    <button
                      type="button"
                      className="text-red-400 hover:underline text-xs"
                      onClick={() => removeItem(item.item_id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Item */}
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="block font-semibold mb-1 text-sm">Item</label>
                <select
                  className="w-full border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  value={selectedItemId || ''}
                  onChange={e => setSelectedItemId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Select item</option>
                  {availableItems?.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="w-20 border border-border rounded px-3 py-2 bg-background text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  value={itemQuantity}
                  onChange={e => setItemQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <button
                type="button"
                className="action-button py-2 px-4"
                onClick={addItem}
              >
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link
            to={`/tasks/${task?.id}`}
            className="px-6 py-2 border border-border rounded hover:bg-background transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="action-button px-6 py-2"
            disabled={updateVariantMutation.isPending}
          >
            {updateVariantMutation.isPending ? 'Updating...' : 'Update Variant'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskVariantEditPage 