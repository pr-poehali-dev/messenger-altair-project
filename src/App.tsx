import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────
type Tab = "chats" | "channels" | "calls" | "notes" | "profile";

interface Reaction {
  emoji: string;
  count: number;
  mine: boolean;
}

interface Message {
  id: number;
  text: string;
  time: string;
  out: boolean;
  translated?: string;
  showTranslation?: boolean;
  reactions?: Reaction[];
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread?: number;
  online: boolean;
  typing?: boolean;
}

interface Channel {
  id: number;
  name: string;
  emoji: string;
  subs: string;
  lastPost: string;
  grad: string;
}

interface Note {
  id: number;
  title: string;
  text: string;
  date: string;
  color: string;
}

// ─── Mock Data ───────────────────────────────────────────────
const CHATS: Chat[] = [
  { id: 1, name: "Алекс Романов", avatar: "АР", lastMsg: "Отлично, увидимся завтра!", time: "14:32", unread: 2, online: true, typing: false },
  { id: 2, name: "Мария Смирнова", avatar: "МС", lastMsg: "Файл отправлен 📎", time: "13:17", online: true, typing: true },
  { id: 3, name: "Команда дизайн", avatar: "КД", lastMsg: "Новый макет готов", time: "12:05", unread: 7, online: false },
  { id: 4, name: "Иван Петров", avatar: "ИП", lastMsg: "Как дела с проектом?", time: "вчера", online: false },
  { id: 5, name: "Sophia Chen", avatar: "SC", lastMsg: "Hello! See you at 3pm", time: "вчера", online: true },
  { id: 6, name: "Рабочий чат", avatar: "РЧ", lastMsg: "Встреча перенесена на 16:00", time: "пн", unread: 1, online: false },
];

const MESSAGES: Message[] = [
  { id: 1, text: "Привет! Как дела с проектом ALTAIR?", time: "14:20", out: false, reactions: [{ emoji: "👋", count: 1, mine: true }] },
  { id: 2, text: "Всё отлично! Почти закончил дизайн. Выглядит очень круто 🔥", time: "14:21", out: true, reactions: [{ emoji: "🔥", count: 3, mine: false }, { emoji: "❤️", count: 1, mine: true }] },
  { id: 3, text: "Hello! Can you share the prototype link?", time: "14:25", out: false, translated: "Привет! Можешь поделиться ссылкой на прототип?", showTranslation: true },
  { id: 4, text: "Конечно! Вот ссылка: altair.app/proto/v2", time: "14:27", out: true },
  { id: 5, text: "Wow, it looks amazing! The gradient effects are stunning 😍", time: "14:30", out: false, translated: "Вау, выглядит потрясающе! Эффекты градиента просто восхитительны 😍", showTranslation: true, reactions: [{ emoji: "😍", count: 2, mine: false }] },
  { id: 6, text: "Отлично, увидимся завтра!", time: "14:32", out: false },
];

const CHANNELS: Channel[] = [
  { id: 1, name: "ALTAIR Official", emoji: "⭐", subs: "2.4M", lastPost: "Обновление 3.0 уже скоро!", grad: "linear-gradient(135deg,#7c4dff,#00e5ff)" },
  { id: 2, name: "Tech Pulse", emoji: "⚡", subs: "890K", lastPost: "ИИ захватывает дизайн-индустрию", grad: "linear-gradient(135deg,#ff4db8,#7c4dff)" },
  { id: 3, name: "Крипто Сигналы", emoji: "📈", subs: "1.1M", lastPost: "BTC пробил 100K снова!", grad: "linear-gradient(135deg,#00e676,#00e5ff)" },
  { id: 4, name: "Музыка 24/7", emoji: "🎵", subs: "3.7M", lastPost: "Новый плейлист: Future Beats", grad: "linear-gradient(135deg,#ff9800,#ff4db8)" },
  { id: 5, name: "Кино & Сериалы", emoji: "🎬", subs: "560K", lastPost: "Топ фильмов февраля 2026", grad: "linear-gradient(135deg,#e91e63,#7c4dff)" },
];

