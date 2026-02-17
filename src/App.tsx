import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Tasks } from './pages/Tasks'
import { TokenUsage } from './pages/TokenUsage'
import { Memory } from './pages/Memory'
import { SystemHealth } from './pages/SystemHealth'
import { AuditReports } from './pages/AuditReports'
import { Projects } from './pages/Projects'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tokens" element={<TokenUsage />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/health" element={<SystemHealth />} />
          <Route path="/audits" element={<AuditReports />} />
          <Route path="/projects" element={<Projects />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App