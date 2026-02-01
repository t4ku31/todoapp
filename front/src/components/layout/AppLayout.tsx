import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout() {
	return (
		<SidebarProvider className="w-full h-screen overflow-hidden flex">
			<AppSidebar />
			<main className="flex-1 h-full overflow-auto bg-gradient-to-br from-indigo-50 via-white to-purple-50">
				<Outlet />
			</main>
		</SidebarProvider>
	);
}