const NOTES: Note[] = [
  { id: 1, title: "Идеи для ALTAIR", text: "Добавить AR-фильтры в видеозвонки. Голосовые заметки с транскрипцией. Тёмная тема Pro...", date: "сегодня", color: "#7c4dff" },
  { id: 2, title: "Встреча с командой", text: "Понедельник 15:00. Обсудить новые функции. Показать прототип. Распределить задачи...", date: "вчера", color: "#00e5ff" },
  { id: 3, title: "Книги к прочтению", text: "Atomic Habits, Deep Work, The Design of Everyday Things, Sapiens...", date: "23 фев", color: "#ff4db8" },
  { id: 4, title: "Пароли (зашифровано 🔒)", text: "••••••••••••••••••••••••••••••", date: "20 фев", color: "#00e676" },
];

const CALLS = [
  { id: 1, name: "Алекс Романов", type: "video", time: "вчера 18:42", duration: "24 мин", out: true },
  { id: 2, name: "Мария Смирнова", type: "voice", time: "вчера 12:10", duration: "5 мин", out: false },
  { id: 3, name: "Команда дизайн", type: "video", time: "пн 10:00", duration: "1ч 12 мин", out: false },
  { id: 4, name: "Иван Петров", type: "voice", time: "пн 09:15", duration: "Пропущен", out: false },
  { id: 5, name: "Sophia Chen", type: "video", time: "вс 21:30", duration: "47 мин", out: true },
];

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
    <div
      className="flex items-center justify-center font-semibold text-white shrink-0 select-none"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: g,
        fontSize: size * 0.35,
      }}
    >
      {label}
    </div>
  );
}

// ─── Sidebar Navigation ──────────────────────────────────────
function Sidebar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; icon: string; label: string }[] = [
    { id: "chats", icon: "MessageCircle", label: "Чаты" },
    { id: "channels", icon: "Radio", label: "Каналы" },
    { id: "calls", icon: "Phone", label: "Звонки" },
    { id: "notes", icon: "StickyNote", label: "Заметки" },
  ];

  return (
    <div className="flex flex-col items-center glass h-full py-4 gap-1 border-r border-white/5" style={{ width: 72 }}>
      <div className="mb-4 flex flex-col items-center gap-1">
        <div
          className="flex items-center justify-center rounded-2xl neon-glow"
          style={{ width: 44, height: 44, background: "linear-gradient(135deg,#7c4dff,#00e5ff)" }}
        >
          <span className="text-white font-bebas text-xl tracking-widest">A</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1 w-full px-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`sidebar-item flex flex-col items-center gap-1 w-full ${active === item.id ? "active" : ""}`}
          >
            <Icon
              name={item.icon}
              size={22}
              className={active === item.id ? "text-violet-400" : "text-white/40"}
            />
            <span className="text-[10px] font-medium" style={{ color: active === item.id ? "#a78bfa" : "rgba(255,255,255,0.4)" }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => onChange("profile")}
        className={`sidebar-item w-full flex flex-col items-center gap-1 ${active === "profile" ? "active" : ""}`}
      >
        <div className="relative">
          <Avatar label="ВЮ" size={32} />
          <div className="online-dot absolute -bottom-0.5 -right-0.5" />
        </div>
      </button>
    </div>
  );
}

// ─── Chats Panel ─────────────────────────────────────────────
function ChatsPanel({ activeChat, onSelect }: { activeChat: number; onSelect: (id: number) => void }) {
  const [search, setSearch] = useState("");
  const filtered = CHATS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full border-r border-white/5" style={{ width: 300 }}>
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Сообщения</h2>
          <button className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:neon-border transition-all">
            <Icon name="Plus" size={16} className="text-violet-400" />
          </button>
        </div>
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full glass rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/80 placeholder:text-white/25 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {filtered.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={`chat-item ${activeChat === chat.id ? "active" : ""}`}
          >
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
                      <div className="flex gap-1">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                      <span className="text-xs text-violet-400">печатает...</span>
                    </div>
                  ) : (
                    <span className="text-xs text-white/35 truncate">{chat.lastMsg}</span>
                  )}
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

const REACTION_EMOJIS = ["❤️", "🔥", "😂", "😍", "👍", "👎", "😮", "😢", "🎉", "🙏"];

