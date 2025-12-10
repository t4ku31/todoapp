import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <SidebarProvider className="w-full h-screen overflow-hidden flex">
      <AppSidebar />
      <main className="flex-1 h-full overflow-auto bg-background p-4">
        <Outlet />
      </main>
    </SidebarProvider>
  )
}
