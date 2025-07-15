import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

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

interface Task {
  id: number
  name: string
  description: string | null
  status: string
  created_at: string
  is_external: boolean
  variants: TaskVariant[]
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

interface ConversionVersion {
  id: number;
  version: string;
}

interface ProcessedEpisode {
  id: number;
  subdataset_id: number;
  raw_episode_id: number;
  conversion_version_id: number;
  url: string | null;
  uploaded_at: string;
  conversion_version?: ConversionVersion;
}

interface SubdatasetDetail {
  id: number
  name: string
  description: string | null
  notes: string | null
  embodiment_id: number | null
  teleop_mode_id: number | null
  embodiment?: { id: number; name: string }
  teleop_mode?: { id: number; name: string }
}

const SubdatasetDetailPage: React.FC = () => {
  const { subdatasetId } = useParams<{ subdatasetId: string }>()
  const [showRawEpisodes, setShowRawEpisodes] = useState(false)
  const [showProcessedEpisodes, setShowProcessedEpisodes] = useState(false)
  const [showTasks, setShowTasks] = useState(true)

  const navigate = useNavigate()

  // Fetch subdataset info
  const { data: subdataset, isLoading: loadingSubdataset } = useQuery<SubdatasetDetail>({
    queryKey: ['subdataset-detail', subdatasetId],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:8000/api/v1/subdatasets/${subdatasetId}`)
      return response.data
    },
    enabled: !!subdatasetId
  })

  // Fetch linked tasks and variants
  const { data: linkedTasks, isLoading: loadingTasks } = useQuery<Task[]>({
    queryKey: ['subdataset-linked-tasks', subdatasetId],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:8000/api/v1/subdatasets/${subdatasetId}/linked_tasks/`)
      return response.data
    },
    enabled: !!subdatasetId
  })

  // Fetch raw episodes (for both display and processed episode stats)
  const { data: rawEpisodes, isLoading: loadingRawEpisodes } = useQuery<RawEpisode[]>({
    queryKey: ['subdataset-raw-episodes', subdatasetId],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:8000/api/v1/subdatasets/${subdatasetId}/episodes/?limit=10000`)
      return response.data
    },
    enabled: !!subdatasetId
  })

  // Fetch processed episodes
  const { data: processedEpisodes, isLoading: loadingProcessedEpisodes } = useQuery<ProcessedEpisode[]>({
    queryKey: ['subdataset-processed-episodes', subdatasetId],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:8000/api/v1/subdatasets/${subdatasetId}/processed_episodes/?limit=10000`)
      return response.data
    },
    enabled: !!subdatasetId
  })

  // Fetch all tasks and variants for linking
  const { data: allTasks, isLoading: loadingAllTasks } = useQuery<Task[]>({
    queryKey: ['all-tasks-for-linking'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/v1/tasks/')
      return response.data
    },
    enabled: !linkedTasks || linkedTasks.length === 0,
  })

  // State for selected task/variant
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)

  // Find variants for selected task
  const selectedTask = allTasks?.find(t => t.id === Number(selectedTaskId))
  const variants = selectedTask?.variants || []

  // Link handler
  const handleLink = async () => {
    setLinking(true)
    setLinkError(null)
    setLinkSuccess(null)
    try {
      await axios.post(`http://localhost:8000/api/v1/subdatasets/${subdatasetId}/link_task_variant/`, {
        task_variant_id: Number(selectedVariantId),
      })
      setLinkSuccess('Successfully linked!')
      // Optionally refetch linked tasks
      window.location.reload()
    } catch (err: any) {
      setLinkError(err?.response?.data?.detail || 'Failed to link')
    } finally {
      setLinking(false)
    }
  }

  // Compute raw episode stats
  const rawStats = React.useMemo(() => {
    if (!rawEpisodes) return { total: 0, good: 0, bad: 0 }
    let good = 0, bad = 0
    for (const ep of rawEpisodes) {
      if (ep.label === 'good') good++
      if (ep.label === 'bad') bad++
    }
    return { total: rawEpisodes.length, good, bad }
  }, [rawEpisodes])

  // Compute processed episode stats using raw episode labels
  const processedStats = React.useMemo(() => {
    if (!processedEpisodes || !rawEpisodes) return { total: 0, good: 0, bad: 0 }
    let good = 0, bad = 0
    const rawMap = new Map<number, RawEpisode>()
    for (const ep of rawEpisodes) rawMap.set(ep.id, ep)
    for (const ep of processedEpisodes) {
      const raw = rawMap.get(ep.raw_episode_id)
      if (raw?.label === 'good') good++
      if (raw?.label === 'bad') bad++
    }
    return { total: processedEpisodes.length, good, bad }
  }, [processedEpisodes, rawEpisodes])

  if (loadingSubdataset) {
    return <div className="flex justify-center items-center min-h-screen">Loading subdataset...</div>
  }
  if (!subdataset) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Failed to load subdataset.</div>
  }

  return (
    <div className="max-w-4xl mx-auto bg-surface rounded-lg shadow p-8">
      <div className="flex justify-between items-center mb-2">
        <Link to="/subdatasets" className="text-accent hover:underline">&larr; Back to Subdatasets</Link>
      </div>
      <h1 className="text-3xl font-bold mt-2 mb-4">{subdataset.name}</h1>
      {subdataset.description && <p className="mb-4 text-lg text-gray-200">{subdataset.description}</p>}
      {subdataset.notes && <div className="mb-4 text-xs text-gray-400">Notes: {subdataset.notes}</div>}
      <div className="mb-4 text-gray-400 text-sm">
        Embodiment: {subdataset.embodiment?.name || 'None'} | Teleop Mode: {subdataset.teleop_mode?.name || 'None'}
      </div>

      {/* Linked Tasks */}
      <section className="mb-8">
        <button
          className="w-full text-left font-bold flex justify-between items-center hover:text-accent mb-2"
          onClick={() => setShowTasks((v) => !v)}
        >
          Linked Tasks
          <span className="ml-2 text-xs">{showTasks ? '▲' : '▼'}</span>
        </button>
        {showTasks && (
          loadingTasks ? <div className="text-gray-400">Loading tasks...</div> : (
            linkedTasks && linkedTasks.length > 0 ? (
              <ul className="space-y-4">
                {linkedTasks.map(task => (
                  <li key={task.id}>
                    <div className="border border-border rounded bg-background p-4">
                      <Link to={`/tasks/${task.id}`} className="text-accent hover:underline font-bold text-lg">
                        {task.name}
                      </Link>
                      {task.variants && task.variants.length > 0 && (
                        <div className="ml-4 mt-3">
                          <div className="border border-border rounded bg-surface p-2">
                            <Link to={`/tasks/${task.id}`} className="text-accent hover:underline text-sm">
                              {task.variants[0].name}
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-400 flex items-center gap-4">
                No linked tasks.
                <span
                  className="text-accent cursor-pointer hover:underline"
                  onClick={() => navigate(`/subdatasets/${subdatasetId}/link-task-variant`)}
                >
                  Link to Task Variant
                </span>
              </div>
            )
          )
        )}
      </section>

      {/* Processed Episodes */}
      <section className="mb-8">
        <button
          className="w-full text-left font-bold flex justify-between items-center hover:text-accent mb-2"
          onClick={() => setShowProcessedEpisodes((v) => !v)}
        >
          Processed Episodes ({processedEpisodes ? processedEpisodes.length : 0})
          <span className="ml-2 text-xs">{showProcessedEpisodes ? '▲' : '▼'}</span>
        </button>
        {showProcessedEpisodes && (
          <>
            <div className="mb-2 text-sm text-gray-400">
              <span className="mr-4">Total: {processedStats.total}</span>
              <span className="mr-4">Good: {processedStats.good}</span>
              <span>Bad: {processedStats.bad}</span>
            </div>
            {loadingProcessedEpisodes ? <div className="text-gray-400">Loading processed episodes...</div> : (
              processedEpisodes && processedEpisodes.length > 0 ? (
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {processedEpisodes.map(ep => (
                    <li key={ep.id} className="border border-border rounded p-3 bg-background">
                      {/* Show episode name as clickable link at the top */}
                      <div className="mb-2">
                        <button
                          onClick={async () => {
                            try {
                              const viewerUrl = import.meta.env.VITE_EPISODE_VIEWER_URL;
                              if (viewerUrl) {
                                const response = await axios.get(`${viewerUrl}?episode_id=${ep.id}`);
                                // Extract the url from the response and open it
                                const episodeUrl = response.data.url;
                                if (episodeUrl) {
                                  window.location.href = episodeUrl;
                                } else {
                                  console.error('No URL found in episode viewer response');
                                }
                              } else {
                                console.error('VITE_EPISODE_VIEWER_URL not configured');
                              }
                            } catch (error) {
                              console.error('Error opening episode viewer:', error);
                            }
                          }}
                          className="text-accent hover:underline font-bold cursor-pointer"
                        >
                          {ep.url ? ep.url.split('/').pop() : `Episode ${ep.id}`}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className="font-bold">Conversion Version:</span>{' '}
                          {ep.conversion_version?.version || 'N/A'}
                        </div>
                        <div><span className="font-bold">Uploaded At:</span> {ep.uploaded_at ? new Date(ep.uploaded_at).toLocaleString() : 'N/A'}</div>
                        {/* Optionally show label from raw episode */}
                        {rawEpisodes && (
                          <div><span className="font-bold">Label:</span> {rawEpisodes.find(r => r.id === ep.raw_episode_id)?.label || 'N/A'}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <div className="text-gray-400">No processed episodes.</div>
            )}
          </>
        )}
      </section>

      {/* Raw Episodes */}
      <section className="mb-8">
        <button
          className="w-full text-left font-bold flex justify-between items-center hover:text-accent mb-2"
          onClick={() => setShowRawEpisodes((v) => !v)}
        >
          Raw Episodes ({rawEpisodes ? rawEpisodes.length : 0})
          <span className="ml-2 text-xs">{showRawEpisodes ? '▲' : '▼'}</span>
        </button>
        {showRawEpisodes && (
          <>
            <div className="mb-2 text-sm text-gray-400">
              <span className="mr-4">Total: {rawStats.total}</span>
              <span className="mr-4">Good: {rawStats.good}</span>
              <span>Bad: {rawStats.bad}</span>
            </div>
            {loadingRawEpisodes ? <div className="text-gray-400">Loading raw episodes...</div> : (
              rawEpisodes && rawEpisodes.length > 0 ? (
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {rawEpisodes.map(ep => (
                    <li key={ep.id} className="border border-border rounded p-3 bg-background">
                      {/* Show episode name as plain text if url exists */}
                      {ep.url && (
                        <div className="mb-2">
                          <span className="font-bold text-gray-200">
                            {ep.url.split('/').pop()}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div><span className="font-bold">Operator:</span> {ep.operator || 'N/A'}</div>
                        <div><span className="font-bold">Label:</span> {ep.label || 'N/A'}</div>
                        <div><span className="font-bold">Recorded At:</span> {ep.recorded_at ? new Date(ep.recorded_at).toLocaleString() : 'N/A'}</div>
                        <div><span className="font-bold">Uploaded At:</span> {new Date(ep.uploaded_at).toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <div className="text-gray-400">No raw episodes.</div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default SubdatasetDetailPage 