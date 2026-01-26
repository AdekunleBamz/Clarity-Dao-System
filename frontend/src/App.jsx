import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Governance from './components/Governance'
import Treasury from './components/Treasury'
import Tokens from './components/Tokens'
import MembershipNFT from './components/MembershipNFT'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/treasury" element={<Treasury />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/membership" element={<MembershipNFT />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
