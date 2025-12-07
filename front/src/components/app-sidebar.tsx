import Logo from "@/components/common/Logo";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { CheckSquare, LogOut, } from "lucide-react";
import { Link } from "react-router-dom";

import { env } from "@/config/env";

type AppSidebarProps = React.HTMLAttributes<HTMLDivElement>;
export function AppSidebar({ className, ...props }: AppSidebarProps) {
    return (
        <Sidebar className={cn("w-80 bg-sidebar text-sidebar-foreground", className)}  {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-2">
                    <Logo />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link to="/todo">
                                <CheckSquare className="h-4 w-4" />
                                <span className="text-base">Tasks</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link to="/debug">
                                <CheckSquare className="h-4 w-4" />
                                <span className="text-base">Debug</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a href={`${env.bffApiBaseUrl}/logout`} onClick={(e) => {
                                e.preventDefault();
                                console.log('Logout URL:', `${env.bffApiBaseUrl}/logout`);
                                const form = document.createElement('form');
                                form.method = 'POST';
                                form.action = `${env.bffApiBaseUrl}/logout`;
                                document.body.appendChild(form);
                                form.submit();
                            }}>
                                <LogOut />
                                <span className="text-base">Logout</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar >
    )
}
