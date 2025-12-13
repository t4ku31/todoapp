import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { env } from "@/config/env";
import { cn } from "@/lib/utils";
import {
    Calendar, Check, CheckSquare, Home, LogOut,
    Settings,
    TrendingUp
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type AppSidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function AppSidebar({ className, ...props }: AppSidebarProps) {
	const location = useLocation();
	const isActive = (path: string) => location.pathname === path;

	const menuItems = [
		{ icon: Home, path: "/home", label: "Home" },
		{ icon: CheckSquare, path: "/tasks", label: "My Tasks" },
		{ icon: Calendar, path: "/calendar", label: "Calendar" },
		{ icon: TrendingUp, path: "/analytics", label: "Analytics" }, // Adding placeholder for graph
		{ icon: Settings, path: "/settings", label: "Settings" }, // Adding placeholder for settings
	];

	return (
		<Sidebar
			collapsible="none"
			className={cn(
				"border-none bg-gradient-to-b from-blue-50 to-indigo-100",
				className,
			)}
			{...props}
		>
			<SidebarHeader className="flex items-center justify-center pt-8 pb-8">
				<div className="relative">
					<div className="h-12 w-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-12">
						<Check
							className="h-8 w-8 text-white"
							strokeWidth={3}
						/>
					</div>
					<div className="absolute -bottom-2 -left-2">
						<div className="h-4 w-4 bg-orange-400 rounded-full blur-[2px]" />
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent className="flex flex-col items-center gap-4 px-4 overflow-visible">
				<SidebarMenu className="gap-4">
					{menuItems.map((item) => (
						<SidebarMenuItem key={item.path}>
							<SidebarMenuButton
								asChild
								className={cn(
									"h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
									isActive(item.path)
										? "bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-lg shadow-indigo-500/30 scale-110"
										: "bg-white/40 text-slate-500 hover:bg-gray-50 hover:scale-105",
								)}
							>
								<Link to={item.path} className="flex items-center justify-center">
									<item.icon
										className={cn(
											"h-6 w-6",
											isActive(item.path) ? "text-white" : "text-slate-500",
										)}
										strokeWidth={2}
									/>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>

				<div className="mt-auto pb-4 flex flex-col items-center gap-4 w-full">
					{/* Logout Button */}
					<SidebarMenuButton
						asChild
						className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white/40 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all duration-300"
					>
						<a
							href={`${env.bffApiBaseUrl}/logout`}
							onClick={(e) => {
								e.preventDefault();
								const form = document.createElement("form");
								form.method = "POST";
								form.action = `${env.bffApiBaseUrl}/logout`;
								document.body.appendChild(form);
								form.submit();
							}}
							className="flex items-center justify-center"
						>
							<LogOut className="h-6 w-6" strokeWidth={2} />
						</a>
					</SidebarMenuButton>
				</div>
			</SidebarContent>

			{/* Custom Footer for Avatar */}
			<div className="pb-8 px-4 flex flex-col items-center gap-6">
				<div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform">
					<img
						src="https://github.com/shadcn.png"
						alt="User"
						className="h-full w-full object-cover"
					/>
				</div>
			</div>
		</Sidebar>
	);
}
