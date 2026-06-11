import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, User, Info, ArrowRight, SunMoon, ShieldCheck, Activity } from "lucide-react"
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
    <div className="min-h-screen flex bg-background selection:bg-blue-500/30">
      
      {/* LEFT PANEL - VISUAL (Modernized) */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-[#00102a]">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#0051d5] blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#00b4d8] blur-[150px] opacity-20"></div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-lg shadow-black/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-white/90 text-sm font-semibold tracking-wide">Güvenli Giriş Sistemi</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
              Yeni Nesil<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300">
                İSG Yönetimi.
              </span>
            </h1>
            
            <p className="text-lg text-white/70 max-w-md leading-relaxed font-light">
              Tüm kurumsal sağlık, güvenlik ve çevre operasyonlarınızı tek bir birleşik platformdan güvenle yönetin ve optimize edin.
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-6 max-w-xl">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors shadow-2xl shadow-black/20">
                <Activity className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-white font-semibold mb-2 text-lg">Gerçek Zamanlı Veri</h3>
                <p className="text-white/60 text-sm leading-relaxed">Anlık operasyonel analizler, performans metrikleri ve raporlar.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors shadow-2xl shadow-black/20">
                <Shield className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-white font-semibold mb-2 text-lg">Tam Uyumluluk</h3>
                <p className="text-white/60 text-sm leading-relaxed">Uluslararası İSG standartlarına ve güncel yasalara tam uygunluk.</p>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-4 pt-8 border-t border-white/10">
              <div className="flex -space-x-3">
                <div className="w-11 h-11 rounded-full border-2 border-[#00102a] bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center text-blue-200 font-bold text-xs backdrop-blur-sm shadow-md">İGÜ</div>
                <div className="w-11 h-11 rounded-full border-2 border-[#00102a] bg-gradient-to-br from-cyan-500/30 to-cyan-600/30 flex items-center justify-center text-cyan-200 font-bold text-xs backdrop-blur-sm shadow-md">İHM</div>
                <div className="w-11 h-11 rounded-full border-2 border-[#00102a] bg-gradient-to-br from-indigo-500/30 to-indigo-600/30 flex items-center justify-center text-indigo-200 font-bold text-xs backdrop-blur-sm shadow-md">DSP</div>
              </div>
              <p className="text-sm font-medium text-white/80">
                Binlerce profesyonel<br/>şu an sistemde aktif.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="w-full lg:w-[45%] flex flex-col relative bg-background">
        {/* Top Header */}
        <div className="absolute top-0 w-full p-8 flex justify-between items-center z-10">
          <img 
            alt="MLP-CARE Logo" 
            className="h-10 w-auto object-contain dark:brightness-200 transition-all" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbZ0FOM8SO3bV53bC0Mf206LOkEEQkGxLF54pwfRSwzbiuKxsOHwFv54NnVaee42x2uvDJ4A9679OWdpYEJ-_HJQMIwJx5QjV-V3JdwQGduQCfDzua1QTpvS_Bq07SPojDNcZOo1-OHmSaFg9CguYtnkyTdGuZsIzsAHZXOUWiK0RpyIIVW95TTCFd0KIEQY9oDijgQHoOAbGgBCWXdt2GtxgA3o0n5IxnkDLKu1pnpQYOtdW8-RnTv0VAuLc1TEnTZBys-gy_BLc"
          />
          <button 
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-muted bg-muted/50 text-foreground transition-all duration-300 hover:scale-105 shadow-sm" 
            aria-label="Toggle theme"
          >
            <SunMoon className="h-5 w-5" />
          </button>
        </div>

        {/* Login Container */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 z-10 mt-16 lg:mt-0">
          <div className="w-full max-w-[420px]">
            <div className="mb-10 text-left">
              <h2 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">
                Hoş Geldiniz
              </h2>
              <p className="text-muted-foreground text-lg font-normal">
                Hesabınıza erişmek için bilgilerinizi girin.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1" htmlFor="username">
                  Kullanıcı Adı
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors duration-300">
                    <User className="h-5 w-5" />
                  </span>
                  <Input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ad.soyad" 
                    className="w-full pl-12 pr-4 py-4 bg-background border-2 border-muted/60 rounded-xl focus-visible:ring-0 focus-visible:border-blue-500 transition-all duration-300 outline-none text-base h-14 shadow-sm hover:border-muted"
                    id="username"
                    name="username"
                    type="text"
                    disabled={isSubmitting}
                  />
                </div>
                {error && <p className="text-sm text-red-500 font-medium mt-2 animate-in fade-in slide-in-from-top-1 ml-1">{error}</p>}
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl shadow-sm">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-900/80 dark:text-blue-200/80 leading-relaxed font-medium">
                  Windows oturumunuzda kullandığınız standart ağ kullanıcı adınız ile giriş yapabilirsiniz.
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-[#0051d5] hover:from-blue-700 hover:to-blue-800 text-white py-4 h-14 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-300 group mt-6 relative overflow-hidden"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <span className="relative z-10">{isSubmitting ? "Doğrulanıyor..." : "Giriş Yap"}</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5 relative z-10" />
              </Button>
            </form>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-border/50 pt-8">
              <span className="text-sm text-muted-foreground font-medium">Erişim sorunu mu yaşıyorsunuz?</span>
              <a className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 transition-colors px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full" href="#">
                BT Destek Masası
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 mt-auto text-center z-10">
          <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
            © 2026 MLP-CARE Healthcare Portal
          </p>
        </div>
      </div>
    </div>
  )
}
