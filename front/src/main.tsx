import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './index.css'
import Debug from './pages/debug/index'
import Login from './pages/login/index'
import Signin from './pages/signin/index'
import Signup from './pages/signup/index'
import Todo from './pages/todo/index'

function App() {
  return (
    <Router basename="/front">
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/auth" element={<Login />} />
        <Route path="/todo" element={
          <SidebarProvider>
            <div className="flex w-screen h-screen">
              <aside className='w-80 flex-shrink'>
                <AppSidebar />
              </aside>
              <main className="flex-1 ">
                <Todo />
              </main>
            </div>
          </SidebarProvider>
        } />
        <Route path="/debug" element={
          <SidebarProvider>
            <div className="flex w-screen h-screen">
              <aside className='w-80 flex-shrink'>
                <AppSidebar />
              </aside>
              <main className="flex-1 overflow-auto">
                <Debug />
              </main>
            </div>
          </SidebarProvider>
        } />
        <Route path="/" element={<Navigate to="/signin" replace />} />
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
