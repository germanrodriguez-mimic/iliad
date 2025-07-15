import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BACKEND_URL } from '../config/api'

interface Item {
  id: number
  name: string
  url?: string
  images?: string[]
  notes?: string
}

interface TaskVariantItemInfo {
  item_id: number
  item_name: string
  quantity: number
  url?: string
  images?: string[]
  notes?: string
}

interface ItemSelectorProps {
  selectedItems: TaskVariantItemInfo[]
  onItemsChange: (items: TaskVariantItemInfo[]) => void
}

const ItemSelector: React.FC<ItemSelectorProps> = ({ selectedItems, onItemsChange }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(1)

  // Query for available items
  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ['items-list'],
    queryFn: async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/items/list`)
      return response.data
    }
  })

  const handleAddItem = () => {
    if (!selectedItemId || quantity <= 0) return

    const selectedItem = items?.find(item => item.id === selectedItemId)
    if (!selectedItem) return

    // Check if item is already added
    const existingItem = selectedItems.find(item => item.item_id === selectedItemId)
    if (existingItem) {
      // Update quantity of existing item
      const updatedItems = selectedItems.map(item =>
        item.item_id === selectedItemId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
      onItemsChange(updatedItems)
    } else {
      // Add new item
      const newItem: TaskVariantItemInfo = {
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        quantity,
        url: selectedItem.url,
        images: selectedItem.images,
        notes: selectedItem.notes
      }
      onItemsChange([...selectedItems, newItem])
    }

    // Reset form
    setSelectedItemId(null)
    setQuantity(1)
    setShowAddForm(false)
  }

  const handleRemoveItem = (itemId: number) => {
    const updatedItems = selectedItems.filter(item => item.item_id !== itemId)
    onItemsChange(updatedItems)
  }

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId)
      return
    }
    
    const updatedItems = selectedItems.map(item =>
      item.item_id === itemId
        ? { ...item, quantity: newQuantity }
        : item
    )
    onItemsChange(updatedItems)
  }

  const availableItems = items?.filter(item => 
    !selectedItems.some(selected => selected.item_id === item.id)
  ) || []

  return (
    <div className="space-y-4">
      {/* Selected Items List */}
      {selectedItems.length > 0 && (
        <div className="space-y-2">
          <label className="block font-semibold text-sm">Selected Items:</label>
          <div className="space-y-2">
            {selectedItems.map((item) => (
              <div key={item.item_id} className="flex items-center gap-3 p-3 bg-background rounded border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.item_name}</span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline text-xs"
                      >
                        [Link]
                      </a>
                    )}
                  </div>
                  {item.notes && (
                    <div className="text-gray-400 text-xs mt-1">{item.notes}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Qty:</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.item_id, parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-xs border border-border rounded bg-surface text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.item_id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Form */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 text-accent hover:text-accent/80 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Item
        </button>
      ) : (
        <div className="p-4 bg-background rounded border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Add Item</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Select Item:</label>
              <select
                value={selectedItemId || ''}
                onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-border rounded px-3 py-2 bg-surface text-white focus:outline-none focus:ring-1 focus:ring-accent text-sm"
              >
                <option value="">Choose an item...</option>
                {availableItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Quantity:</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full border border-border rounded px-3 py-2 bg-surface text-white focus:outline-none focus:ring-1 focus:ring-accent text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedItemId || quantity <= 0}
                className="flex-1 bg-accent text-black py-2 px-3 rounded text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 border border-border rounded text-sm hover:bg-background"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-gray-400 text-sm">Loading items...</div>
      )}

      {/* No items available */}
      {!isLoading && availableItems.length === 0 && selectedItems.length === 0 && (
        <div className="text-gray-400 text-sm">
          No items available. You may need to create items first.
        </div>
      )}
    </div>
  )
}

export default ItemSelector 