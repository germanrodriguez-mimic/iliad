import { Routes, Route, Link } from 'react-router-dom'
import TasksPage from './pages/TasksPage'
import SubdatasetsPage from './pages/SubdatasetsPage'
import TaskDetailPage from './pages/TaskDetailPage'
import TaskEditPage from './pages/TaskEditPage'
import SubdatasetDetailPage from './pages/SubdatasetDetailPage'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed w-full z-10 bg-background px-8 py-4">
        <Link to="/" className="text-xl font-bold hover:text-accent transition-colors">
          mimic data manager
        </Link>
      </nav>

      <main className="pt-24 px-8">
        <Routes>
          <Route path="/" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl mb-12 text-center">Welcome to the mimic data manager</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                <Link to="/tasks" className="action-button">Manage Tasks</Link>
                <Link to="/subdatasets" className="action-button">Manage Subdatasets</Link>
              </div>
            </div>
          } />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/subdatasets" element={<SubdatasetsPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="/tasks/:taskId/edit" element={<TaskEditPage />} />
          <Route path="/subdatasets/:subdatasetId" element={<SubdatasetDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App 