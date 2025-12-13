import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout() {
	return (
		<SidebarProvider className="w-full h-screen overflow-hidden flex">
			<AppSidebar />
			<main className="flex-1 h-full overflow-auto bg-background">
				<Outlet />
			</main>
		</SidebarProvider>
	);
}
