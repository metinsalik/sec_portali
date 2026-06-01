import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, User, Info, ArrowRight, SunMoon } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@/components/ThemeProvider"

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) {
      setError("Başlamak için kullanıcı adınızı giriniz.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await login(username);
      navigate("/portal");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Giriş başarısız.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow flex items-stretch overflow-hidden">
        {/* Visual Section (Desktop) */}
        <div className="hidden md:flex md:w-1/2 medical-pattern p-16 flex-col justify-between text-white relative">
          <div className="z-10 animate-fade-in">
            <div className="bg-white/10 w-16 h-16 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 mb-12">
              <Shield className="w-9 h-9 text-white fill-white/15" />
            </div>
            <h1 className="text-[36px] leading-[40px] tracking-[-0.02em] font-bold mb-6">
              Tesisinizi<br />Akıllıca Yönetin.
            </h1>
            <p className="text-[18px] leading-[28px] text-white/80 max-w-md">
              SEÇ PORTALI ile tüm tesis envanterinizi, İSG süreçlerinizi ve operasyonel verimliliğinizi tek bir platformdan takip edin.
            </p>
          </div>
          
          <div className="z-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#0051d5] bg-[#e5eeff] flex items-center justify-center text-[#0051d5] font-bold text-xs">İGÜ</div>
              <div className="w-10 h-10 rounded-full border-2 border-[#0051d5] bg-[#e5eeff] flex items-center justify-center text-[#0051d5] font-bold text-xs">İHM</div>
              <div className="w-10 h-10 rounded-full border-2 border-[#0051d5] bg-[#e5eeff] flex items-center justify-center text-[#0051d5] font-bold text-xs">DSP</div>
            </div>
            <p className="text-[12px] leading-[16px] font-semibold text-white/70">
              Binlerce çalışan şu an güvende.
            </p>
          </div>
          
          {/* Atmospheric Glow */}
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-background relative">
          <div className="w-full max-w-[440px] flex flex-col">
            
            {/* Branding Header */}
            <div className="mb-12 flex justify-between items-center">
              <div className="transition-transform duration-300 hover:scale-105 cursor-pointer">
                <img 
                  alt="MLP-CARE Logo" 
                  className="h-10 w-auto object-contain dark:brightness-200" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbZ0FOM8SO3bV53bC0Mf206LOkEEQkGxLF54pwfRSwzbiuKxsOHwFv54NnVaee42x2uvDJ4A9679OWdpYEJ-_HJQMIwJx5QjV-V3JdwQGduQCfDzua1QTpvS_Bq07SPojDNcZOo1-OHmSaFg9CguYtnkyTdGuZsIzsAHZXOUWiK0RpyIIVW95TTCFd0KIEQY9oDijgQHoOAbGgBCWXdt2GtxgA3o0n5IxnkDLKu1pnpQYOtdW8-RnTv0VAuLc1TEnTZBys-gy_BLc"
                />
              </div>
              <button 
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground" 
                id="theme-toggle"
                aria-label="Toggle theme"
              >
                <SunMoon className="h-5 w-5" />
              </button>
            </div>

            {/* Card */}
            <div className="bg-card p-8 md:p-10 rounded-xl form-shadow border border-border/80 text-card-foreground">
              <div className="mb-8">
                <h2 className="text-[30px] leading-[36px] font-bold text-foreground mb-2 tracking-tight">
                  Tekrar Hoş Geldiniz
                </h2>
                <p className="text-[16px] leading-[24px] text-muted-foreground">
                  Hesabınıza erişmek için kullanıcı adınızı girin.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[14px] leading-[20px] font-medium text-foreground" htmlFor="username">
                    Kullanıcı adınızı giriniz.
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
                      <User className="h-5 w-5" />
                    </span>
                    <Input 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ad.soyad" 
                      className="w-full pl-10 pr-4 py-3 bg-background border-input rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all outline-none text-[16px] leading-[24px] h-12"
                      id="username"
                      name="username"
                      type="text"
                      disabled={isSubmitting}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 font-medium mt-2">{error}</p>}
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[14px] leading-[20px] text-muted-foreground">
                    Kendi windows oturumunuzda kullanıcı adınızla giriş yapabilirsiniz.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#0051d5] hover:bg-[#0051d5]/90 text-white py-3.5 h-12 rounded-lg text-[14px] leading-[20px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all group cursor-pointer"
                >
                  {isSubmitting ? "Giriş Yapılıyor..." : "Giriş Yap"}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-border/80 text-center">
                <a className="text-[14px] leading-[20px] font-medium text-[#0051d5] dark:text-[#3b82f6] hover:underline transition-all" href="#">
                  Giriş yapamıyor musunuz? Destek alın
                </a>
              </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 space-y-4">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                <a className="text-[12px] leading-[16px] font-semibold text-muted-foreground hover:text-[#0051d5] transition-colors" href="#">Gizlilik Politikası</a>
                <a className="text-[12px] leading-[16px] font-semibold text-muted-foreground hover:text-[#0051d5] transition-colors" href="#">Kullanım Koşulları</a>
                <a className="text-[12px] leading-[16px] font-semibold text-muted-foreground hover:text-[#0051d5] transition-colors" href="#">Güvenlik</a>
              </div>
              <div className="text-center">
                <p className="text-[12px] leading-[16px] font-semibold text-muted-foreground/60">
                  Sistem sürümü: v2.4.1 (Global Sağlık Standartları)
                </p>
                <p className="text-[12px] leading-[16px] font-semibold text-muted-foreground/40 mt-1 uppercase tracking-wider">
                  © 2026 MLP-CARE Healthcare Portal. All rights reserved.
                </p>
              </div>
            </footer>

          </div>
        </div>
      </main>
    </div>
  )
}
