import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { env } from "@/config/env";

export default function LoginPage() {
	const handleLogin = async () => {
		window.location.href = `${env.bffApiBaseUrl}/oauth2/authorization/bff-client`;
	};

	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-slate-100 to-indigo-200">
			{/* Decorative elements */}
			<div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
				<div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-300/30 blur-[100px]" />
				<div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/30 blur-[100px]" />
			</div>

			<div className="z-10 w-full max-w-md px-4">
				<Card className="border-white/50 bg-white/60 backdrop-blur-xl shadow-xl ring-1 ring-white/50">
					<CardContent className="pt-10 pb-10 px-8 flex flex-col items-center gap-8">
						<div className="flex flex-col items-center gap-2 text-center">
							<Logo className="w-200" />
							<h2 className="text-2xl font-bold tracking-tight text-slate-800">
								Welcome Back
							</h2>
							<p className="text-muted-foreground text-sm">
								Sign in to continue to your workspace
							</p>
						</div>

						<Button
							size="lg"
							onClick={handleLogin}
							className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
						>
							Sign in with Google
						</Button>

						<div className="text-xs text-muted-foreground text-center px-4">
							By clicking continue, you agree to our{" "}
							<span className="underline cursor-pointer hover:text-slate-900">
								Terms of Service
							</span>{" "}
							and{" "}
							<span className="underline cursor-pointer hover:text-slate-900">
								Privacy Policy
							</span>
							.
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
