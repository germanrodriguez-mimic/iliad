import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Link } from 'react-router-dom'

interface EmbodimentInfo {
  id: number
  name: string
}

interface TeleopModeInfo {
  id: number
  name: string
}

interface SubdatasetList {
  id: number
  name: string
  description: string | null
  notes: string | null
  embodiment_id: number | null
  teleop_mode_id: number | null
  embodiment: EmbodimentInfo | null
  teleop_mode: TeleopModeInfo | null
}

interface EpisodeStats {
  total: number
  good: number
  bad: number
}

interface RawEpisode {
  id: number
  subdataset_id: number
  operator: string | null
  url: string | null
  label: string | null
  recorded_at: string | null
  uploaded_at: string
}

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

interface Task {
  id: number
  name: string
  description: string | null
  status: string
  created_at: string
  is_external: boolean
  variants: TaskVariant[]
}

interface Subdataset {
  id: number
  name: string
  description: string | null
  notes: string | null
  embodiment_id: number | null
  teleop_mode_id: number | null
  embodiment: EmbodimentInfo | null
  teleop_mode: TeleopModeInfo | null
  raw_episodes: RawEpisode[]
  episode_stats: EpisodeStats
}

function SubdatasetsPage() {
  const [expandedSubdatasetId, setExpandedSubdatasetId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)

  // Fetch all tasks for filter dropdown
  const { data: tasks, isLoading: loadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks-list'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/v1/tasks/')
      return response.data
    }
  })

  // Fetch variants for selected task
  const { data: variants, isLoading: loadingVariants } = useQuery<TaskVariant[]>({
    queryKey: ['task-variants', selectedTaskId],
    queryFn: async () => {
      if (!selectedTaskId) return []
      const response = await axios.get(`http://localhost:8000/api/v1/tasks/${selectedTaskId}/variants/`)
      return response.data
    },
    enabled: !!selectedTaskId
  })

  // Query for subdataset list, filtered by task/variant
  const { data: subdatasets, isLoading } = useQuery<SubdatasetList[]>({
    queryKey: ['subdatasets-list', selectedTaskId, selectedVariantId],
    queryFn: async () => {
      let url = 'http://localhost:8000/api/v1/subdatasets/list'
      const params = []
      if (selectedTaskId) params.push(`task_id=${selectedTaskId}`)
      if (selectedVariantId) params.push(`variant_id=${selectedVariantId}`)
      if (params.length > 0) url += '?' + params.join('&')
      const response = await axios.get(url)
      return response.data
    }
  })

  // Reset variant filter if task changes
  useEffect(() => {
    setSelectedVariantId(null)
  }, [selectedTaskId])

  // Query for expanded subdataset details
  const { data: expandedSubdataset } = useQuery<Subdataset>({
    queryKey: ['subdataset', expandedSubdatasetId],
    queryFn: async () => {
      if (!expandedSubdatasetId) return null
      const response = await axios.get(`http://localhost:8000/api/v1/subdatasets/${expandedSubdatasetId}`)
      return response.data
    },
    enabled: !!expandedSubdatasetId
  })

  // Query for linked task and variant for expanded subdataset
  const { data: expandedLinkedTasks, isLoading: loadingLinkedTasks } = useQuery<Task[]>({
    queryKey: ['subdataset-linked-tasks', expandedSubdatasetId],
    queryFn: async () => {
      if (!expandedSubdatasetId) return []
      const response = await axios.get(`http://localhost:8000/api/v1/subdatasets/${expandedSubdatasetId}/linked_tasks/`)
      return response.data
    },
    enabled: !!expandedSubdatasetId
  })

  // Filter subdatasets by search and sort in reverse alphabetical order
  const filteredSubdatasets = subdatasets
    ?.filter((subdataset) =>
      subdataset.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.name.localeCompare(a.name))

  if (isLoading || loadingTasks) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading subdatasets...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">Subdatasets</h1>
      </div>

      {/* Filter dropdowns */}
      <div className="mb-4 flex gap-4 items-center">
        <select
          className="px-2 py-1 rounded border border-border bg-background text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          value={selectedTaskId !== null ? String(selectedTaskId) : ''}
          onChange={e => setSelectedTaskId(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">Filter by Task</option>
          {tasks?.map(task => (
            <option key={task.id} value={String(task.id)}>{task.name}</option>
          ))}
        </select>
        <select
          className="px-2 py-1 rounded border border-border bg-background text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          value={selectedVariantId !== null ? String(selectedVariantId) : ''}
          onChange={e => setSelectedVariantId(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!selectedTaskId || loadingVariants}
        >
          <option value="">Filter by Variant</option>
          {variants?.map(variant => (
            <option key={variant.id} value={String(variant.id)}>{variant.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 px-2 py-1 rounded border border-border bg-background text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-6 text-sm text-gray-400">
          <span>subdatasets</span>
        </div>

        {(filteredSubdatasets?.length ?? 0) === 0 ? (
          <div className="text-center text-gray-400 py-8">No subdatasets found.</div>
        ) : (
          filteredSubdatasets?.map((subdataset) => (
            <React.Fragment key={subdataset.id}>
              <div className="bg-surface rounded-lg overflow-hidden flex items-center justify-between px-6 py-4 transition-colors group hover:bg-accent hover:text-black">
                <div className="flex-1 min-w-0 flex items-center">
                  <button
                    onClick={() => setExpandedSubdatasetId(expandedSubdatasetId === subdataset.id ? null : subdataset.id)}
                    className="w-full text-left flex items-center bg-transparent border-0 p-0 group-hover:text-black transition-colors focus:outline-none"
                  >
                    <span
                      className="text-xl block w-full max-w-full min-w-0 whitespace-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-2 group-hover:text-black"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                      title={subdataset.name}
                    >
                      {subdataset.name}
                    </span>
                  </button>
                </div>
                <a
                  href={`/subdatasets/${subdataset.id}`}
                  className="action-button py-2 px-4 text-sm ml-4 flex-shrink-0 group-hover:bg-black group-hover:text-accent"
                >
                  Full View
                </a>
              </div>
              {expandedSubdatasetId === subdataset.id && (
                <div className="w-full px-6 py-4 border-t border-border">
                  {expandedSubdataset ? (
                    <div className="space-y-4">
                      {expandedSubdataset.notes && (
                        <div>
                          <h3 className="text-lg font-bold mb-2">Notes</h3>
                          <p className="text-gray-300">{expandedSubdataset.notes}</p>
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold mb-2">Details</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-300">
                              <span className="font-bold">Embodiment: </span>
                              {expandedSubdataset.embodiment?.name || 'None'}
                            </p>
                            <p className="text-gray-300">
                              <span className="font-bold">Teleop Mode: </span>
                              {expandedSubdataset.teleop_mode?.name || 'None'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-300">
                              <span className="font-bold">Total Episodes: </span>
                              {expandedSubdataset.episode_stats.total}
                            </p>
                            <p className="text-gray-300">
                              <span className="font-bold">Good Episodes: </span>
                              {expandedSubdataset.episode_stats.good}
                            </p>
                            <p className="text-gray-300">
                              <span className="font-bold">Bad Episodes: </span>
                              {expandedSubdataset.episode_stats.bad}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Linked Task and Variant */}
                      <div>
                        <h3 className="text-lg font-bold mb-2">Linked Task & Variant</h3>
                        {loadingLinkedTasks ? (
                          <div className="text-gray-400">Loading linked task...</div>
                        ) : expandedLinkedTasks && expandedLinkedTasks.length > 0 && expandedLinkedTasks[0].variants.length > 0 ? (
                          <div className="text-gray-300">
                            <span className="font-bold">Task: </span>
                            <Link to={`/tasks/${expandedLinkedTasks[0].id}`} className="text-accent hover:underline">{expandedLinkedTasks[0].name}</Link>
                            <br />
                            <span className="font-bold">Variant: </span>
                            <span>{expandedLinkedTasks[0].variants[0].name}</span>
                          </div>
                        ) : (
                          <div className="text-gray-400">No linked task.</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center py-4">
                      <div className="text-gray-400">Loading subdataset details...</div>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  )
}

export default SubdatasetsPage 