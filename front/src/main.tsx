import AppLayout from '@/components/layout/AppLayout'
import { Toaster } from '@/components/ui/sonner'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './index.css'
import Login from './pages/login/index'

import Todo from './pages/todo/index'

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/auth" element={<Login />} />

        <Route element={<AppLayout />}>
          <Route path="/todo" element={<Todo />} />
        </Route>

        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router >
  )
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster />
  </StrictMode>,
)
