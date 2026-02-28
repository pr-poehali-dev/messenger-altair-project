import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/49581030-7a29-4f93-b752-d3ca66eb4c3a";

export interface AuthUser {
  id: number;
  phone: string;
  name: string;
  status: string;
  avatar_url: string | null;
  token: string;
}

type Step = "phone" | "code" | "name";

interface Props {
  onAuth: (user: AuthUser) => void;
}

export default function AuthScreen({ onAuth }: Props) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", "", "", ""]);
  const [demoCode, setDemoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "");
    if (!d) return "";
    const n = d.startsWith("7") || d.startsWith("8") ? d.slice(1) : d;
    let res = "+7";
    if (n.length > 0) res += " (" + n.slice(0, 3);
    if (n.length >= 3) res += ") " + n.slice(3, 6);
    if (n.length >= 6) res += "-" + n.slice(6, 8);
    if (n.length >= 8) res += "-" + n.slice(8, 10);
    return res;
  };

  const rawPhone = () => {
    const d = phone.replace(/\D/g, "");
    return "+7" + (d.startsWith("7") ? d.slice(1) : d.startsWith("8") ? d.slice(1) : d);
  };

  const sendOtp = async () => {
    setError("");
    const rp = rawPhone();
    if (rp.length < 12) { setError("Введите корректный номер"); return; }
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone: rp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка отправки");
      setDemoCode(data.demo_code || "");
      setStep("code");
      setCountdown(60);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (idx: number, val: string) => {
    if (val.length > 1) {
      // Вставка всего кода
      const chars = val.slice(0, 8).split("");
      const newCode = [...code];
      chars.forEach((c, i) => { if (i < 8) newCode[i] = c; });
      setCode(newCode);
      codeRefs.current[Math.min(chars.length, 7)]?.focus();
      return;
    }
    const newCode = [...code];
    newCode[idx] = val;
    setCode(newCode);
    if (val && idx < 7) codeRefs.current[idx + 1]?.focus();
  };

  const handleCodeKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    setError("");
    const fullCode = code.join("");
    if (fullCode.length < 8) { setError("Введите полный код"); return; }
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone: rawPhone(), code: fullCode, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Неверный код");
      // Проверим — новый или существующий пользователь
      if (!data.user.name || data.user.name === "Пользователь") {
        setIsNew(true);
        setStep("name");
        // Сохраняем токен временно
        sessionStorage.setItem("_altair_tmp_token", data.token);
        sessionStorage.setItem("_altair_tmp_user", JSON.stringify(data.user));
      } else {
        localStorage.setItem("altair_token", data.token);
        localStorage.setItem("altair_user", JSON.stringify(data.user));
        onAuth({ ...data.user, token: data.token });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const finishName = async () => {
    if (!name.trim()) { setError("Введите имя"); return; }
    const token = sessionStorage.getItem("_altair_tmp_token") || "";
    const tmpUser = JSON.parse(sessionStorage.getItem("_altair_tmp_user") || "{}");
    setLoading(true);
    try {
      const PROFILE_URL = "https://functions.poehali.dev/2440669e-d51d-4e49-ae72-a86f7b5cbfb3";
      const res = await fetch(`${PROFILE_URL}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Token": token },
        body: JSON.stringify({ action: "update", name: name.trim() }),
      });
      const data = await res.json();
      const user = data.user || { ...tmpUser, name: name.trim() };
      localStorage.setItem("altair_token", token);
      localStorage.setItem("altair_user", JSON.stringify(user));
      onAuth({ ...user, token });
    } catch {
      // Даже если профиль не обновился — входим с локальным именем
      const token2 = sessionStorage.getItem("_altair_tmp_token") || "";
      const tmpUser2 = JSON.parse(sessionStorage.getItem("_altair_tmp_user") || "{}");
      localStorage.setItem("altair_token", token2);
      localStorage.setItem("altair_user", JSON.stringify({ ...tmpUser2, name: name.trim() }));
      onAuth({ ...tmpUser2, name: name.trim(), token: token2 });
    } finally {
      setLoading(false);
    }
  };

  const codeStr = code.join("");

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(var(--background))" }}>
      {/* Stars bg */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
            }} />
        ))}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(124,77,255,0.12) 0%, transparent 60%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 80%, rgba(0,229,255,0.08) 0%, transparent 60%)" }} />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl overflow-hidden neon-glow mb-4">
            <img src="https://cdn.poehali.dev/projects/3038e74c-d480-4cc3-be40-1ff50228f433/files/f5a67097-1f13-4b71-bce0-6e1469f91e48.jpg"
              alt="ALTAIR" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-bebas text-4xl text-white tracking-widest">ALTAIR</h1>
          <p className="text-white/40 text-sm mt-1">Мессенджер нового поколения</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(124,77,255,0.25)", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
          <div className="h-1" style={{ background: "linear-gradient(90deg,#7c4dff,#00e5ff,#ff4db8)" }} />

          {/* Phone step */}
          {step === "phone" && (
            <div className="p-7 space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl">Войти или зарегистрироваться</h2>
                <p className="text-white/40 text-sm mt-1">Введите номер — вам придёт код подтверждения</p>
              </div>
              <div>
                <div className="text-xs text-white/40 mb-2 font-medium">Номер телефона</div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-lg">🇷🇺</span>
                  </div>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                    placeholder="+7 (___) ___-__-__"
                    inputMode="tel"
                    autoFocus
                    className="w-full glass rounded-2xl pl-14 pr-4 py-4 text-lg text-white placeholder:text-white/20 outline-none font-medium tracking-wide"
                  />
                </div>
              </div>
              {error && <div className="text-red-400 text-sm flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</div>}
              <button onClick={sendOtp} disabled={loading || phone.replace(/\D/g, "").length < 10}
                className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#7c4dff,#00e5ff)", boxShadow: "0 8px 30px rgba(124,77,255,0.4)" }}>
                {loading ? <Icon name="Loader2" size={20} className="animate-spin" /> : <Icon name="ArrowRight" size={20} />}
                {loading ? "Отправляю код..." : "Получить код"}
              </button>
              <p className="text-white/20 text-xs text-center">Нажимая кнопку, вы принимаете условия использования ALTAIR</p>
            </div>
          )}

          {/* Code step */}
          {step === "code" && (
            <div className="p-7 space-y-5">
              <div className="flex items-center gap-3">
                <button onClick={() => { setStep("phone"); setCode(Array(8).fill("")); setError(""); }}
                  className="w-8 h-8 glass rounded-xl flex items-center justify-center shrink-0">
                  <Icon name="ArrowLeft" size={16} className="text-white/60" />
                </button>
                <div>
                  <h2 className="text-white font-bold text-lg">Введите код</h2>
                  <p className="text-white/40 text-sm">Отправили на {phone}</p>
                </div>
              </div>

              {demoCode && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
                  <Icon name="Info" size={14} className="text-cyan-400 shrink-0" />
                  <span className="text-cyan-300 text-sm">Демо-код: <span className="font-mono font-bold tracking-widest">{demoCode}</span></span>
                </div>
              )}

              <div>
                <div className="text-xs text-white/40 mb-3 font-medium">Код подтверждения (4 цифры + 3 строч. + 1 загл.)</div>
                <div className="flex gap-1.5 justify-center">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => { codeRefs.current[i] = el; }}
                      value={code[i]}
                      onChange={(e) => handleCodeInput(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKey(i, e)}
                      maxLength={8}
                      className={`w-9 h-12 rounded-xl text-center text-base font-bold text-white outline-none transition-all ${
                        code[i] ? "neon-border" : "glass"
                      }`}
                      style={code[i] ? { background: "rgba(124,77,255,0.2)" } : {}}
                    />
                  ))}
                </div>
              </div>

              {error && <div className="text-red-400 text-sm flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</div>}

              <button onClick={verifyOtp} disabled={loading || codeStr.length < 8}
                className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#7c4dff,#00e5ff)", boxShadow: "0 8px 30px rgba(124,77,255,0.4)" }}>
                {loading ? <Icon name="Loader2" size={20} className="animate-spin" /> : <Icon name="Check" size={20} />}
                {loading ? "Проверяю..." : "Войти"}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <span className="text-white/30 text-sm">Повторная отправка через {countdown} сек.</span>
                ) : (
                  <button onClick={sendOtp} className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
                    Отправить код повторно
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Name step (новый пользователь) */}
          {step === "name" && (
            <div className="p-7 space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c4dff,#00e5ff)" }}>
                  <Icon name="User" size={28} className="text-white" />
                </div>
                <h2 className="text-white font-bold text-xl">Как вас зовут?</h2>
                <p className="text-white/40 text-sm mt-1">Это имя будет видно собеседникам</p>
              </div>
              <div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && finishName()}
                  placeholder="Ваше имя"
                  autoFocus
                  className="w-full glass rounded-2xl px-5 py-4 text-lg text-white placeholder:text-white/25 outline-none text-center font-medium"
                />
              </div>
              {error && <div className="text-red-400 text-sm flex items-center gap-2 justify-center"><Icon name="AlertCircle" size={14} />{error}</div>}
              <button onClick={finishName} disabled={loading || !name.trim()}
                className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#7c4dff,#00e5ff)", boxShadow: "0 8px 30px rgba(124,77,255,0.4)" }}>
                {loading ? <Icon name="Loader2" size={20} className="animate-spin" /> : <Icon name="Rocket" size={20} />}
                {loading ? "Входим..." : "Начать общение"}
              </button>
            </div>
          )}
        </div>

        {/* Bottom badges */}
        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          <div className="lock-badge flex items-center gap-1.5"><Icon name="Shield" size={10} />Сквозное шифрование</div>
          <div className="lock-badge flex items-center gap-1.5" style={{ color: "#00e5ff", borderColor: "rgba(0,229,255,0.3)", background: "rgba(0,229,255,0.1)" }}>
            <Icon name="Globe" size={10} />ALTAIR v4.0
          </div>
        </div>
      </div>
    </div>
  );
}
