import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface Item {
  id: number
  name: string
  url?: string
  images?: string[]
  notes?: string
}

interface ItemCreate {
  name: string
  url?: string
  images?: string[]
  notes?: string
}

const ItemsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newItem, setNewItem] = useState<ItemCreate>({
    name: '',
    url: '',
    notes: ''
  })

  // Query for items
  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ['items-list'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/v1/items/list')
      return response.data
    }
  })

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: ItemCreate) => {
      const response = await axios.post('http://localhost:8000/api/v1/items/', itemData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['items-list'])
      setShowCreateForm(false)
      setNewItem({ name: '', url: '', notes: '' })
    },
  })

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await axios.delete(`http://localhost:8000/api/v1/items/${itemId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['items-list'])
    },
  })

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name.trim()) {
      alert('Item name is required')
      return
    }
    
    createItemMutation.mutate({
      name: newItem.name.trim(),
      url: newItem.url?.trim() || undefined,
      notes: newItem.notes?.trim() || undefined
    })
  }

  const handleDeleteItem = (itemId: number, itemName: string) => {
    if (confirm(`Are you sure you want to delete "${itemName}"? This will also remove it from all task variants.`)) {
      deleteItemMutation.mutate(itemId)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto bg-surface rounded-lg shadow p-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-xl">Loading items...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-surface rounded-lg shadow p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to="/tasks" className="text-accent hover:underline">&larr; Back to Tasks</Link>
          <h1 className="text-3xl font-bold mt-2">Items</h1>
          <p className="text-gray-400 mt-1">Manage items that can be used in task variants</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="action-button py-2 px-4"
        >
          Add New Item
        </button>
      </div>

      {/* Create Item Form */}
      {showCreateForm && (
        <div className="mb-8 p-6 bg-background rounded-lg border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Create New Item</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleCreateItem} className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Item Name *</label>
              <input
                type="text"
                className="w-full border border-border rounded px-3 py-2 bg-surface text-white focus:outline-none focus:ring-2 focus:ring-accent"
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Enter item name"
                required
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-1">URL</label>
              <input
                type="url"
                className="w-full border border-border rounded px-3 py-2 bg-surface text-white focus:outline-none focus:ring-2 focus:ring-accent"
                value={newItem.url}
                onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                placeholder="Enter item URL (optional)"
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-1">Notes</label>
              <textarea
                className="w-full border border-border rounded px-3 py-2 bg-surface text-white focus:outline-none focus:ring-2 focus:ring-accent"
                rows={3}
                value={newItem.notes}
                onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                placeholder="Enter item notes (optional)"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                className="action-button py-2 px-4"
                disabled={createItemMutation.isLoading}
              >
                {createItemMutation.isLoading ? 'Creating...' : 'Create Item'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-border rounded hover:bg-background transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-4">
        {items && items.length > 0 ? (
          items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline text-sm"
                    >
                      [Link]
                    </a>
                  )}
                </div>
                {item.notes && (
                  <p className="text-gray-400 text-sm mt-1">{item.notes}</p>
                )}
                {item.images && item.images.length > 0 && (
                  <p className="text-gray-400 text-xs mt-1">{item.images.length} image(s)</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteItem(item.id, item.name)}
                  className="text-red-400 hover:text-red-300 px-3 py-1 rounded text-sm"
                  disabled={deleteItemMutation.isLoading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">No items found</p>
            <p className="text-sm">Create your first item to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ItemsPage 