// ─── Chat Window ─────────────────────────────────────────────
function ChatWindow({ chatId }: { chatId: number }) {
  const chat = CHATS.find((c) => c.id === chatId)!;
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [input, setInput] = useState("");
  const [translateAll, setTranslateAll] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<number | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const close = () => setPickerFor(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: input, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }), out: true },
    ]);
    setInput("");
  };

  const addReaction = (msgId: number, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages((prev) =>
      prev.map((msg) => {
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
      })
    );
    setPickerFor(null);
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-mesh">
      <div className="glass-strong border-b border-white/5 px-5 py-3 flex items-center gap-3">
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
          <div className="lock-badge flex items-center gap-1">
            <Icon name="Lock" size={10} />
            E2E
          </div>
          <button
            onClick={() => setTranslateAll(!translateAll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              translateAll ? "bg-violet-500/20 border border-violet-500/40 text-violet-300" : "glass text-white/40"
            }`}
          >
            <Icon name="Languages" size={13} />
            Перевод
          </button>
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:neon-glow-cyan transition-all">
            <Icon name="Video" size={17} className="text-cyan-400" />
          </button>
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:neon-glow transition-all">
            <Icon name="Phone" size={17} className="text-violet-400" />
          </button>
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center">
            <Icon name="MoreVertical" size={17} className="text-white/40" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`flex ${msg.out ? "justify-end" : "justify-start"} animate-fade-in`}
            style={{ animationDelay: `${i * 0.03}s` }}
            onMouseEnter={() => setHoveredMsg(msg.id)}
            onMouseLeave={() => setHoveredMsg(null)}
          >
            <div style={{ maxWidth: "68%" }} className="relative">
              {/* Hover action: добавить реакцию */}
              <div
                className={`absolute top-1 ${msg.out ? "-left-10" : "-right-10"} transition-all duration-150 ${hoveredMsg === msg.id ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setPickerFor(pickerFor === msg.id ? null : msg.id); }}
                  className="w-8 h-8 glass rounded-xl flex items-center justify-center text-base hover:neon-border transition-all"
                  title="Добавить реакцию"
                >
                  😊
                </button>
              </div>

              {/* Пикер эмодзи */}
              {pickerFor === msg.id && (
                <div
                  className={`absolute z-50 bottom-full mb-2 ${msg.out ? "right-0" : "left-0"} glass-strong rounded-2xl p-2 flex gap-1 flex-wrap animate-scale-in`}
                  style={{ width: 224, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", border: "1px solid rgba(124,77,255,0.3)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={(e) => addReaction(msg.id, emoji, e)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:bg-white/10 transition-all hover:scale-125 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div className={`px-4 py-2.5 text-sm leading-relaxed ${msg.out ? "msg-bubble-out text-white" : "msg-bubble-in text-white/85"}`}>
                {msg.text}
              </div>
              {translateAll && msg.translated && (
                <div
                  className="mt-1 px-4 py-2 rounded-xl text-xs text-white/50 italic border border-dashed border-white/10 flex items-start gap-2"
                  style={{ background: "rgba(124,77,255,0.06)" }}
                >
                  <Icon name="Languages" size={11} className="shrink-0 mt-0.5 text-violet-400" />
                  {msg.translated}
                </div>
              )}

              {/* Реакции */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-1.5 ${msg.out ? "justify-end" : "justify-start"}`}>
                  {msg.reactions.map((r) => (
                    <button
                      key={r.emoji}
                      onClick={(e) => addReaction(msg.id, r.emoji, e)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-110 active:scale-95 ${
                        r.mine
                          ? "border border-violet-500/60 text-violet-300"
                          : "border border-white/10 text-white/50"
                      }`}
                      style={{
                        background: r.mine ? "rgba(124,77,255,0.18)" : "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <span>{r.emoji}</span>
                      {r.count > 1 && <span>{r.count}</span>}
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

      <div className="glass-strong border-t border-white/5 p-3">
        <div className="flex items-end gap-2">
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center shrink-0">
            <Icon name="Paperclip" size={17} className="text-white/40" />
          </button>
          <div className="flex-1 glass rounded-2xl px-4 py-2.5 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Написать сообщение..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-white/85 placeholder:text-white/25 outline-none resize-none leading-relaxed"
              style={{ maxHeight: 120 }}
            />
            <button className="shrink-0">
              <Icon name="Smile" size={18} className="text-white/30 hover:text-yellow-400 transition-colors" />
            </button>
          </div>
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${isRecording ? "bg-red-500" : "glass"}`}
          >
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
type CreateType = "channel" | "group" | "bot";

interface CreateModalProps {
  type: CreateType;
  onClose: () => void;
  onCreate: (item: { name: string; emoji: string; description: string }) => void;
}

const CREATE_META: Record<CreateType, { title: string; icon: string; placeholder: string; descPlaceholder: string; grad: string }> = {
  channel: {
    title: "Новый канал",
    icon: "📡",
    placeholder: "Название канала",
    descPlaceholder: "О чём этот канал?",
    grad: "linear-gradient(135deg,#7c4dff,#00e5ff)",
  },
  group: {
    title: "Новая группа",
    icon: "👥",
    placeholder: "Название группы",
    descPlaceholder: "Описание группы",
    grad: "linear-gradient(135deg,#ff4db8,#7c4dff)",
  },
  bot: {
    title: "Создать бота",
    icon: "🤖",
    placeholder: "Имя бота (латиницей)",
    descPlaceholder: "Что умеет этот бот?",
    grad: "linear-gradient(135deg,#00e676,#00e5ff)",
  },
};

const EMOJI_PRESETS = ["📡", "⭐", "⚡", "🎵", "🎬", "📈", "🔥", "💎", "🚀", "🌍", "👥", "🤖", "🎮", "💬", "🛒"];

function CreateModal({ type, onClose, onCreate }: CreateModalProps) {
  const meta = CREATE_META[type];
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState(meta.icon);
  const [step, setStep] = useState<"form" | "done">("form");

  const handleCreate = () => {
    if (!name.trim()) return;
    setStep("done");
    setTimeout(() => {
      onCreate({ name: name.trim(), emoji, description: desc.trim() });
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-3xl w-full max-w-md mx-4 overflow-hidden animate-scale-in"
        style={{ border: "1px solid rgba(124,77,255,0.3)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
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
              <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
                <Icon name="X" size={16} className="text-white/50" />
              </button>
            </div>

            {/* Emoji picker */}
            <div>
              <div className="text-xs text-white/40 mb-2 font-medium">Иконка</div>
              <div className="flex flex-wrap gap-2">
                {EMOJI_PRESETS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110 ${
                      emoji === e ? "neon-border scale-110" : "glass"
                    }`}
                    style={emoji === e ? { background: "rgba(124,77,255,0.2)" } : {}}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: meta.grad }}>
                {emoji}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{name || (type === "bot" ? "@username_bot" : meta.placeholder)}</div>
                <div className="text-white/30 text-xs mt-0.5">
                  {type === "channel" ? "0 подписчиков" : type === "group" ? "0 участников" : "Бот · не активен"}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <div className="text-xs text-white/40 mb-1.5 font-medium">
                {type === "bot" ? "Имя бота" : "Название"}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={meta.placeholder}
                autoFocus
                className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/50 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <div className="text-xs text-white/40 mb-1.5 font-medium">Описание</div>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={meta.descPlaceholder}
                rows={2}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Bot extra: token */}
            {type === "bot" && (
              <div
                className="rounded-xl p-3 flex items-start gap-2 text-xs"
                style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)" }}
              >
                <Icon name="Info" size={13} className="text-green-400 shrink-0 mt-0.5" />
                <span className="text-green-400/80">После создания вы получите API-токен для подключения вашего бота</span>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full btn-grad py-3 rounded-2xl text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {type === "channel" ? "Создать канал" : type === "group" ? "Создать группу" : "Создать бота"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Channels View ────────────────────────────────────────────
type ChannelTab = "channels" | "groups" | "bots";

interface GroupItem { id: number; name: string; emoji: string; members: string; lastMsg: string; grad: string; }
interface BotItem   { id: number; name: string; emoji: string; description: string; active: boolean; grad: string; }

const GROUPS: GroupItem[] = [
  { id: 1, name: "Команда дизайн", emoji: "🎨", members: "12", lastMsg: "Новый макет готов", grad: "linear-gradient(135deg,#ff4db8,#7c4dff)" },
  { id: 2, name: "Разработка ALTAIR", emoji: "🚀", members: "8", lastMsg: "Релиз в пятницу!", grad: "linear-gradient(135deg,#7c4dff,#00e5ff)" },
  { id: 3, name: "Друзья", emoji: "🔥", members: "5", lastMsg: "Встречаемся в субботу?", grad: "linear-gradient(135deg,#ff9800,#ff4db8)" },
];

const BOTS: BotItem[] = [
  { id: 1, name: "TranslateBot", emoji: "🌍", description: "Мгновенный перевод сообщений", active: true, grad: "linear-gradient(135deg,#00e676,#00e5ff)" },
  { id: 2, name: "ReminderBot", emoji: "⏰", description: "Напоминания и расписание", active: true, grad: "linear-gradient(135deg,#7c4dff,#ff4db8)" },
  { id: 3, name: "NewsBot", emoji: "📰", description: "Свежие новости по вашим темам", active: false, grad: "linear-gradient(135deg,#ff9800,#7c4dff)" },
];

function ChannelsView() {
  const [tab, setTab] = useState<ChannelTab>("channels");
  const [active, setActive] = useState<number | null>(null);
  const [modal, setModal] = useState<CreateType | null>(null);
  const [channels, setChannels] = useState(CHANNELS);
  const [groups, setGroups] = useState(GROUPS);
  const [bots, setBots] = useState(BOTS);

  const tabs: { id: ChannelTab; label: string; icon: string }[] = [
    { id: "channels", label: "Каналы", icon: "Radio" },
    { id: "groups",   label: "Группы",  icon: "Users" },
    { id: "bots",     label: "Боты",    icon: "Bot" },
  ];

  const handleCreate = (item: { name: string; emoji: string; description: string }) => {
    const grad = modal === "channel"
      ? "linear-gradient(135deg,#7c4dff,#00e5ff)"
      : modal === "group"
      ? "linear-gradient(135deg,#ff4db8,#7c4dff)"
      : "linear-gradient(135deg,#00e676,#00e5ff)";

    if (modal === "channel") {
      setChannels((prev) => [{ id: Date.now(), name: item.name, emoji: item.emoji, subs: "0", lastPost: item.description || "Только создан", grad }, ...prev]);
      setTab("channels");
    } else if (modal === "group") {
      setGroups((prev) => [{ id: Date.now(), name: item.name, emoji: item.emoji, members: "1", lastMsg: item.description || "Группа создана", grad }, ...prev]);
      setTab("groups");
    } else if (modal === "bot") {
      setBots((prev) => [{ id: Date.now(), name: item.name, emoji: item.emoji, description: item.description || "Новый бот", active: false, grad }, ...prev]);
      setTab("bots");
    }
  };

  const createType: CreateType = tab === "groups" ? "group" : tab === "bots" ? "bot" : "channel";

  // Правая часть — пусто
  const renderEmpty = () => (
    <div className="flex-1 flex items-center justify-center bg-mesh">
      <div className="text-center space-y-3">
        <div className="text-5xl">{tab === "channels" ? "📡" : tab === "groups" ? "👥" : "🤖"}</div>
        <div className="text-white/50 font-semibold">
          {tab === "channels" ? "Выберите канал" : tab === "groups" ? "Выберите группу" : "Выберите бота"}
        </div>
        <button
          onClick={() => setModal(createType)}
          className="btn-grad px-5 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2 mx-auto"
        >
          <Icon name="Plus" size={14} />
          {tab === "channels" ? "Создать канал" : tab === "groups" ? "Создать группу" : "Создать бота"}
        </button>
      </div>
    </div>
  );

  // Правая часть — детали
  const renderDetail = () => {
    if (tab === "channels") {
      const ch = channels.find((c) => c.id === active);
      if (!ch) return renderEmpty();
      return (
        <div className="flex-1 flex flex-col bg-mesh">
          <div className="glass-strong border-b border-white/5 px-5 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: ch.grad }}>{ch.emoji}</div>
            <div>
              <div className="font-semibold text-white text-sm">{ch.name}</div>
              <div className="text-xs text-white/40">{ch.subs} подписчиков</div>
            </div>
            <button className="ml-auto btn-grad px-4 py-1.5 rounded-xl text-sm font-medium text-white">Подписаться</button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto" style={{ background: ch.grad }}>{ch.emoji}</div>
              <div className="text-white/70 font-semibold">{ch.name}</div>
              <div className="text-white/30 text-sm">Подпишитесь, чтобы читать посты</div>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "groups") {
      const gr = groups.find((g) => g.id === active);
      if (!gr) return renderEmpty();
      return (
        <div className="flex-1 flex flex-col bg-mesh">
          <div className="glass-strong border-b border-white/5 px-5 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: gr.grad }}>{gr.emoji}</div>
            <div>
              <div className="font-semibold text-white text-sm">{gr.name}</div>
              <div className="text-xs text-white/40">{gr.members} участников</div>
            </div>
            <div className="ml-auto flex gap-2">
              <button className="w-9 h-9 glass rounded-xl flex items-center justify-center">
                <Icon name="Video" size={16} className="text-cyan-400" />
              </button>
              <button className="w-9 h-9 glass rounded-xl flex items-center justify-center">
                <Icon name="UserPlus" size={16} className="text-violet-400" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto" style={{ background: gr.grad }}>{gr.emoji}</div>
              <div className="text-white/70 font-semibold">{gr.name}</div>
              <div className="text-white/30 text-sm">{gr.members} участников · Нажмите, чтобы открыть чат</div>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "bots") {
      const bot = bots.find((b) => b.id === active);
      if (!bot) return renderEmpty();
      return (
        <div className="flex-1 flex flex-col bg-mesh">
          <div className="glass-strong border-b border-white/5 px-5 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: bot.grad }}>{bot.emoji}</div>
            <div>
              <div className="font-semibold text-white text-sm">{bot.name}</div>
              <div className="text-xs" style={{ color: bot.active ? "#00e676" : "rgba(255,255,255,0.35)" }}>
                {bot.active ? "● активен" : "○ не активен"}
              </div>
            </div>
            <button className="ml-auto btn-grad px-4 py-1.5 rounded-xl text-sm font-medium text-white flex items-center gap-1.5">
              <Icon name="MessageCircle" size={14} />
              Написать боту
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            <div className="glass rounded-2xl p-4 space-y-2">
              <div className="text-xs text-white/40 font-medium">Описание</div>
              <div className="text-white/75 text-sm">{bot.description}</div>
            </div>
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="text-xs text-white/40 font-medium">API Токен</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-violet-300 bg-violet-500/10 rounded-lg px-3 py-2 font-mono truncate">
                  {bot.active ? "7x3k9••••••••••••••••••••••" : "Токен не выдан"}
                </code>
                {bot.active && (
                  <button className="w-8 h-8 glass rounded-lg flex items-center justify-center">
                    <Icon name="Copy" size={14} className="text-white/40" />
                  </button>
                )}
              </div>
            </div>
            <div className="glass rounded-2xl p-4 space-y-2">
              <div className="text-xs text-white/40 font-medium">Команды</div>
              {["/start", "/help", "/settings", "/stop"].map((cmd) => (
                <div key={cmd} className="flex items-center gap-2 py-1">
                  <code className="text-violet-400 text-sm font-mono">{cmd}</code>
                  <span className="text-white/30 text-xs">—</span>
                  <span className="text-white/50 text-xs">
                    {cmd === "/start" ? "Запустить бота" : cmd === "/help" ? "Справка" : cmd === "/settings" ? "Настройки" : "Остановить"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return renderEmpty();
  };

  return (
    <>
      {modal && <CreateModal type={modal} onClose={() => setModal(null)} onCreate={handleCreate} />}

      <div className="flex-1 flex h-full">
        <div className="flex flex-col h-full border-r border-white/5" style={{ width: 300 }}>
          {/* Tabs */}
          <div className="px-3 pt-3 pb-1">
            <div className="flex gap-1 glass rounded-2xl p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setActive(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    tab === t.id
                      ? "text-white"
                      : "text-white/35 hover:text-white/60"
                  }`}
                  style={tab === t.id ? { background: "linear-gradient(135deg,rgba(124,77,255,0.5),rgba(0,229,255,0.2))", boxShadow: "0 2px 12px rgba(124,77,255,0.3)" } : {}}
                >
                  <Icon name={t.icon} size={13} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search + create */}
          <div className="px-3 py-2 flex gap-2">
            <div className="relative flex-1">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                placeholder="Поиск..."
                className="w-full glass rounded-xl pl-8 pr-3 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none"
              />
            </div>
            <button
              onClick={() => setModal(createType)}
              className="w-9 h-9 btn-grad rounded-xl flex items-center justify-center shrink-0"
              title={`Создать ${tab === "channels" ? "канал" : tab === "groups" ? "группу" : "бота"}`}
            >
              <Icon name="Plus" size={16} className="text-white" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {tab === "channels" && channels.map((ch) => (
              <div key={ch.id} onClick={() => setActive(ch.id)} className={`chat-item ${active === ch.id ? "active" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: ch.grad }}>{ch.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white/90 truncate">{ch.name}</div>
                    <div className="text-xs text-white/35 truncate">{ch.lastPost}</div>
                  </div>
                  <div className="text-xs text-white/25 shrink-0">{ch.subs}</div>
                </div>
              </div>
            ))}

            {tab === "groups" && groups.map((gr) => (
              <div key={gr.id} onClick={() => setActive(gr.id)} className={`chat-item ${active === gr.id ? "active" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: gr.grad }}>{gr.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white/90 truncate">{gr.name}</div>
                    <div className="text-xs text-white/35 truncate">{gr.lastMsg}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/25 shrink-0">
                    <Icon name="Users" size={11} />
                    {gr.members}
                  </div>
                </div>
              </div>
            ))}

            {tab === "bots" && bots.map((bot) => (
              <div key={bot.id} onClick={() => setActive(bot.id)} className={`chat-item ${active === bot.id ? "active" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: bot.grad }}>{bot.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white/90 truncate">{bot.name}</div>
                    <div className="text-xs text-white/35 truncate">{bot.description}</div>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: bot.active ? "#00e676" : "rgba(255,255,255,0.2)", boxShadow: bot.active ? "0 0 6px #00e676" : "none" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {renderDetail()}
      </div>
    </>
  );
}

// ─── Calls View ───────────────────────────────────────────────
function CallsView() {
  const [calling, setCalling] = useState(false);
  return (
    <div className="flex-1 flex flex-col h-full bg-mesh">
      <div className="glass-strong border-b border-white/5 px-5 py-3 flex items-center gap-3">
        <h2 className="text-lg font-bold text-white flex-1">Звонки</h2>
        <button className="btn-grad px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white">
          <Icon name="Video" size={15} />
          Новый звонок
        </button>
      </div>

      {calling && (
        <div
          className="mx-4 mt-4 rounded-2xl p-4 flex items-center gap-4 neon-glow animate-scale-in"
          style={{ background: "linear-gradient(135deg,rgba(124,77,255,0.3),rgba(0,229,255,0.15))", border: "1px solid rgba(124,77,255,0.4)" }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center pulse-ring" style={{ background: "linear-gradient(135deg,#7c4dff,#00e5ff)" }}>
            <span className="text-white font-bold">МС</span>
          </div>
          <div>
            <div className="text-white font-semibold">Мария Смирнова</div>
            <div className="text-green-400 text-sm">02:34 · Видеозвонок</div>
          </div>
          <button onClick={() => setCalling(false)} className="ml-auto w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
            <Icon name="PhoneOff" size={18} className="text-white" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {CALLS.map((call) => (
          <div key={call.id} className="chat-item flex items-center gap-3">
            <Avatar label={call.name.split(" ").map((w) => w[0]).join("").slice(0, 2)} size={44} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white/90">{call.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <Icon
                  name={call.type === "video" ? "Video" : "Phone"}
                  size={12}
                  className={call.duration === "Пропущен" ? "text-red-400" : call.out ? "text-violet-400" : "text-green-400"}
                />
                <span className="text-xs text-white/35">{call.time} · {call.duration}</span>
              </div>
            </div>
            <button onClick={() => setCalling(true)} className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:neon-glow transition-all">
              <Icon name={call.type === "video" ? "Video" : "Phone"} size={16} className="text-violet-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Notes View ───────────────────────────────────────────────
function NotesView() {
  const [active, setActive] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>(NOTES);
  const [editText, setEditText] = useState("");

  const openNote = (note: Note) => { setActive(note); setEditText(note.text); };

  return (
    <div className="flex-1 flex h-full">
      <div className="flex flex-col h-full border-r border-white/5" style={{ width: 300 }}>
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Заметки</h2>
            <button
              onClick={() => {
                const n: Note = { id: Date.now(), title: "Новая заметка", text: "", date: "сейчас", color: "#7c4dff" };
                setNotes((prev) => [n, ...prev]);
                openNote(n);
              }}
              className="w-8 h-8 glass rounded-xl flex items-center justify-center"
            >
              <Icon name="Plus" size={16} className="text-violet-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5">
          {notes.map((note) => (
            <div key={note.id} onClick={() => openNote(note)} className={`chat-item ${active?.id === note.id ? "active" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: note.color, boxShadow: `0 0 8px ${note.color}` }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white/90 truncate">{note.title}</div>
                  <div className="text-xs text-white/35 truncate mt-0.5">{note.text}</div>
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
              <input defaultValue={active.title} className="flex-1 bg-transparent text-white font-semibold outline-none text-sm" />
              <div className="lock-badge flex items-center gap-1">
                <Icon name="Lock" size={10} />
                Зашифровано
              </div>
              <button className="w-8 h-8 glass rounded-xl flex items-center justify-center">
                <Icon name="Trash2" size={15} className="text-red-400" />
              </button>
            </div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 bg-transparent text-white/75 text-sm p-5 outline-none resize-none leading-relaxed"
              placeholder="Начните писать..."
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-5xl">📝</div>
              <div className="text-white/50 font-semibold">Выберите заметку</div>
              <div className="text-white/25 text-sm">Или создайте новую</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────
function ProfileView() {
  return (
    <div className="flex-1 flex flex-col h-full bg-mesh overflow-y-auto">
      <div className="relative px-8 pt-10 pb-6 flex flex-col items-center">
        <div className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(180deg,rgba(124,77,255,0.5) 0%, transparent 100%)" }} />
        <div className="relative">
          <Avatar label="ВЮ" size={96} />
          <div className="online-dot absolute -bottom-1 -right-1" style={{ width: 14, height: 14 }} />
        </div>
        <h1 className="text-2xl font-bold text-white mt-4">Владимир Юрьев</h1>
        <p className="text-white/40 text-sm mt-1">@vladimir_altair</p>
        <div className="lock-badge mt-3 flex items-center gap-1.5">
          <Icon name="ShieldCheck" size={11} />
          Сквозное шифрование активно
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-6 mb-6">
        {[{ label: "Сообщений", value: "12.4K" }, { label: "Чатов", value: "47" }, { label: "Файлов", value: "238" }].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold grad-text">{s.value}</div>
            <div className="text-xs text-white/40 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="px-6 space-y-2 pb-8">
        {[
          { icon: "Bell", label: "Уведомления", val: "Вкл" },
          { icon: "Languages", label: "Язык перевода", val: "RU ↔ EN" },
          { icon: "Palette", label: "Тема", val: "ALTAIR Dark" },
          { icon: "Shield", label: "Приватность", val: "Максимум" },
          { icon: "Download", label: "Скачать ALTAIR", val: "iOS / Android" },
          { icon: "Store", label: "Магазин обновлений", val: "Pro — активен" },
          { icon: "Music", label: "ALTAIR Music", val: "Подключено" },
          { icon: "LogOut", label: "Выйти", val: "" },
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
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyChat() {
  return (
    <div className="flex-1 flex items-center justify-center bg-mesh">
      <div className="text-center space-y-4 animate-fade-in">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto neon-glow"
          style={{ background: "linear-gradient(135deg,#7c4dff,#00e5ff)" }}
        >
          <span className="font-bebas text-4xl text-white tracking-widest">A</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-bebas tracking-widest text-3xl">ALTAIR</h2>
          <p className="text-white/35 text-sm mt-1">Выберите чат или начните новый</p>
        </div>
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <div className="lock-badge flex items-center gap-1.5">
            <Icon name="Lock" size={10} />
            Сквозное шифрование
          </div>
          <div className="lock-badge flex items-center gap-1.5" style={{ color: "#00e5ff", borderColor: "rgba(0,229,255,0.3)", background: "rgba(0,229,255,0.1)" }}>
            <Icon name="Languages" size={10} />
            Перевод в реальном времени
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<number | null>(null);

  const renderMain = () => {
    if (tab === "chats") {
      return (
        <>
          <ChatsPanel activeChat={activeChat ?? -1} onSelect={setActiveChat} />
          {activeChat ? <ChatWindow chatId={activeChat} /> : <EmptyChat />}
        </>
      );
    }
    if (tab === "channels") return <ChannelsView />;
    if (tab === "calls") return <CallsView />;
    if (tab === "notes") return <NotesView />;
    if (tab === "profile") return <div className="flex-1 flex h-full"><ProfileView /></div>;
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