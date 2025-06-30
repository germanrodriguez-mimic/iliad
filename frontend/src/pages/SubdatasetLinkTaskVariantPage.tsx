// @ts-ignore
import { useParams, useNavigate, Link } from 'react-router-dom'
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface TaskVariant {
  id: number
  name: string
}

interface Task {
  id: number
  name: string
  variants: TaskVariant[]
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

const SubdatasetLinkTaskVariantPage: React.FC = () => {
  const { subdatasetId } = useParams<{ subdatasetId: string }>()
  const navigate = useNavigate()
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)

  // Fetch all tasks and variants
  const { data: allTasks, isLoading: loadingAllTasks } = useQuery<Task[]>({
    queryKey: ['all-tasks-for-linking'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/v1/tasks/')
      return response.data
    },
    enabled: !!subdatasetId,
  })

  // Fetch linked task/variant for this subdataset
  const { data: linkedTasks, isLoading: loadingLinkedTasks } = useQuery<any>({
    queryKey: ['subdataset-linked-tasks', subdatasetId],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:8000/api/v1/subdatasets/${subdatasetId}/linked_tasks/`)
      return response.data
    },
    enabled: !!subdatasetId
  })

  // Fetch subdataset info
  const { data: subdataset, isLoading: loadingSubdataset } = useQuery<SubdatasetDetail>({
    queryKey: ['subdataset-detail', subdatasetId],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:8000/api/v1/subdatasets/${subdatasetId}`)
      return response.data
    },
    enabled: !!subdatasetId
  })

  const selectedTask = allTasks?.find(t => t.id === Number(selectedTaskId))
  const variants = selectedTask?.variants || []

  const handleLink = async () => {
    setLinking(true)
    setLinkError(null)
    setLinkSuccess(null)
    try {
      await axios.post(`http://localhost:8000/api/v1/subdatasets/${subdatasetId}/link_task_variant/`, {
        task_variant_id: Number(selectedVariantId),
      })
      setLinkSuccess('Successfully linked!')
      setTimeout(() => navigate(`/subdatasets/${subdatasetId}`), 1000)
    } catch (err: any) {
      setLinkError(err?.response?.data?.detail || 'Failed to link')
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-surface rounded-lg shadow p-8 mt-8">
      <Link to={`/subdatasets/${subdatasetId}`} className="text-accent hover:underline">&larr; Back to Subdataset</Link>
      <h1 className="text-2xl font-bold mb-4 mt-2">
        {loadingSubdataset ? 'Link to Task Variant' : `Link ${subdataset?.name || 'Subdataset'} to Task Variant`}
      </h1>
      {loadingLinkedTasks ? (
        <div className="text-gray-400">Loading linked task...</div>
      ) : linkedTasks && linkedTasks.length > 0 && linkedTasks[0].variants.length > 0 ? (
        <div className="text-gray-300 mb-4">
          <span className="font-bold">Already linked to:</span><br />
          <span className="font-bold">Task: </span>
          <Link to={`/tasks/${linkedTasks[0].id}`} className="text-accent hover:underline">{linkedTasks[0].name}</Link>
          <br />
          <span className="font-bold">Variant: </span>
          <span>{linkedTasks[0].variants[0].name}</span>
          <br />
          <span className="text-xs text-gray-400">Unlinking is not yet supported.</span>
          <div className="mt-4">
            <button className="px-4 py-2 bg-accent text-white rounded" onClick={() => navigate(`/subdatasets/${subdatasetId}`)}>
              Back to Subdataset
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {loadingAllTasks ? (
            <div className="text-gray-400">Loading tasks...</div>
          ) : allTasks && allTasks.length > 0 ? (
            <>
              <div>
                <label className="block mb-1 font-semibold">Task</label>
                <select
                  className="w-full border border-border rounded p-2 bg-background text-white"
                  value={selectedTaskId}
                  onChange={e => {
                    setSelectedTaskId(e.target.value)
                    setSelectedVariantId('')
                  }}
                >
                  <option value="">Select a task...</option>
                  {allTasks.map(task => (
                    <option key={task.id} value={task.id}>{task.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold">Variant</label>
                <select
                  className="w-full border border-border rounded p-2 bg-background text-white"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                  disabled={!selectedTaskId}
                >
                  <option value="">Select a variant...</option>
                  {variants.map(variant => (
                    <option key={variant.id} value={variant.id}>{variant.name}</option>
                  ))}
                </select>
              </div>
              <button
                className="mt-2 px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
                onClick={handleLink}
                disabled={!selectedTaskId || !selectedVariantId || linking}
              >
                {linking ? 'Linking...' : 'Link'}
              </button>
              {linkError && <div className="text-red-400 mt-2">{linkError}</div>}
              {linkSuccess && <div className="text-green-400 mt-2">{linkSuccess}</div>}
            </>
          ) : <div className="text-gray-400">No tasks available.</div>}
        </div>
      )}
    </div>
  )
}

export default SubdatasetLinkTaskVariantPage 