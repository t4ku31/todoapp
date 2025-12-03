import { useState } from "react";
import { AppSidebar } from "./app-sidebar";

export default function SidebarLayout() {
    const [open, setOpen] = useState(false);
    return (
        <aside className="hidden md:block w-64 bg-gray-800 text-white">
            <AppSidebar />
        </aside>
    )
}