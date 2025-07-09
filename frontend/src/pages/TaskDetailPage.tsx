import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import ConfigurationImages from '../components/ConfigurationImages'

interface TaskVariant {
  id: number
  name: string
  description: string | null
  items: string | null
  embodiment_id: number | null
  teleop_mode_id: number | null
  embodiment?: { id: number; name: string } | null
  teleop_mode?: { id: number; name: string } | null
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

interface EvaluationSummary {
  id: number
  task_id: number
  name: string | null
  description: string | null
  media: string | null
  items: string | null
  embodiment_id: number | null
  notes: string | null
}

interface TaskVariantSubdatasets {
  variant: TaskVariant;
  subdatasets: SubdatasetList[];
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
  subdatasets_by_variant: TaskVariantSubdatasets[]
  training_runs: TrainingRunSummary[]
  evaluations: EvaluationSummary[]
}

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const [expandedVariantId, setExpandedVariantId] = useState<number | null>(null)
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery<TaskDetailSummary>({
    queryKey: ['task-detail', taskId],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:8000/api/v1/tasks/${taskId}/detail`)
      return response.data
    },
    enabled: !!taskId
  })

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading task details...</div>
  }
  if (error || !data) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Failed to load task details.</div>
  }

  return (
    <div className="max-w-4xl mx-auto bg-surface rounded-lg shadow p-8">
      <div className="flex justify-between items-center mb-2">
        <Link to="/tasks" className="text-accent hover:underline">&larr; Back to Tasks</Link>
        <Link
          to={`/tasks/${data.id}/edit`}
          className="action-button py-1 px-4 text-xs"
        >
          Edit Task
        </Link>
      </div>
      <h1 className="text-3xl font-bold mt-2 mb-4">{data.name}</h1>
      <div className="mb-4 text-gray-400 text-sm">Status: <span className="capitalize">{data.status}</span> | Created: {new Date(data.created_at).toLocaleString()}</div>
      {data.is_external && <div className="mb-4 text-xs px-2 py-1 rounded bg-background text-white border border-accent inline-block">External</div>}
      {data.description && <p className="mb-6 text-lg text-gray-200">{data.description}</p>}

      {/* Variants */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Task Variants</h2>
        {data.variants.length === 0 ? <div className="text-gray-400">No variants.</div> : (
          <ul className="space-y-2">
            {data.variants.map(variant => (
              <li key={variant.id} className="border border-border rounded p-3 bg-background">
                <button
                  className="w-full text-left font-bold flex justify-between items-center hover:text-accent"
                  onClick={() => setExpandedVariantId(expandedVariantId === variant.id ? null : variant.id)}
                >
                  {variant.name}
                  <span className="ml-2 text-xs">{expandedVariantId === variant.id ? '▲' : '▼'}</span>
                </button>
                {expandedVariantId === variant.id && (
                  <div className="mt-2 space-y-2">
                    {variant.description && <div className="text-gray-300 text-sm">{variant.description}</div>}
                    {variant.items && <div className="text-xs text-gray-400">Items: {variant.items}</div>}
                    {variant.embodiment && <div className="text-xs text-gray-400">Embodiment: {variant.embodiment.name}</div>}
                    {variant.teleop_mode && <div className="text-xs text-gray-400">Teleop Mode: {variant.teleop_mode.name}</div>}
                    {variant.notes && <div className="text-xs text-gray-400">Notes: {variant.notes}</div>}
                    {variant.media && variant.media.length > 0 && (
                      <ConfigurationImages mediaUrls={variant.media} variantId={variant.id} />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Subdatasets (grouped by variant) */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Linked Subdatasets</h2>
        {(!data.subdatasets_by_variant || data.subdatasets_by_variant.length === 0) ? (
          <div className="text-gray-400">No subdatasets linked.</div>
        ) : (
          <ul className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {data.subdatasets_by_variant.map((group) => (
              <li key={group.variant.id} className="border border-border rounded p-3 bg-background">
                <button
                  className="w-full text-left font-bold flex justify-between items-center hover:text-accent"
                  onClick={() => setExpandedVariantId(expandedVariantId === group.variant.id ? null : group.variant.id)}
                >
                  {group.variant.name}
                  <span className="ml-2 text-xs">{expandedVariantId === group.variant.id ? '▲' : '▼'}</span>
                </button>
                {expandedVariantId === group.variant.id && (
                  <div className="mt-2">
                    <h3 className="font-semibold text-sm mb-1">Linked Subdatasets:</h3>
                    {group.subdatasets.length === 0 ? (
                      <div className="text-gray-400 text-xs">No subdatasets linked to this variant.</div>
                    ) : (
                      <ul className="space-y-2">
                        {group.subdatasets.map(sd => (
                          <li key={sd.id} className="border border-border rounded p-2 bg-surface">
                            <Link to={`/subdatasets/${sd.id}`} className="font-bold text-accent hover:underline">{sd.name}</Link>
                            {sd.description && <div className="text-gray-300 text-xs mb-1">{sd.description}</div>}
                            {sd.notes && <div className="text-xs text-gray-400">Notes: {sd.notes}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Training Runs */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Training Runs</h2>
        {data.training_runs.length === 0 ? <div className="text-gray-400">No training runs.</div> : (
          <ul className="space-y-2">
            {data.training_runs.map(tr => (
              <li key={tr.id} className="border border-border rounded p-3 bg-background">
                <div>ID: {tr.id}</div>
                {tr.dataset_id && <div className="text-xs text-gray-400">Dataset ID: {tr.dataset_id}</div>}
                {tr.url && <div className="text-xs text-accent"><a href={tr.url} target="_blank" rel="noopener noreferrer">Training Run Link</a></div>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Evaluations */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Evaluations</h2>
        {data.evaluations.length === 0 ? <div className="text-gray-400">No evaluations.</div> : (
          <ul className="space-y-2">
            {data.evaluations.map(ev => (
              <li key={ev.id} className="border border-border rounded p-3 bg-background">
                <div className="font-bold">{ev.name || `Evaluation #${ev.id}`}</div>
                {ev.description && <div className="text-gray-300 text-sm mb-1">{ev.description}</div>}
                {ev.media && <div className="text-xs text-accent"><a href={ev.media} target="_blank" rel="noopener noreferrer">Media Link</a></div>}
                {ev.items && <div className="text-xs text-gray-400">Items: {ev.items}</div>}
                {ev.notes && <div className="text-xs text-gray-400">Notes: {ev.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default TaskDetailPage 