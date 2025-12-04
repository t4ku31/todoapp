import { AppSidebar } from "./app-sidebar";

export default function SidebarLayout() {
    return (
        <aside className="hidden md:block w-64 bg-gray-800 text-white">
            <AppSidebar />
        </aside>
    )
}