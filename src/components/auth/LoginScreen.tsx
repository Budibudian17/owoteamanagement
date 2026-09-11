import { useState } from "react";
import { Lock, User, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth.tsx";
import { toast } from "sonner";

export function LoginScreen() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginAsUser } = useAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(password);
    if (success) {
      toast.success("Login berhasil sebagai Admin");
    } else {
      toast.error("Password salah");
    }

    setIsLoading(false);
  };

  const handleUserLogin = () => {
    loginAsUser();
    toast.success("Login berhasil sebagai User");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/owotealogo.png"
            alt="OWO TEA Logo"
            className="mx-auto size-20 sm:size-24 rounded-lg object-contain mb-4"
          />
          <h1 className="text-2xl font-bold tracking-tight">OWO TEA</h1>
          <p className="text-muted-foreground">Dashboard Keuangan CFD Margonda</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Pilih akses yang sesuai dengan kebutuhan Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password Admin
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password admin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Memproses..." : "Login sebagai Admin"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Atau</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleUserLogin}
            >
              <User className="mr-2 size-4" />
              Login sebagai User (View Only)
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          User hanya dapat melihat ringkasan keuangan tanpa akses edit.
        </p>
      </div>
    </div>
  );
}
