import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface Subdataset {
  id: number
  name: string
  description: string
  notes: string
  embodiment_id: number | null
  teleop_mode_id: number | null
  raw_episodes: RawEpisode[]
}

interface RawEpisode {
  id: number
  operator: string
  url: string
  label: string
  repository: string
  git_commit: string
  recorded_at: string
  uploaded_at: string
}

function SubdatasetsPage() {
  const [expandedSubdatasetId, setExpandedSubdatasetId] = useState<number | null>(null)
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<number | null>(null)

  const { data: subdatasets, isLoading } = useQuery<Subdataset[]>({
    queryKey: ['subdatasets'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/v1/subdatasets')
      return response.data
    }
  })

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
          <button className="action-button py-2 px-4">Add Raw Episode</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-6 text-sm text-gray-400">
          <span>subdatasets</span>
          <span>details</span>
        </div>

        {subdatasets?.map((subdataset) => (
          <div key={subdataset.id} className="bg-surface rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSubdatasetId(expandedSubdatasetId === subdataset.id ? null : subdataset.id)}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-accent hover:text-black transition-colors"
            >
              <span className="text-xl">{subdataset.name}</span>
            </button>

            {expandedSubdatasetId === subdataset.id && (
              <div className="px-6 py-4 border-t border-border">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Description</h3>
                    <p className="text-gray-300">{subdataset.description}</p>
                  </div>

                  {subdataset.notes && (
                    <div>
                      <h3 className="text-lg font-bold mb-2">Notes</h3>
                      <p className="text-gray-300">{subdataset.notes}</p>
                    </div>
                  )}

                  {subdataset.embodiment_id && (
                    <div>
                      <span className="font-bold">Embodiment ID: </span>
                      <span className="text-gray-300">{subdataset.embodiment_id}</span>
                    </div>
                  )}

                  {subdataset.teleop_mode_id && (
                    <div>
                      <span className="font-bold">Teleop Mode ID: </span>
                      <span className="text-gray-300">{subdataset.teleop_mode_id}</span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold mb-2">Raw Episodes</h3>
                    <div className="space-y-4">
                      {subdataset.raw_episodes.map((episode) => (
                        <div key={episode.id} className="bg-background rounded overflow-hidden">
                          <button
                            onClick={() => setExpandedEpisodeId(expandedEpisodeId === episode.id ? null : episode.id)}
                            className="w-full px-4 py-3 flex justify-between items-center hover:bg-accent hover:text-black transition-colors"
                          >
                            <span className="font-bold">Episode {episode.id}</span>
                            <span className="text-sm">Click to expand</span>
                          </button>

                          {expandedEpisodeId === episode.id && (
                            <div className="px-4 py-3 border-t border-border space-y-3">
                              <div>
                                <span className="font-bold">Operator: </span>
                                <span className="text-gray-300">{episode.operator}</span>
                              </div>

                              <div>
                                <span className="font-bold">Label: </span>
                                <span className="text-gray-300">{episode.label}</span>
                              </div>

                              {episode.url && (
                                <div>
                                  <span className="font-bold">URL: </span>
                                  <a
                                    href={episode.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline"
                                  >
                                    {episode.url}
                                  </a>
                                </div>
                              )}

                              {episode.repository && (
                                <div>
                                  <span className="font-bold">Repository: </span>
                                  <span className="text-gray-300">{episode.repository}</span>
                                </div>
                              )}

                              {episode.git_commit && (
                                <div>
                                  <span className="font-bold">Git Commit: </span>
                                  <span className="text-gray-300">{episode.git_commit}</span>
                                </div>
                              )}

                              <div>
                                <span className="font-bold">Recorded: </span>
                                <span className="text-gray-300">
                                  {new Date(episode.recorded_at).toLocaleString()}
                                </span>
                              </div>

                              <div>
                                <span className="font-bold">Uploaded: </span>
                                <span className="text-gray-300">
                                  {new Date(episode.uploaded_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SubdatasetsPage 