import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import TasksPage from './pages/TasksPage'
import SubdatasetsPage from './pages/SubdatasetsPage'
import TaskDetailPage from './pages/TaskDetailPage'
import TaskEditPage from './pages/TaskEditPage'
import TaskCreatePage from './pages/TaskCreatePage'
import TaskVariantCreatePage from './pages/TaskVariantCreatePage'
import SubdatasetDetailPage from './pages/SubdatasetDetailPage'
import SubdatasetLinkTaskVariantPage from './pages/SubdatasetLinkTaskVariantPage'
import ItemsPage from './pages/ItemsPage'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed w-full z-10 bg-background px-8 py-4">
        <Link to="/" className="text-xl font-bold hover:text-accent transition-colors">
          mimic hub
        </Link>
      </nav>

      <main className="pt-24 px-8">
        <Routes>
          <Route path="/" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl mb-12 text-center">Welcome to the mimic hub</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                <Link to="/tasks" className="action-button">Manage Tasks</Link>
                <Link to="/subdatasets" className="action-button">Manage Subdatasets</Link>
                <Link to="/items" className="action-button">Manage Items</Link>
              </div>
            </div>
          } />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/create" element={<TaskCreatePage />} />
          <Route path="/tasks/variants/create" element={<TaskVariantCreatePage />} />
          <Route path="/subdatasets" element={<SubdatasetsPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="/tasks/:taskId/edit" element={<TaskEditPage />} />
          <Route path="/subdatasets/:subdatasetId" element={<SubdatasetDetailPage />} />
          <Route path="/subdatasets/:subdatasetId/link-task-variant" element={<SubdatasetLinkTaskVariantPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App 