import { useState } from "react";
import { Lock, User, Mail, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth.tsx";
import { toast } from "sonner";

export function LoginScreen() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"admin" | "member" | "view">("admin");
  const { login, loginWithEmail, loginAsUser } = useAuth();

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

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await loginWithEmail(email, memberPassword);
    if (result.success) {
      toast.success("Login berhasil sebagai Member");
    } else {
      toast.error(result.error || "Login gagal");
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
            {/* Login Mode Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={loginMode === "admin" ? "default" : "outline"}
                size="sm"
                onClick={() => setLoginMode("admin")}
              >
                Admin
              </Button>
              <Button
                type="button"
                variant={loginMode === "member" ? "default" : "outline"}
                size="sm"
                onClick={() => setLoginMode("member")}
              >
                Member
              </Button>
              <Button
                type="button"
                variant={loginMode === "view" ? "default" : "outline"}
                size="sm"
                onClick={() => setLoginMode("view")}
              >
                View
              </Button>
            </div>

            {/* Admin Login */}
            {loginMode === "admin" && (
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
                      autoComplete="new-password"
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
            )}

            {/* Member Login */}
            {loginMode === "member" && (
              <form onSubmit={handleMemberLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Masukkan email member"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="member-password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="member-password"
                      type="password"
                      placeholder="Masukkan password"
                      value={memberPassword}
                      onChange={(e) => setMemberPassword(e.target.value)}
                      className="pl-9"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Login sebagai Member"}
                </Button>
              </form>
            )}

            {/* View Only Login */}
            {loginMode === "view" && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleUserLogin}
              >
                <User className="mr-2 size-4" />
                Login sebagai User (View Only)
              </Button>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {loginMode === "admin" && "Admin dapat mengedit semua data keuangan."}
          {loginMode === "member" && "Member dapat melihat data gaji mereka sendiri."}
          {loginMode === "view" && "User hanya dapat melihat ringkasan keuangan tanpa akses edit."}
        </p>
      </div>
    </div>
  );
}
