import {
	Calendar,
	CheckSquare,
	Home,
	LogOut,
	Presentation,
	Settings,
	TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";
import {
	Sidebar,
	SidebarContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { env } from "@/config/env";
import { cn } from "@/lib/utils";

type AppSidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function AppSidebar({ className, ...props }: AppSidebarProps) {
	const location = useLocation();
	const isActive = (path: string) => location.pathname === path;

	const menuItems = [
		{ icon: Home, path: "/home", label: "Home" },
		{ icon: CheckSquare, path: "/tasks", label: "My Tasks" },
		{ icon: Calendar, path: "/calendar", label: "Calendar" },
		{ icon: TrendingUp, path: "/analytics", label: "Analytics" },
		{ icon: Settings, path: "/settings", label: "Settings" },
	];

	const [hasSeenSlideGuide, setHasSeenSlideGuide] = useState(true);

	useEffect(() => {
		const seen = localStorage.getItem("hasSeenSlideGuide");
		setHasSeenSlideGuide(seen === "true");
	}, []);

	const handleSlideClick = () => {
		if (!hasSeenSlideGuide) {
			localStorage.setItem("hasSeenSlideGuide", "true");
			setHasSeenSlideGuide(true);
		}
	};

	return (
		<Sidebar
			collapsible="none"
			className={cn(
				"flex flex-col items-center border-none bg-gradient-to-b from-blue-50 to-indigo-100 w-25",
				className,
			)}
			{...props}
		>
			<Logo className="w-25 h-25" />
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
								<Link
									to={item.path}
									className="flex items-center justify-center"
								>
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
					{/* Divider */}
					<div className="w-12 h-px bg-slate-200/60 mb-2" />

					{/* Presentation Button - Differentiated */}
					<div className="relative flex justify-center w-full">
						{!hasSeenSlideGuide && (
							<div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg animate-bounce z-50">
								Click here!
								<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rotate-45" />
							</div>
						)}
						<SidebarMenuButton
							asChild
							className={cn(
								"h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
								isActive("/presentation")
									? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20 scale-110"
									: "bg-amber-50/50 text-amber-600 border border-amber-100/50 hover:bg-amber-100 hover:scale-105",
							)}
						>
							<Link
								to="/presentation"
								className="flex items-center justify-center"
								title="Presentation"
								onClick={handleSlideClick}
							>
								<Presentation
									className={cn(
										"h-6 w-6",
										isActive("/presentation") ? "text-white" : "text-amber-500",
									)}
									strokeWidth={2}
								/>
							</Link>
						</SidebarMenuButton>
					</div>

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
			{/* <div className="pb-8 px-4 flex flex-col items-center gap-6">
				<div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform">
					<img
						src="https://github.com/shadcn.png"
						alt="User"
						className="h-full w-full object-cover"
					/>
				</div>
			</div> */}
		</Sidebar>
	);
}
