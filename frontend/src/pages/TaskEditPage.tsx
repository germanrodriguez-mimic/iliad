import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BACKEND_URL } from '../config/api'

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

interface SubdatasetList {
  id: number
  name: string
  description: string | null
  notes: string | null
  embodiment_id: number | null
  teleop_mode_id: number | null
}

interface TrainingRunSummary {
  id: number
  dataset_id: number | null
  url: string | null
}

interface TaskDetailSummary {
  id: number
  name: string
  description: string | null
  status: string
  created_at: string
  is_external: boolean
  variants: TaskVariant[]
  subdatasets: SubdatasetList[]
  training_runs: TrainingRunSummary[]
  evaluations: any[]
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

const TaskEditPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<TaskDetailSummary>({
    queryKey: ['task-detail', taskId],
    queryFn: async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/tasks/${taskId}/detail`)
      return response.data
    },
    enabled: !!taskId
  })

  const [description, setDescription] = useState<string>('')
  const [status, setStatus] = useState<string>('created')
  const [variants, setVariants] = useState<TaskVariant[]>([])
  const [subdatasets, setSubdatasets] = useState<SubdatasetList[]>([])
  const [trainingRuns, setTrainingRuns] = useState<TrainingRunSummary[]>([])

  React.useEffect(() => {
    if (data) {
      setDescription(data.description || '')
      setStatus(data.status)
      setVariants(data.variants)
      setSubdatasets(data.subdatasets)
      setTrainingRuns(data.training_runs)
    }
  }, [data])

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updated: { description: string; status: string }) => {
      await axios.put(`${BACKEND_URL}/api/v1/tasks/${taskId}`, {
        description: updated.description,
        status: updated.status,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task-detail', taskId])
      navigate(`/tasks/${taskId}`)
    },
  })

  // Remove variant
  const removeVariant = (variantId: number) => {
    setVariants((prev) => prev.filter(v => v.id !== variantId))
    // TODO: call backend to remove variant
  }

  // Unlink subdataset
  const unlinkSubdataset = (subdatasetId: number) => {
    setSubdatasets((prev) => prev.filter(sd => sd.id !== subdatasetId))
    // TODO: call backend to unlink subdataset
  }

  // Unlink training run
  const unlinkTrainingRun = (trainingRunId: number) => {
    setTrainingRuns((prev) => prev.filter(tr => tr.id !== trainingRunId))
    // TODO: call backend to unlink training run
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading task...</div>
  }
  if (error || !data) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Failed to load task.</div>
  }

  return (
    <div className="max-w-3xl mx-auto bg-surface rounded-lg shadow p-8">
      <Link to={`/tasks/${taskId}`} className="text-accent hover:underline">&larr; Back to Task</Link>
      <h1 className="text-3xl font-bold mt-2 mb-4">Edit Task: {data.name}</h1>
      <form
        onSubmit={e => {
          e.preventDefault()
          updateTaskMutation.mutate({ description, status })
        }}
        className="space-y-8"
      >
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
          <label className="block font-semibold mb-1">Task Variants</label>
          <div className="space-y-2">
            {variants.map(variant => (
              <div key={variant.id} className="flex items-center justify-between border border-border rounded px-3 py-2 bg-background">
                <div>
                  <div className="font-bold">{variant.name}</div>
                  {variant.description && <div className="text-xs text-gray-400">{variant.description}</div>}
                </div>
                {variant.name !== 'default' && (
                  <button
                    type="button"
                    className="text-red-400 hover:underline text-xs ml-4"
                    onClick={() => removeVariant(variant.id)}
                  >Remove</button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="action-button py-1 px-3 mt-2"
              // TODO: implement add variant modal
              onClick={() => {}}
            >Add Variant</button>
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Linked Subdatasets</label>
          <div className="space-y-2">
            {subdatasets.map(sd => (
              <div key={sd.id} className="flex items-center justify-between border border-border rounded px-3 py-2 bg-background">
                <div>
                  <div className="font-bold">{sd.name}</div>
                  {sd.description && <div className="text-xs text-gray-400">{sd.description}</div>}
                </div>
                <button
                  type="button"
                  className="text-red-400 hover:underline text-xs ml-4"
                  onClick={() => unlinkSubdataset(sd.id)}
                >Unlink</button>
              </div>
            ))}
            <button
              type="button"
              className="action-button py-1 px-3 mt-2"
              // TODO: implement link subdatasets modal
              onClick={() => {}}
            >Link Subdatasets</button>
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Linked Training Runs</label>
          <div className="space-y-2">
            {trainingRuns.map(tr => (
              <div key={tr.id} className="flex items-center justify-between border border-border rounded px-3 py-2 bg-background">
                <div>
                  <div className="font-bold">Training Run #{tr.id}</div>
                  {tr.url && <a href={tr.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">View Run</a>}
                </div>
                <button
                  type="button"
                  className="text-red-400 hover:underline text-xs ml-4"
                  onClick={() => unlinkTrainingRun(tr.id)}
                >Unlink</button>
              </div>
            ))}
            <button
              type="button"
              className="action-button py-1 px-3 mt-2"
              // TODO: implement link training runs modal
              onClick={() => {}}
            >Link Training Runs</button>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="action-button py-2 px-6"
            disabled={updateTaskMutation.isLoading}
          >Save Changes</button>
        </div>
      </form>
    </div>
  )
}

export default TaskEditPage 