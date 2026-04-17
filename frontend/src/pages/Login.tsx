import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, User } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate("/panel");
    } catch (err: any) {
      setError(err.message || "Giriş başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sol Panel - Banner */}
      <div className="hidden lg:flex w-1/2 bg-[#1e4ed8] relative overflow-hidden items-center justify-center">
        {/* Arkaplan Deseni */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                <path d="M25 0L50 14.4v28.8L25 57.6 0 43.2V14.4z" fill="none" stroke="#ffffff" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-lg px-12 pb-20">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-10 border border-white/20 backdrop-blur-sm">
            <Shield className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Tesisinizi</h1>
          <h1 className="text-5xl font-bold text-white mb-8 tracking-tight">Akıllıca Yönetin.</h1>
          
          <p className="text-indigo-100/90 text-lg leading-relaxed mb-16">
            SEÇ PORTALI ile tüm tesis envanterinizi, İSG süreçlerinizi ve operasyonel verimliliğinizi tek bir platformdan takip edin.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-blue-600 flex items-center justify-center text-xs text-white">İGU</div>
              <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-blue-600 flex items-center justify-center text-xs text-white">İHM</div>
              <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-blue-600 flex items-center justify-center text-xs text-white">DSP</div>
            </div>
            <p className="text-sm text-indigo-100">Binlerce çalışan şu an güvende.</p>
          </div>
        </div>
      </div>

      {/* Sağ Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-24">
        <div className="w-full max-w-md mx-auto mt-10">
          <div className="mb-10">
            <div className="w-32 h-10 bg-slate-800 flex items-center justify-center text-white font-bold tracking-wider mb-8 text-xl">
              SE<span className="text-blue-500 font-extrabold pl-1">Ç</span>
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Tekrar Hoş Geldiniz</h2>
            <p className="text-slate-500">Hesabınıza erişmek için kullanıcı adınızı girin.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Kullanıcı adınızı giriniz.</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <Input 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ad.soyad" 
                  className="pl-10 py-6 bg-white border-slate-200 text-base"
                />
              </div>
              <p className="text-sm text-slate-600 font-medium">
                Kendi windows oturumunuzda kullanıcı adınızla giriş yapabilirsiniz.
              </p>
              {error && <p className="text-sm text-red-500 font-medium mt-2">{error}</p>}
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-6 text-base bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all font-semibold"
            >
              {isSubmitting ? "Giriş Yapılıyor..." : "Giriş Yap"} <span className="ml-2">→</span>
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            © 2026 SEÇ PORTALI GÜVENLİK YÖNETİM SİSTEMİ
          </p>
        </div>
      </div>
    </div>
  )
}
