import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

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

  // Query for subdataset list
  const { data: subdatasets, isLoading } = useQuery<SubdatasetList[]>({
    queryKey: ['subdatasets-list'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/v1/subdatasets/list')
      return response.data
    }
  })

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

  // Filter subdatasets by search
  const filteredSubdatasets = subdatasets?.filter((subdataset) =>
    subdataset.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
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
        <div className="space-x-4">
          <button className="action-button py-2 px-4">Add New Subdataset</button>
        </div>
      </div>

      <div className="mb-4 flex justify-start">
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
          <span>details</span>
        </div>

        {(filteredSubdatasets?.length ?? 0) === 0 ? (
          <div className="text-center text-gray-400 py-8">No subdatasets found.</div>
        ) : (
          filteredSubdatasets?.map((subdataset) => (
            <div key={subdataset.id} className="bg-surface rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSubdatasetId(expandedSubdatasetId === subdataset.id ? null : subdataset.id)}
                className="w-full px-6 py-4 flex items-center hover:bg-accent hover:text-black transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xl truncate block">{subdataset.name}</span>
                </div>
                {expandedSubdatasetId !== subdataset.id && (
                  <div className="flex flex-col gap-1 ml-4 flex-shrink-0">
                    {subdataset.embodiment && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-background text-white truncate max-w-[120px]">
                        {subdataset.embodiment.name}
                      </span>
                    )}
                    {subdataset.teleop_mode && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-background text-white truncate max-w-[120px]">
                        {subdataset.teleop_mode.name}
                      </span>
                    )}
                  </div>
                )}
              </button>

              {expandedSubdatasetId === subdataset.id && (
                <div className="px-6 py-4 border-t border-border">
                  {expandedSubdataset ? (
                    <div className="space-y-4">
                      {expandedSubdataset.description && (
                        <div>
                          <h3 className="text-lg font-bold mb-2">Description</h3>
                          <p className="text-gray-300">{expandedSubdataset.description}</p>
                        </div>
                      )}

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

                      <div>
                        <h3 className="text-lg font-bold mb-2">Raw Episodes</h3>
                        <div className="space-y-4">
                          {expandedSubdataset.raw_episodes.map((episode) => (
                            <div key={episode.id} className="bg-background rounded p-4">
                              <div className="grid grid-cols-2 gap-4">
                                {episode.operator && (
                                  <div>
                                    <span className="font-bold">Operator: </span>
                                    <span className="text-gray-300">{episode.operator}</span>
                                  </div>
                                )}
                                {episode.label && (
                                  <div>
                                    <span className="font-bold">Label: </span>
                                    <span className="text-gray-300">{episode.label}</span>
                                  </div>
                                )}
                                {episode.recorded_at && (
                                  <div>
                                    <span className="font-bold">Recorded At: </span>
                                    <span className="text-gray-300">
                                      {new Date(episode.recorded_at).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold">Uploaded At: </span>
                                  <span className="text-gray-300">
                                    {new Date(episode.uploaded_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              {episode.url && (
                                <div className="mt-2">
                                  <a
                                    href={episode.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline"
                                  >
                                    View Episode
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center py-4">
                      <div className="text-gray-400">Loading subdataset details...</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SubdatasetsPage 