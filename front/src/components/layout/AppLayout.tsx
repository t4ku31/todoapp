import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout() {
	return (
		<SidebarProvider className="w-full h-screen overflow-hidden flex">
			<AppSidebar />
			<main className="flex-1 h-full overflow-auto bg-gradient-to-r from-blue-200 via-purple-200 to-purple-300">
				<Outlet />
			</main>
		</SidebarProvider>
	);
}
