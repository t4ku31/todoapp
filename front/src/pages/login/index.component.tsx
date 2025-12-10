import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { env } from '@/config/env';

export default function LoginPage() {

    const handleLogin = async () => {
        window.location.href = `${env.bffApiBaseUrl}/oauth2/authorization/bff-client`;
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center">
            <div>
                <Logo className="min-w-[300px] pb-3" />
                <Card className="rounded-lg min-h-[200px] min-w-[380px]">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-semibold text-center">Login API Test</h2>

                            <Button
                                onClick={handleLogin}
                                className="w-full"
                            >
                                Send GET Request to /login
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

