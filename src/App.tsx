import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────
type Tab = "chats" | "channels" | "calls" | "notes" | "profile" | "download";

interface Reaction { emoji: string; count: number; mine: boolean; }
interface Message {
  id: number; text: string; time: string; out: boolean;
  translated?: string; reactions?: Reaction[];
}
interface Chat { id: number; name: string; avatar: string; lastMsg: string; time: string; unread?: number; online: boolean; typing?: boolean; }
interface Channel { id: number; name: string; emoji: string; subs: string; lastPost: string; grad: string; }
interface Note { id: number; title: string; text: string; date: string; color: string; }

type CreateType = "channel" | "group" | "bot";
type ChannelTab = "channels" | "groups" | "bots";
interface GroupItem { id: number; name: string; emoji: string; members: string; lastMsg: string; grad: string; }
interface BotItem { id: number; name: string; emoji: string; description: string; active: boolean; grad: string; }

// ─── SBP helpers ─────────────────────────────────────────────
const MONEY_KEYWORDS = ["рубл", "деньг", "перевод", "скинь", "оплат", "долг", "сумм", "₽", "руб", "тысяч", "переведи"];
const isMoney = (text: string) => MONEY_KEYWORDS.some((kw) => text.toLowerCase().includes(kw));

// ─── SBP Transfer Modal ───────────────────────────────────────
function SbpModal({ recipient, onClose }: { recipient: string; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="glass-strong w-full max-w-sm mx-0 sm:mx-4 rounded-t-3xl sm:rounded-3xl overflow-hidden animate-scale-in"
        style={{ border: "1px solid rgba(0,230,118,0.25)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5" style={{ background: "linear-gradient(90deg,#00e676,#00c853)" }} />
        {step === "done" ? (
          <div className="p-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "linear-gradient(135deg,#00e676,#00c853)", boxShadow: "0 0 30px rgba(0,230,118,0.4)" }}>
              <Icon name="Check" size={28} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-xl">Перевод отправлен!</div>
              <div className="text-white/50 text-sm mt-1">{Number(amount).toLocaleString("ru")} ₽ → {recipient}</div>
            </div>
            <div className="text-xs text-white/30">через Систему быстрых платежей</div>
            <button onClick={onClose} className="w-full py-3 rounded-2xl text-white font-semibold text-sm" style={{ background: "linear-gradient(135deg,#00e676,#00c853)" }}>Готово</button>
          </div>
        ) : step === "confirm" ? (
          <div className="p-6 space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep("form")} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
                <Icon name="ArrowLeft" size={16} className="text-white/60" />
              </button>
              <h2 className="text-white font-bold text-lg">Подтверждение</h2>
            </div>
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-white/40">Получатель</span><span className="text-white font-medium">{recipient}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Сумма</span><span className="font-bold text-base" style={{ color: "#00e676" }}>{Number(amount).toLocaleString("ru")} ₽</span></div>
              {comment && <div className="flex justify-between text-sm"><span className="text-white/40">Комментарий</span><span className="text-white/70">{comment}</span></div>}
              <div className="border-t border-white/5 pt-2 flex items-center gap-1.5 text-xs text-green-400"><Icon name="Shield" size={11} />Защищено шифрованием</div>
            </div>
            <button onClick={() => setStep("done")} className="w-full py-3.5 rounded-2xl text-white font-bold text-sm" style={{ background: "linear-gradient(135deg,#00e676,#00c853)" }}>Подтвердить перевод</button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,230,118,0.15)" }}><span className="text-base">⚡</span></div>
                <div><div className="text-white font-bold text-base">Перевод по СБП</div><div className="text-white/40 text-xs">Система быстрых платежей</div></div>
              </div>
              <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center"><Icon name="X" size={15} className="text-white/40" /></button>
            </div>
            <div className="glass rounded-2xl p-3 flex items-center gap-3">
              <Avatar label={recipient.split(" ").map((w) => w[0]).join("").slice(0, 2)} size={40} />
              <div><div className="text-white font-semibold text-sm">{recipient}</div><div className="text-white/40 text-xs">СБП · мгновенно</div></div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-2 font-medium">Сумма перевода</div>
              <div className="relative">
                <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="0" type="text" inputMode="numeric"
                  className="w-full glass rounded-2xl px-5 py-4 text-3xl font-bold text-white placeholder:text-white/20 outline-none text-center pr-10" />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/30">₽</span>
              </div>
              <div className="flex gap-2 mt-2">
                {quickAmounts.map((q) => (
                  <button key={q} onClick={() => setAmount(String(q))} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: amount === String(q) ? "rgba(0,230,118,0.2)" : "rgba(255,255,255,0.05)", border: amount === String(q) ? "1px solid rgba(0,230,118,0.4)" : "1px solid rgba(255,255,255,0.07)", color: amount === String(q) ? "#00e676" : "rgba(255,255,255,0.5)" }}>
                    {q.toLocaleString("ru")} ₽
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1.5 font-medium">Комментарий (необязательно)</div>
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="За что перевод?"
                className="w-full glass rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none" />
            </div>
            <button onClick={() => { if (amount && Number(amount) > 0) setStep("confirm"); }} disabled={!amount || Number(amount) <= 0}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#00e676,#00c853)" }}>
              <Icon name="Zap" size={16} />Перевести по СБП
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Avatar Component ────────────────────────────────────────
function Avatar({ label, size = 40, grad }: { label: string; size?: number; grad?: string }) {
  const grads = [
    "linear-gradient(135deg,#7c4dff,#00e5ff)",
    "linear-gradient(135deg,#ff4db8,#7c4dff)",
    "linear-gradient(135deg,#00e676,#00e5ff)",
    "linear-gradient(135deg,#ff9800,#ff4db8)",
  ];
  const g = grad || grads[label.charCodeAt(0) % grads.length];
  return (
    <div className="flex items-center justify-center font-semibold text-white shrink-0 select-none"
      style={{ width: size, height: size, borderRadius: size * 0.3, background: g, fontSize: size * 0.35 }}>
      {label}
    </div>
  );
}

// ─── New Chat Modal ───────────────────────────────────────────
function NewChatModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, avatar: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    const initials = name.trim().split(" ").map((w) => w[0].toUpperCase()).join("").slice(0, 2);
    onCreate(name.trim(), initials);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="glass-strong rounded-3xl w-full max-w-sm mx-4 overflow-hidden animate-scale-in"
        style={{ border: "1px solid rgba(124,77,255,0.35)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#7c4dff,#00e5ff)" }} />
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Новый чат</h2>
            <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center"><Icon name="X" size={16} className="text-white/50" /></button>
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1.5 font-medium">Имя контакта</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Введите имя" autoFocus
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none" />
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1.5 font-medium">Номер телефона (необязательно)</div>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" type="tel"
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none" />
          </div>
          <button onClick={submit} disabled={!name.trim()}
            className="w-full btn-grad py-3 rounded-2xl text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Icon name="MessageCircle" size={15} />Начать чат
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Call Modal ───────────────────────────────────────────────
function CallModal({ name, avatar, type, onClose }: { name: string; avatar: string; type: "voice" | "video"; onClose: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}>
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative">
          <div className="pulse-ring" style={{ position: "absolute", inset: -12, borderRadius: "40%" }} />
          <Avatar label={avatar} size={100} />
        </div>
        <div className="text-center">
          <div className="text-white font-bold text-2xl">{name}</div>
          <div className="text-white/40 text-sm mt-1">{type === "video" ? "Видеозвонок" : "Голосовой звонок"} · {fmt(seconds)}</div>
        </div>
        {type === "video" && (
          <div className="glass rounded-2xl px-6 py-4 text-center" style={{ width: 240, height: 140, border: "1px solid rgba(124,77,255,0.2)" }}>
            <div className="text-white/20 text-sm mt-8">Камера</div>
          </div>
        )}
        <div className="flex gap-4">
          <button onClick={() => setMuted(!muted)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${muted ? "bg-red-500/30 border border-red-500/50" : "glass"}`}>
            <Icon name={muted ? "MicOff" : "Mic"} size={22} className={muted ? "text-red-400" : "text-white/70"} />
          </button>
          {type === "video" && (
            <button onClick={() => setCamOff(!camOff)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${camOff ? "bg-red-500/30 border border-red-500/50" : "glass"}`}>
              <Icon name={camOff ? "VideoOff" : "Video"} size={22} className={camOff ? "text-red-400" : "text-white/70"} />
            </button>
          )}
          <button onClick={onClose} className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center hover:bg-red-600 transition-all">
            <Icon name="PhoneOff" size={22} className="text-white" />
          </button>
          <button className="w-14 h-14 glass rounded-2xl flex items-center justify-center">
            <Icon name="Volume2" size={22} className="text-white/70" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Attachment Menu ──────────────────────────────────────────
function AttachMenu({ onClose, onFile }: { onClose: () => void; onFile: (name: string, type: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const items = [
    { icon: "Image", label: "Фото", accept: "image/*" },
    { icon: "FileText", label: "Документ", accept: ".pdf,.doc,.docx,.txt" },
    { icon: "Music", label: "Аудио", accept: "audio/*" },
    { icon: "Film", label: "Видео", accept: "video/*" },
  ];

  return (
    <div ref={ref} className="absolute bottom-14 left-0 glass-strong rounded-2xl p-2 space-y-0.5 animate-scale-in z-20"
      style={{ minWidth: 160, border: "1px solid rgba(124,77,255,0.25)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
      {items.map((item) => (
        <label key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
          <Icon name={item.icon} size={16} className="text-violet-400" />
          <span className="text-sm text-white/75">{item.label}</span>
          <input type="file" accept={item.accept} className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { onFile(f.name, item.label); onClose(); }
          }} />
        </label>
      ))}
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────
const REACTION_EMOJIS = ["❤️", "🔥", "😂", "😍", "👍", "👎", "😮", "😢", "🎉", "🙏"];

function ChatsPanel({ chats, activeChat, onSelect, onNew }: { chats: Chat[]; activeChat: number; onSelect: (id: number) => void; onNew: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = chats.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full border-r border-white/5" style={{ width: 300 }}>
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Сообщения</h2>
          <button onClick={onNew} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:neon-border transition-all" title="Новый чат">
            <Icon name="Plus" size={16} className="text-violet-400" />
          </button>
        </div>
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..."
            className="w-full glass rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/80 placeholder:text-white/25 outline-none transition-all" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <div className="text-4xl">💬</div>
            <div className="text-white/40 text-sm font-medium">Чатов пока нет</div>
            <div className="text-white/25 text-xs">Нажмите + чтобы начать диалог</div>
            <button onClick={onNew} className="btn-grad px-4 py-2 rounded-xl text-xs text-white font-medium flex items-center gap-1.5 mt-1">
              <Icon name="Plus" size={12} />Новый чат
            </button>
          </div>
        ) : filtered.map((chat) => (
          <div key={chat.id} onClick={() => onSelect(chat.id)} className={`chat-item ${activeChat === chat.id ? "active" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar label={chat.avatar} size={44} />
                {chat.online && <div className="online-dot absolute -bottom-0.5 -right-0.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/90 truncate">{chat.name}</span>
                  <span className="text-[11px] text-white/30 ml-2 shrink-0">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  {chat.typing ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
                      <span className="text-xs text-violet-400">печатает...</span>
                    </div>
                  ) : <span className="text-xs text-white/35 truncate">{chat.lastMsg}</span>}
                  {chat.unread && (
                    <span className="ml-2 shrink-0 min-w-[20px] h-5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── More Menu ────────────────────────────────────────────────
function MoreMenu({ onClose, onDelete }: { onClose: () => void; onDelete: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full right-0 mt-1 glass-strong rounded-2xl p-1.5 space-y-0.5 animate-scale-in z-30"
      style={{ minWidth: 180, border: "1px solid rgba(124,77,255,0.25)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
      {[
        { icon: "Search", label: "Поиск в чате" },
        { icon: "Bell", label: "Уведомления" },
        { icon: "Star", label: "Избранное" },
        { icon: "Archive", label: "Архив" },
      ].map((item) => (
        <button key={item.label} onClick={onClose} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
          <Icon name={item.icon} size={15} className="text-violet-400" />
          <span className="text-sm text-white/75">{item.label}</span>
        </button>
      ))}
      <div className="border-t border-white/5 my-1" />
      <button onClick={() => { onDelete(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-left">
        <Icon name="Trash2" size={15} className="text-red-400" />
        <span className="text-sm text-red-400">Удалить чат</span>
      </button>
    </div>
  );
}

// ─── Chat Window ─────────────────────────────────────────────
function ChatWindow({ chat, onDelete }: { chat: Chat; onDelete: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [translateAll, setTranslateAll] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<number | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [sbpOpen, setSbpOpen] = useState(false);
  const [callOpen, setCallOpen] = useState<"voice" | "video" | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const close = () => setPickerFor(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, {
      id: Date.now(), text: input,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }), out: true,
    }]);
    setInput("");
  };

  const sendFile = (name: string, type: string) => {
    setMessages((prev) => [...prev, {
      id: Date.now(), text: `📎 ${type}: ${name}`,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }), out: true,
    }]);
  };

  const addReaction = (msgId: number, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages((prev) => prev.map((msg) => {
      if (msg.id !== msgId) return msg;
      const reactions = msg.reactions ?? [];
      const existing = reactions.find((r) => r.emoji === emoji);
      if (existing) {
        return {
          ...msg,
          reactions: existing.mine
            ? reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r).filter((r) => r.count > 0)
            : reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r),
        };
      }
      return { ...msg, reactions: [...reactions, { emoji, count: 1, mine: true }] };
    }));
    setPickerFor(null);
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-mesh">
      {sbpOpen && <SbpModal recipient={chat.name} onClose={() => setSbpOpen(false)} />}
      {callOpen && <CallModal name={chat.name} avatar={chat.avatar} type={callOpen} onClose={() => setCallOpen(null)} />}

      {/* Header */}
      <div className="glass-strong border-b border-white/5 px-5 py-3 flex items-center gap-3 relative">
        <div className="relative">
          <Avatar label={chat.avatar} size={40} />
          {chat.online && <div className="online-dot absolute -bottom-0.5 -right-0.5" />}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white text-sm">{chat.name}</div>
          <div className="text-xs" style={{ color: chat.online ? "#00e676" : "rgba(255,255,255,0.35)" }}>
            {chat.online ? "онлайн" : "был(а) недавно"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="lock-badge flex items-center gap-1"><Icon name="Lock" size={10} />E2E</div>
          <button onClick={() => setTranslateAll(!translateAll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${translateAll ? "bg-violet-500/20 border border-violet-500/40 text-violet-300" : "glass text-white/40"}`}>
            <Icon name="Languages" size={13} />Перевод
          </button>
          <button onClick={() => setCallOpen("video")} className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:neon-glow-cyan transition-all">
            <Icon name="Video" size={17} className="text-cyan-400" />
          </button>
          <button onClick={() => setCallOpen("voice")} className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:neon-glow transition-all">
            <Icon name="Phone" size={17} className="text-violet-400" />
          </button>
          <div className="relative">
            <button onClick={() => setMoreOpen(!moreOpen)} className="w-9 h-9 glass rounded-xl flex items-center justify-center">
              <Icon name="MoreVertical" size={17} className="text-white/40" />
            </button>
            {moreOpen && <MoreMenu onClose={() => setMoreOpen(false)} onDelete={onDelete} />}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Avatar label={chat.avatar} size={64} />
            <div className="text-white font-semibold">{chat.name}</div>
            <div className="text-white/30 text-sm">Начните разговор — напишите первое сообщение</div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {["Привет! 👋", "Как дела?", "Есть минутка?"].map((q) => (
                <button key={q} onClick={() => setInput(q)}
                  className="px-3 py-1.5 glass rounded-full text-xs text-white/60 hover:text-white/80 transition-colors">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id} className={`flex ${msg.out ? "justify-end" : "justify-start"} animate-fade-in`}
            style={{ animationDelay: `${i * 0.03}s` }}
            onMouseEnter={() => setHoveredMsg(msg.id)} onMouseLeave={() => setHoveredMsg(null)}>
            <div style={{ maxWidth: "68%" }} className="relative">
              <div className={`absolute top-1 ${msg.out ? "-left-10" : "-right-10"} transition-all duration-150 ${hoveredMsg === msg.id ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}`}>
                <button onClick={(e) => { e.stopPropagation(); setPickerFor(pickerFor === msg.id ? null : msg.id); }}
                  className="w-8 h-8 glass rounded-xl flex items-center justify-center text-base hover:neon-border transition-all">😊</button>
              </div>
              {pickerFor === msg.id && (
                <div className={`absolute z-50 bottom-full mb-2 ${msg.out ? "right-0" : "left-0"} glass-strong rounded-2xl p-2 flex gap-1 flex-wrap animate-scale-in`}
                  style={{ width: 224, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", border: "1px solid rgba(124,77,255,0.3)" }}
                  onClick={(e) => e.stopPropagation()}>
                  {REACTION_EMOJIS.map((emoji) => (
                    <button key={emoji} onClick={(e) => addReaction(msg.id, emoji, e)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 transition-colors">{emoji}</button>
                  ))}
                </div>
              )}
              <div className={`px-4 py-2.5 text-sm leading-relaxed ${msg.out ? "msg-bubble-out text-white" : "msg-bubble-in text-white/85"}`}>
                {msg.text}
              </div>
              {!msg.out && isMoney(msg.text) && (
                <button onClick={() => setSbpOpen(true)}
                  className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 animate-fade-in"
                  style={{ background: "linear-gradient(135deg,#00e676,#00c853)", boxShadow: "0 4px 16px rgba(0,230,118,0.35)" }}>
                  <Icon name="Zap" size={12} />Перевести по СБП
                </button>
              )}
              {translateAll && msg.translated && (
                <div className="mt-1 px-4 py-2 rounded-xl text-xs text-white/50 italic border border-dashed border-white/10 flex items-start gap-2"
                  style={{ background: "rgba(124,77,255,0.06)" }}>
                  <Icon name="Languages" size={11} className="shrink-0 mt-0.5 text-violet-400" />{msg.translated}
                </div>
              )}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-1.5 ${msg.out ? "justify-end" : "justify-start"}`}>
                  {msg.reactions.map((r) => (
                    <button key={r.emoji} onClick={(e) => addReaction(msg.id, r.emoji, e)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-110 ${r.mine ? "border border-violet-500/60 text-violet-300" : "border border-white/10 text-white/50"}`}
                      style={{ background: r.mine ? "rgba(124,77,255,0.18)" : "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
                      <span>{r.emoji}</span>{r.count > 1 && <span>{r.count}</span>}
                    </button>
                  ))}
                </div>
              )}
              <div className={`text-[10px] text-white/25 mt-1 ${msg.out ? "text-right" : "text-left"}`}>
                {msg.time} {msg.out && <Icon name="CheckCheck" size={11} className="inline text-cyan-400 ml-1" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass-strong border-t border-white/5 p-3">
        <div className="flex items-end gap-2 relative">
          {attachOpen && <AttachMenu onClose={() => setAttachOpen(false)} onFile={sendFile} />}
          <button onClick={() => setAttachOpen(!attachOpen)} className="w-9 h-9 glass rounded-xl flex items-center justify-center shrink-0 hover:neon-border transition-all">
            <Icon name="Paperclip" size={17} className="text-white/40" />
          </button>
          <div className="flex-1 glass rounded-2xl px-4 py-2.5 flex items-end gap-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Написать сообщение..." rows={1}
              className="flex-1 bg-transparent text-sm text-white/85 placeholder:text-white/25 outline-none resize-none leading-relaxed"
              style={{ maxHeight: 120 }} />
            <button><Icon name="Smile" size={18} className="text-white/30 hover:text-yellow-400 transition-colors" /></button>
          </div>
          <button onClick={() => setIsRecording(!isRecording)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${isRecording ? "bg-red-500" : "glass"}`}>
            <Icon name="Mic" size={17} className={isRecording ? "text-white" : "text-white/40"} />
          </button>
          <button onClick={send} className="w-10 h-10 btn-grad rounded-xl flex items-center justify-center shrink-0">
            <Icon name="Send" size={17} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────
const CREATE_META: Record<CreateType, { title: string; icon: string; placeholder: string; descPlaceholder: string; grad: string }> = {
  channel: { title: "Новый канал", icon: "📡", placeholder: "Название канала", descPlaceholder: "О чём этот канал?", grad: "linear-gradient(135deg,#7c4dff,#00e5ff)" },
  group: { title: "Новая группа", icon: "👥", placeholder: "Название группы", descPlaceholder: "Описание группы", grad: "linear-gradient(135deg,#ff4db8,#7c4dff)" },
  bot: { title: "Создать бота", icon: "🤖", placeholder: "Имя бота (латиницей)", descPlaceholder: "Что умеет этот бот?", grad: "linear-gradient(135deg,#00e676,#00e5ff)" },
};
const EMOJI_PRESETS = ["📡", "⭐", "⚡", "🎵", "🎬", "📈", "🔥", "💎", "🚀", "🌍", "👥", "🤖", "🎮", "💬", "🛒"];

function CreateModal({ type, onClose, onCreate }: { type: CreateType; onClose: () => void; onCreate: (item: { name: string; emoji: string; description: string }) => void }) {
  const meta = CREATE_META[type];
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState(meta.icon);
  const [step, setStep] = useState<"form" | "done">("form");

  const handleCreate = () => {
    if (!name.trim()) return;
    setStep("done");
    setTimeout(() => { onCreate({ name: name.trim(), emoji, description: desc.trim() }); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="glass-strong rounded-3xl w-full max-w-md mx-4 overflow-hidden animate-scale-in"
        style={{ border: "1px solid rgba(124,77,255,0.3)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="h-2" style={{ background: meta.grad }} />
        {step === "done" ? (
          <div className="p-8 text-center space-y-4 animate-fade-in">
            <div className="text-5xl">{emoji}</div>
            <div className="text-white font-bold text-lg">{name}</div>
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium">
              <Icon name="CheckCircle" size={18} />
              {type === "channel" ? "Канал создан!" : type === "group" ? "Группа создана!" : "Бот создан!"}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">{meta.title}</h2>
              <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center"><Icon name="X" size={16} className="text-white/50" /></button>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-2 font-medium">Иконка</div>
              <div className="flex flex-wrap gap-2">
                {EMOJI_PRESETS.map((e) => (
                  <button key={e} onClick={() => setEmoji(e)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110 ${emoji === e ? "neon-border scale-110" : "glass"}`}
                    style={emoji === e ? { background: "rgba(124,77,255,0.2)" } : {}}>{e}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: meta.grad }}>{emoji}</div>
              <div>
                <div className="text-white font-semibold text-sm">{name || meta.placeholder}</div>
                <div className="text-white/30 text-xs mt-0.5">{type === "channel" ? "0 подписчиков" : type === "group" ? "0 участников" : "Бот · не активен"}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1.5 font-medium">{type === "bot" ? "Имя бота" : "Название"}</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={meta.placeholder} autoFocus
                className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none" />
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1.5 font-medium">Описание</div>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={meta.descPlaceholder} rows={2}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none resize-none leading-relaxed" />
            </div>
            {type === "bot" && (
              <div className="rounded-xl p-3 flex items-start gap-2 text-xs" style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)" }}>
                <Icon name="Info" size={13} className="text-green-400 shrink-0 mt-0.5" />
                <span className="text-green-400/80">После создания вы получите API-токен для подключения бота</span>
              </div>
            )}
            <button onClick={handleCreate} disabled={!name.trim()}
              className="w-full btn-grad py-3 rounded-2xl text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              {type === "channel" ? "Создать канал" : type === "group" ? "Создать группу" : "Создать бота"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Channels View ────────────────────────────────────────────
function ChannelsView() {
  const [tab, setTab] = useState<ChannelTab>("channels");
  const [active, setActive] = useState<number | null>(null);
  const [modal, setModal] = useState<CreateType | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [bots, setBots] = useState<BotItem[]>([]);

  const tabs: { id: ChannelTab; label: string; icon: string }[] = [
    { id: "channels", label: "Каналы", icon: "Radio" },
    { id: "groups", label: "Группы", icon: "Users" },
    { id: "bots", label: "Боты", icon: "Bot" },
  ];

  const handleCreate = (item: { name: string; emoji: string; description: string }) => {
    const grad = modal === "channel" ? "linear-gradient(135deg,#7c4dff,#00e5ff)" : modal === "group" ? "linear-gradient(135deg,#ff4db8,#7c4dff)" : "linear-gradient(135deg,#00e676,#00e5ff)";
    if (modal === "channel") { setChannels((prev) => [{ id: Date.now(), name: item.name, emoji: item.emoji, subs: "0", lastPost: item.description || "Только создан", grad }, ...prev]); setTab("channels"); }
    else if (modal === "group") { setGroups((prev) => [{ id: Date.now(), name: item.name, emoji: item.emoji, members: "1", lastMsg: item.description || "Группа создана", grad }, ...prev]); setTab("groups"); }
    else if (modal === "bot") { setBots((prev) => [{ id: Date.now(), name: item.name, emoji: item.emoji, description: item.description || "Новый бот", active: false, grad }, ...prev]); setTab("bots"); }
  };

  const createType: CreateType = tab === "groups" ? "group" : tab === "bots" ? "bot" : "channel";
  const emptyLabels: Record<ChannelTab, { icon: string; title: string; sub: string; btn: string }> = {
    channels: { icon: "📡", title: "Каналов пока нет", sub: "Создайте свой канал и делитесь контентом", btn: "Создать канал" },
    groups: { icon: "👥", title: "Групп пока нет", sub: "Создайте группу для общения с командой", btn: "Создать группу" },
    bots: { icon: "🤖", title: "Ботов пока нет", sub: "Создайте бота для автоматизации", btn: "Создать бота" },
  };
  const el = emptyLabels[tab];

  const renderList = () => {
    if (tab === "channels") {
      if (!channels.length) return null;
      return channels.map((ch) => (
        <div key={ch.id} onClick={() => setActive(ch.id)} className={`chat-item cursor-pointer ${active === ch.id ? "active" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: ch.grad }}>{ch.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white/90 truncate">{ch.name}</div>
              <div className="text-xs text-white/35 truncate mt-0.5">{ch.lastPost}</div>
            </div>
            <div className="text-[10px] text-white/25 shrink-0">{ch.subs}</div>
          </div>
        </div>
      ));
    }
    if (tab === "groups") {
      if (!groups.length) return null;
      return groups.map((g) => (
        <div key={g.id} onClick={() => setActive(g.id)} className={`chat-item cursor-pointer ${active === g.id ? "active" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: g.grad }}>{g.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white/90 truncate">{g.name}</div>
              <div className="text-xs text-white/35 truncate mt-0.5">{g.lastMsg}</div>
            </div>
            <div className="text-[10px] text-white/25 shrink-0">{g.members} уч.</div>
          </div>
        </div>
      ));
    }
    if (!bots.length) return null;
    return bots.map((b) => (
      <div key={b.id} onClick={() => setActive(b.id)} className={`chat-item cursor-pointer ${active === b.id ? "active" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: b.grad }}>{b.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white/90 truncate">{b.name}</div>
            <div className="text-xs text-white/35 truncate mt-0.5">{b.description}</div>
          </div>
          <div className={`w-2 h-2 rounded-full ${b.active ? "bg-green-400" : "bg-white/20"}`} />
        </div>
      </div>
    ));
  };

  const hasItems = tab === "channels" ? channels.length > 0 : tab === "groups" ? groups.length > 0 : bots.length > 0;

  return (
    <div className="flex-1 flex h-full">
      {modal && <CreateModal type={modal} onClose={() => setModal(null)} onCreate={handleCreate} />}
      <div className="flex flex-col h-full border-r border-white/5" style={{ width: 300 }}>
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Каналы</h2>
            <button onClick={() => setModal(createType)} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:neon-border transition-all">
              <Icon name="Plus" size={16} className="text-violet-400" />
            </button>
          </div>
          <div className="flex gap-1 glass rounded-2xl p-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => { setTab(t.id); setActive(null); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t.id ? "btn-grad text-white" : "text-white/35 hover:text-white/60"}`}>
                <Icon name={t.icon} size={12} />{t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {!hasItems ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
              <div className="text-4xl">{el.icon}</div>
              <div className="text-white/40 text-sm font-medium">{el.title}</div>
              <div className="text-white/25 text-xs">{el.sub}</div>
              <button onClick={() => setModal(createType)} className="btn-grad px-4 py-2 rounded-xl text-xs text-white font-medium flex items-center gap-1.5 mt-1">
                <Icon name="Plus" size={12} />{el.btn}
              </button>
            </div>
          ) : renderList()}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-mesh">
        {active ? (
          <div className="text-center space-y-3">
            <div className="text-5xl">{tab === "channels" ? channels.find((c) => c.id === active)?.emoji : tab === "groups" ? groups.find((g) => g.id === active)?.emoji : bots.find((b) => b.id === active)?.emoji}</div>
            <div className="text-white font-semibold">{tab === "channels" ? channels.find((c) => c.id === active)?.name : tab === "groups" ? groups.find((g) => g.id === active)?.name : bots.find((b) => b.id === active)?.name}</div>
            <div className="text-white/30 text-sm">{tab === "channels" ? "Канал" : tab === "groups" ? "Группа" : "Бот"}</div>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="text-5xl">{el.icon}</div>
            <div className="text-white/50 font-semibold">{hasItems ? `Выберите ${tab === "channels" ? "канал" : tab === "groups" ? "группу" : "бота"}` : el.title}</div>
            {!hasItems && <button onClick={() => setModal(createType)} className="btn-grad px-5 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2 mx-auto"><Icon name="Plus" size={14} />{el.btn}</button>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calls View ───────────────────────────────────────────────
function CallsView() {
  const [callOpen, setCallOpen] = useState<{ name: string; avatar: string; type: "voice" | "video" } | null>(null);
  const [newCallOpen, setNewCallOpen] = useState(false);
  const [callLogs, setCallLogs] = useState<{ id: number; name: string; avatar: string; type: "voice" | "video"; time: string; duration: string; out: boolean }[]>([]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {callOpen && <CallModal name={callOpen.name} avatar={callOpen.avatar} type={callOpen.type} onClose={() => setCallOpen(null)} />}
      {newCallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} onClick={() => setNewCallOpen(false)}>
          <div className="glass-strong rounded-3xl w-full max-w-sm mx-4 p-6 space-y-4 animate-scale-in"
            style={{ border: "1px solid rgba(124,77,255,0.35)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Новый звонок</h2>
              <button onClick={() => setNewCallOpen(false)} className="w-8 h-8 glass rounded-xl flex items-center justify-center"><Icon name="X" size={16} className="text-white/50" /></button>
            </div>
            <input placeholder="Введите имя или номер" autoFocus
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setNewCallOpen(false); setCallOpen({ name: "Новый контакт", avatar: "НК", type: "voice" }); }}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white" style={{ background: "linear-gradient(135deg,#7c4dff,#00e5ff)" }}>
                <Icon name="Phone" size={16} />Голосовой
              </button>
              <button onClick={() => { setNewCallOpen(false); setCallOpen({ name: "Новый контакт", avatar: "НК", type: "video" }); }}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white" style={{ background: "linear-gradient(135deg,#ff4db8,#7c4dff)" }}>
                <Icon name="Video" size={16} />Видео
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="glass-strong border-b border-white/5 px-5 py-3 flex items-center gap-3">
        <h2 className="text-lg font-bold text-white flex-1">Звонки</h2>
        <button onClick={() => setNewCallOpen(true)} className="btn-grad px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white">
          <Icon name="Phone" size={15} />Новый звонок
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center bg-mesh">
        {callLogs.length === 0 ? (
          <div className="text-center space-y-4">
            <div className="text-6xl">📞</div>
            <div className="text-white font-semibold text-lg">Нет истории звонков</div>
            <div className="text-white/35 text-sm">Нажмите «Новый звонок» чтобы позвонить</div>
            <button onClick={() => setNewCallOpen(true)} className="btn-grad px-6 py-3 rounded-2xl text-white font-semibold flex items-center gap-2 mx-auto">
              <Icon name="Phone" size={16} />Позвонить
            </button>
          </div>
        ) : (
          <div className="w-full max-w-lg px-4 space-y-1">
            {callLogs.map((call) => (
              <div key={call.id} className="chat-item flex items-center gap-3">
                <Avatar label={call.avatar} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white/90">{call.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Icon name={call.type === "video" ? "Video" : "Phone"} size={12} className={call.out ? "text-violet-400" : "text-green-400"} />
                    <span className="text-xs text-white/35">{call.time} · {call.duration}</span>
                  </div>
                </div>
                <button onClick={() => setCallOpen({ name: call.name, avatar: call.avatar, type: call.type })}
                  className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:neon-glow transition-all">
                  <Icon name={call.type === "video" ? "Video" : "Phone"} size={16} className="text-violet-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notes View ───────────────────────────────────────────────
function NotesView() {
  const [active, setActive] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editText, setEditText] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const openNote = (note: Note) => { setActive(note); setEditText(note.text); setEditTitle(note.title); };
  const COLORS = ["#7c4dff", "#00e5ff", "#ff4db8", "#00e676", "#ff9800"];

  const createNote = () => {
    const n: Note = { id: Date.now(), title: "Новая заметка", text: "", date: "сейчас", color: COLORS[Math.floor(Math.random() * COLORS.length)] };
    setNotes((prev) => [n, ...prev]);
    openNote(n);
  };

  const deleteNote = () => {
    if (!active) return;
    setNotes((prev) => prev.filter((n) => n.id !== active.id));
    setActive(null);
  };

  const saveNote = () => {
    if (!active) return;
    setNotes((prev) => prev.map((n) => n.id === active.id ? { ...n, title: editTitle, text: editText } : n));
    setActive((prev) => prev ? { ...prev, title: editTitle, text: editText } : null);
  };

  return (
    <div className="flex-1 flex h-full">
      <div className="flex flex-col h-full border-r border-white/5" style={{ width: 300 }}>
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Заметки</h2>
            <button onClick={createNote} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:neon-border transition-all">
              <Icon name="Plus" size={16} className="text-violet-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
              <div className="text-4xl">📝</div>
              <div className="text-white/40 text-sm font-medium">Заметок пока нет</div>
              <div className="text-white/25 text-xs">Нажмите + чтобы создать первую</div>
              <button onClick={createNote} className="btn-grad px-4 py-2 rounded-xl text-xs text-white font-medium flex items-center gap-1.5 mt-1">
                <Icon name="Plus" size={12} />Создать заметку
              </button>
            </div>
          ) : notes.map((note) => (
            <div key={note.id} onClick={() => openNote(note)} className={`chat-item ${active?.id === note.id ? "active" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: note.color, boxShadow: `0 0 8px ${note.color}` }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white/90 truncate">{note.title}</div>
                  <div className="text-xs text-white/35 truncate mt-0.5">{note.text || "Пустая заметка"}</div>
                  <div className="text-[10px] text-white/20 mt-1">{note.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-mesh">
        {active ? (
          <>
            <div className="glass-strong border-b border-white/5 px-5 py-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: active.color, boxShadow: `0 0 10px ${active.color}` }} />
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={saveNote}
                className="flex-1 bg-transparent text-white font-semibold outline-none text-sm" />
              <div className="lock-badge flex items-center gap-1"><Icon name="Lock" size={10} />Зашифровано</div>
              <button onClick={deleteNote} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:bg-red-500/10 transition-colors">
                <Icon name="Trash2" size={15} className="text-red-400" />
              </button>
            </div>
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={saveNote}
              className="flex-1 bg-transparent text-white/75 text-sm p-5 outline-none resize-none leading-relaxed"
              placeholder="Начните писать..." />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-5xl">📝</div>
              <div className="text-white/50 font-semibold">Выберите заметку</div>
              <div className="text-white/25 text-sm">Или создайте новую</div>
              <button onClick={createNote} className="btn-grad px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 mx-auto">
                <Icon name="Plus" size={14} />Новая заметка
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Download View ────────────────────────────────────────────
function DownloadView() {
  const [copied, setCopied] = useState(false);
  const link = "https://altair.app/download";

  const copyLink = () => {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const platforms = [
    { icon: "🍎", name: "iOS", sub: "App Store", badge: "Скачать", color: "linear-gradient(135deg,#7c4dff,#00e5ff)" },
    { icon: "🤖", name: "Android", sub: "Google Play", badge: "Скачать", color: "linear-gradient(135deg,#00e676,#00c853)" },
    { icon: "🪟", name: "Windows", sub: "64-bit / ARM", badge: "Скачать .exe", color: "linear-gradient(135deg,#00bcd4,#7c4dff)" },
    { icon: "🍏", name: "macOS", sub: "Intel / Apple Silicon", badge: "Скачать .dmg", color: "linear-gradient(135deg,#ff9800,#ff4db8)" },
    { icon: "🐧", name: "Linux", sub: "AppImage / deb", badge: "Скачать", color: "linear-gradient(135deg,#ff4db8,#7c4dff)" },
  ];

  const features = [
    { icon: "Shield", text: "Сквозное шифрование E2E" },
    { icon: "Zap", text: "Переводы по СБП" },
    { icon: "Languages", text: "Перевод в реальном времени" },
    { icon: "Video", text: "HD видеозвонки" },
    { icon: "StickyNote", text: "Зашифрованные заметки" },
    { icon: "Radio", text: "Каналы и группы" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-mesh">
      {/* Hero */}
      <div className="relative px-8 pt-16 pb-10 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(circle at 50% 0%, #7c4dff 0%, transparent 70%)" }} />
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl overflow-hidden mx-auto mb-5 neon-glow">
            <img src="https://cdn.poehali.dev/projects/3038e74c-d480-4cc3-be40-1ff50228f433/files/f5a67097-1f13-4b71-bce0-6e1469f91e48.jpg" alt="ALTAIR" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-bebas text-5xl text-white tracking-widest mb-2">ALTAIR</h1>
          <p className="text-white/50 text-base mb-1">Мессенджер нового поколения</p>
          <p className="text-white/30 text-sm">Версия 4.0 · 50 МБ · Бесплатно</p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <div className="lock-badge flex items-center gap-1.5"><Icon name="ShieldCheck" size={11} />Сквозное шифрование</div>
            <div className="lock-badge flex items-center gap-1.5" style={{ color: "#00e5ff", borderColor: "rgba(0,229,255,0.3)", background: "rgba(0,229,255,0.1)" }}>
              <Icon name="Star" size={11} />4.9 · 2М+ отзывов
            </div>
          </div>
        </div>
      </div>

      {/* Platform buttons */}
      <div className="px-6 pb-6">
        <div className="text-xs text-white/40 font-medium mb-3 uppercase tracking-wider">Выберите платформу</div>
        <div className="space-y-3">
          {platforms.map((p) => (
            <button key={p.name}
              onClick={() => alert(`Скачивание для ${p.name} начнётся автоматически.\n\nALTAIR ${p.name} — ${p.sub}`)}
              className="w-full glass rounded-2xl px-4 py-4 flex items-center gap-4 hover:neon-border transition-all group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: p.color }}>{p.icon}</div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold">{p.name}</div>
                <div className="text-white/35 text-xs mt-0.5">{p.sub}</div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shrink-0 group-hover:scale-105 transition-transform"
                style={{ background: p.color }}>
                <Icon name="Download" size={13} />
                {p.badge}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* QR & link */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-4 text-center space-y-3">
          <div className="w-24 h-24 mx-auto rounded-xl flex items-center justify-center" style={{ background: "rgba(124,77,255,0.1)", border: "1px solid rgba(124,77,255,0.2)" }}>
            <div className="grid grid-cols-5 gap-0.5">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ background: [0, 1, 2, 3, 5, 9, 10, 14, 15, 19, 21, 22, 23, 24, 7, 11, 12, 13].includes(i) ? "#7c4dff" : "transparent" }} />
              ))}
            </div>
          </div>
          <div className="text-xs text-white/40">Сканируйте QR-код</div>
        </div>
        <div className="glass rounded-2xl p-4 space-y-3 flex flex-col justify-between">
          <div>
            <div className="text-xs text-white/40 mb-1 font-medium">Прямая ссылка</div>
            <div className="text-xs text-violet-300 font-mono break-all">{link}</div>
          </div>
          <button onClick={copyLink} className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${copied ? "bg-green-500/20 text-green-400 border border-green-500/30" : "btn-grad text-white"}`}>
            <Icon name={copied ? "Check" : "Copy"} size={13} />
            {copied ? "Скопировано!" : "Копировать ссылку"}
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-10">
        <div className="text-xs text-white/40 font-medium mb-3 uppercase tracking-wider">Что входит</div>
        <div className="grid grid-cols-2 gap-2">
          {features.map((f) => (
            <div key={f.text} className="glass rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <Icon name={f.icon} size={15} className="text-violet-400 shrink-0" />
              <span className="text-xs text-white/65">{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Transfer Tab ──────────────────────────────────────
function ProfileTransfer() {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [step, setStep] = useState<"form" | "done">("form");
  const quickAmounts = [500, 1000, 2000, 5000, 10000, 25000];

  if (step === "done") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-mesh animate-fade-in">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#00e676,#00c853)", boxShadow: "0 0 40px rgba(0,230,118,0.4)" }}>
          <Icon name="Check" size={36} className="text-white" />
        </div>
        <div className="text-center">
          <div className="text-white font-bold text-2xl">Готово!</div>
          <div className="text-white/50 text-sm mt-1">{Number(amount).toLocaleString("ru")} ₽ отправлено по СБП</div>
        </div>
        <button onClick={() => { setStep("form"); setAmount(""); setPhone(""); setComment(""); }}
          className="px-6 py-3 rounded-2xl text-white font-semibold" style={{ background: "linear-gradient(135deg,#00e676,#00c853)" }}>
          Новый перевод
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-mesh">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#00e676,#00c853)", boxShadow: "0 4px 16px rgba(0,230,118,0.3)" }}>
          <Icon name="Zap" size={18} className="text-white" />
        </div>
        <div><div className="text-white font-bold text-lg">Перевод по СБП</div><div className="text-white/40 text-xs">Система быстрых платежей · мгновенно</div></div>
      </div>
      <div>
        <div className="text-xs text-white/40 mb-1.5 font-medium">Номер телефона</div>
        <div className="relative">
          <Icon name="Phone" size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__"
            className="w-full glass rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-white/25 outline-none" />
        </div>
      </div>
      <div>
        <div className="text-xs text-white/40 mb-1.5 font-medium">Сумма</div>
        <div className="relative">
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="0" type="text" inputMode="numeric"
            className="w-full glass rounded-2xl px-5 py-4 text-4xl font-bold text-white placeholder:text-white/15 outline-none text-center pr-12" />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-white/25">₽</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {quickAmounts.map((q) => (
            <button key={q} onClick={() => setAmount(String(q))} className="py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{ background: amount === String(q) ? "rgba(0,230,118,0.2)" : "rgba(255,255,255,0.05)", border: amount === String(q) ? "1px solid rgba(0,230,118,0.4)" : "1px solid rgba(255,255,255,0.07)", color: amount === String(q) ? "#00e676" : "rgba(255,255,255,0.5)" }}>
              {q.toLocaleString("ru")} ₽
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-white/40 mb-1.5 font-medium">Комментарий</div>
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="За что перевод?"
          className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none" />
      </div>
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(0,230,118,0.07)", border: "1px solid rgba(0,230,118,0.15)" }}>
        <Icon name="ShieldCheck" size={14} className="text-green-400 shrink-0 mt-0.5" />
        <span className="text-xs text-green-400/70">Переводы защищены шифрованием. Максимум 100 000 ₽ за раз.</span>
      </div>
      <button onClick={() => { if (amount && phone) setStep("done"); }} disabled={!amount || !phone || Number(amount) <= 0}
        className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg,#00e676,#00c853)", boxShadow: amount && phone ? "0 8px 30px rgba(0,230,118,0.35)" : "none" }}>
        <Icon name="Zap" size={18} />
        Перевести {amount ? `${Number(amount).toLocaleString("ru")} ₽` : "по СБП"}
      </button>
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────
type ProfileTab = "settings" | "transfer";

function ProfileView({ onDownload }: { onDownload: () => void }) {
  const [profileTab, setProfileTab] = useState<ProfileTab>("settings");
  const [name, setName] = useState("Ваше имя");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("Ваше имя");
  const [status, setStatus] = useState("Привет! Я использую ALTAIR 👋");
  const [editingStatus, setEditingStatus] = useState(false);
  const [notif, setNotif] = useState(true);
  const [theme, setTheme] = useState("ALTAIR Dark");

  const initials = name.split(" ").map((w) => w[0]?.toUpperCase() || "").join("").slice(0, 2) || "ВЫ";

  return (
    <div className="flex-1 flex flex-col h-full bg-mesh overflow-hidden">
      <div className="relative px-8 pt-8 pb-5 flex flex-col items-center shrink-0">
        <div className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(180deg,rgba(124,77,255,0.5) 0%, transparent 100%)" }} />
        <div className="relative">
          <label className="cursor-pointer group">
            <Avatar label={initials} size={80} />
            <div className="absolute inset-0 rounded-[24px] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Icon name="Camera" size={18} className="text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" />
          </label>
          <div className="online-dot absolute -bottom-0.5 -right-0.5" style={{ width: 14, height: 14 }} />
        </div>
        {editingName ? (
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} autoFocus
            onBlur={() => { setName(nameInput || "Ваше имя"); setEditingName(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { setName(nameInput || "Ваше имя"); setEditingName(false); } }}
            className="mt-3 bg-transparent text-xl font-bold text-white outline-none text-center border-b border-violet-500 pb-0.5" />
        ) : (
          <h1 className="text-xl font-bold text-white mt-3 cursor-pointer hover:text-white/80 transition-colors" onClick={() => setEditingName(true)}>{name}</h1>
        )}
        {editingStatus ? (
          <input value={status} onChange={(e) => setStatus(e.target.value)} autoFocus onBlur={() => setEditingStatus(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setEditingStatus(false); }}
            className="text-xs mt-1 bg-transparent text-white/40 outline-none text-center border-b border-violet-500/50 pb-0.5 w-full max-w-xs" />
        ) : (
          <p className="text-white/40 text-xs mt-0.5 cursor-pointer hover:text-white/60 transition-colors" onClick={() => setEditingStatus(true)}>{status}</p>
        )}
        <div className="lock-badge mt-2 flex items-center gap-1.5"><Icon name="ShieldCheck" size={10} />Сквозное шифрование активно</div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-5 mb-3 shrink-0">
        {[{ label: "Чатов", value: "0" }, { label: "Переводов", value: "0" }].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <div className="text-xl font-bold grad-text">{s.value}</div>
            <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="px-5 mb-1 shrink-0">
        <div className="flex gap-1 glass rounded-2xl p-1">
          {([["settings", "Settings", "Настройки"], ["transfer", "Zap", "Перевести"]] as const).map(([id, icon, label]) => (
            <button key={id} onClick={() => setProfileTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${profileTab === id ? "text-white" : "text-white/35 hover:text-white/60"}`}
              style={profileTab === id ? id === "transfer" ? { background: "linear-gradient(135deg,rgba(0,230,118,0.4),rgba(0,200,83,0.2))", boxShadow: "0 2px 12px rgba(0,230,118,0.25)" } : { background: "linear-gradient(135deg,rgba(124,77,255,0.5),rgba(0,229,255,0.2))", boxShadow: "0 2px 12px rgba(124,77,255,0.3)" } : {}}>
              <Icon name={icon} size={13} />{label}
            </button>
          ))}
        </div>
      </div>

      {profileTab === "settings" ? (
        <div className="flex-1 overflow-y-auto px-5 space-y-2 pb-6 pt-2">
          {/* Уведомления */}
          <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,77,255,0.15)" }}>
              <Icon name="Bell" size={16} className="text-violet-400" />
            </div>
            <span className="text-sm text-white/80 flex-1">Уведомления</span>
            <button onClick={() => setNotif(!notif)} className={`w-11 h-6 rounded-full transition-all relative ${notif ? "" : "bg-white/10"}`}
              style={notif ? { background: "linear-gradient(90deg,#7c4dff,#00e5ff)" } : {}}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notif ? "right-1" : "left-1"}`} />
            </button>
          </div>
          {/* Скачать приложение */}
          <button onClick={onDownload} className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:neon-border transition-all">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,229,255,0.12)" }}>
              <Icon name="Download" size={16} className="text-cyan-400" />
            </div>
            <span className="text-sm text-white/80 flex-1">Скачать ALTAIR</span>
            <span className="text-xs text-white/30">iOS / Android</span>
            <Icon name="ChevronRight" size={14} className="text-white/20" />
          </button>
          {/* Тема */}
          <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,77,255,0.15)" }}>
              <Icon name="Palette" size={16} className="text-violet-400" />
            </div>
            <span className="text-sm text-white/80 flex-1">Тема</span>
            <div className="flex gap-1">
              {["ALTAIR Dark", "Midnight", "Cosmos"].map((t) => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`text-xs px-2 py-1 rounded-lg transition-all ${theme === t ? "text-violet-300" : "text-white/25 hover:text-white/50"}`}
                  style={theme === t ? { background: "rgba(124,77,255,0.2)", border: "1px solid rgba(124,77,255,0.3)" } : {}}>
                  {t.split(" ")[1] || t}
                </button>
              ))}
            </div>
          </div>
          {[
            { icon: "Shield", label: "Приватность", val: "Максимум" },
            { icon: "Languages", label: "Язык перевода", val: "RU ↔ EN" },
            { icon: "Music", label: "ALTAIR Music", val: "Подключено" },
          ].map((item) => (
            <div key={item.label} className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:neon-border transition-all">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,77,255,0.15)" }}>
                <Icon name={item.icon} size={16} className="text-violet-400" />
              </div>
              <span className="text-sm text-white/80 flex-1">{item.label}</span>
              <span className="text-xs text-white/30">{item.val}</span>
              <Icon name="ChevronRight" size={14} className="text-white/20" />
            </div>
          ))}
          <button className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-red-500/5 transition-colors">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
              <Icon name="LogOut" size={16} className="text-red-400" />
            </div>
            <span className="text-sm text-red-400/80 flex-1">Выйти</span>
          </button>
        </div>
      ) : <ProfileTransfer />}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyChat({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-mesh">
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl overflow-hidden mx-auto neon-glow">
          <img src="https://cdn.poehali.dev/projects/3038e74c-d480-4cc3-be40-1ff50228f433/files/f5a67097-1f13-4b71-bce0-6e1469f91e48.jpg" alt="ALTAIR" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="font-bebas tracking-widest text-3xl text-white">ALTAIR</h2>
          <p className="text-white/35 text-sm mt-1">Выберите чат или начните новый</p>
        </div>
        <button onClick={onNew} className="btn-grad px-6 py-3 rounded-2xl text-white font-semibold flex items-center gap-2 mx-auto">
          <Icon name="Plus" size={16} />Новый чат
        </button>
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <div className="lock-badge flex items-center gap-1.5"><Icon name="Lock" size={10} />Сквозное шифрование</div>
          <div className="lock-badge flex items-center gap-1.5" style={{ color: "#00e5ff", borderColor: "rgba(0,229,255,0.3)", background: "rgba(0,229,255,0.1)" }}>
            <Icon name="Languages" size={10} />Перевод в реальном времени
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; icon: string; label: string }[] = [
    { id: "chats", icon: "MessageCircle", label: "Чаты" },
    { id: "channels", icon: "Radio", label: "Каналы" },
    { id: "calls", icon: "Phone", label: "Звонки" },
    { id: "notes", icon: "StickyNote", label: "Заметки" },
    { id: "download", icon: "Download", label: "Скачать" },
  ];

  return (
    <div className="flex flex-col items-center glass h-full py-4 gap-1 border-r border-white/5" style={{ width: 72 }}>
      <div className="mb-4 flex flex-col items-center gap-1">
        <div className="flex items-center justify-center rounded-2xl overflow-hidden neon-glow" style={{ width: 44, height: 44 }}>
          <img src="https://cdn.poehali.dev/projects/3038e74c-d480-4cc3-be40-1ff50228f433/files/f5a67097-1f13-4b71-bce0-6e1469f91e48.jpg" alt="ALTAIR" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-1 w-full px-2">
        {items.map((item) => (
          <button key={item.id} onClick={() => onChange(item.id)}
            className={`sidebar-item flex flex-col items-center gap-1 w-full ${active === item.id ? "active" : ""}`}>
            <Icon name={item.icon} size={22} className={active === item.id ? "text-violet-400" : "text-white/40"} />
            <span className="text-[10px] font-medium" style={{ color: active === item.id ? "#a78bfa" : "rgba(255,255,255,0.4)" }}>{item.label}</span>
          </button>
        ))}
      </div>
      <button onClick={() => onChange("profile")} className={`sidebar-item w-full flex flex-col items-center gap-1 ${active === "profile" ? "active" : ""}`}>
        <div className="relative">
          <Avatar label="ВЫ" size={32} />
          <div className="online-dot absolute -bottom-0.5 -right-0.5" />
        </div>
      </button>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const createChat = (name: string, avatar: string) => {
    const id = Date.now();
    const newChat: Chat = { id, name, avatar, lastMsg: "Чат создан", time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }), online: false };
    setChats((prev) => [newChat, ...prev]);
    setTab("chats");
    setActiveChat(id);
  };

  const deleteChat = (id: number) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    setActiveChat(null);
  };

  const currentChat = chats.find((c) => c.id === activeChat);

  const renderMain = () => {
    if (tab === "chats") {
      return (
        <>
          {newChatOpen && <NewChatModal onClose={() => setNewChatOpen(false)} onCreate={createChat} />}
          <ChatsPanel chats={chats} activeChat={activeChat ?? -1} onSelect={setActiveChat} onNew={() => setNewChatOpen(true)} />
          {currentChat ? <ChatWindow chat={currentChat} onDelete={() => deleteChat(currentChat.id)} /> : <EmptyChat onNew={() => setNewChatOpen(true)} />}
        </>
      );
    }
    if (tab === "channels") return <ChannelsView />;
    if (tab === "calls") return <CallsView />;
    if (tab === "notes") return <NotesView />;
    if (tab === "download") return <DownloadView />;
    if (tab === "profile") return <div className="flex-1 flex h-full"><ProfileView onDownload={() => setTab("download")} /></div>;
    return null;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      <Sidebar active={tab} onChange={(t) => { setTab(t); if (t !== "chats") setActiveChat(null); }} />
      <div className="flex flex-1 overflow-hidden animate-fade-in" key={tab}>
        {renderMain()}
      </div>
    </div>
  );
}