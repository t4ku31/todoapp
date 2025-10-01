import { AppSidebar } from "./app-sidebar";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function SidebarLayout() {
    const [open, setOpen] = useState(false);
    return (
        <aside className="hidden md:block w-64 bg-gray-800 text-white">
            <AppSidebar />
        </aside>
    )
}