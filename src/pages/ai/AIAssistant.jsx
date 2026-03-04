import { useState, useRef, useEffect } from "react";
import { PageHeader, Card } from "../../components/ui";
import { queryStream } from "../../lib/aiClient";
import AnomalyPanel from "../../components/ai/AnomalyPanel";
import CashFlowForecast from "../../components/ai/CashFlowForecast";

const SUGGESTIONS = [
  "Tampilkan stok semua produk plywood saat ini",
  "Siapa customer dengan piutang terbesar?",
  "Berapa total hutang dagang yang jatuh tempo bulan ini?",
  "Apa posisi kas kita sekarang di semua rekening?",
  "Order penjualan mana yang masih aktif?",
  "Vendor mana yang paling sering kita beli?",
  "Show me all overdue AR invoices",
  "What is our gross profit margin this month?",
];

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm flex-shrink-0 mt-1">
          🤖
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-blue-600 text-white rounded-br-sm"
          : "bg-gray-100 text-gray-700 rounded-bl-sm"
      }`}>
        {msg.streaming && !msg.content ? (
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
          </span>
        ) : (
          <FormattedContent content={msg.content} />
        )}
        {msg.streaming && msg.content && (
          <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-text-bottom" />
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-xs font-black flex-shrink-0 mt-1">
          {JSON.parse(localStorage.getItem("erp_user") || "{}")?.avatar || "U"}
        </div>
      )}
    </div>
  );
}

function FormattedContent({ content }) {
  // Simple markdown-lite: **bold**, bullet lists, line breaks
  const lines = (content || "").split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        // Bullet points
        if (line.startsWith("•") || line.startsWith("-")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-blue-700 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: boldify(line.slice(1).trim()) }} />
            </div>
          );
        }
        // Numbered
        if (/^\d+\./.test(line)) {
          const [num, ...rest] = line.split(". ");
          return (
            <div key={i} className="flex gap-2">
              <span className="text-gray-500 flex-shrink-0 font-mono text-xs">{num}.</span>
              <span dangerouslySetInnerHTML={{ __html: boldify(rest.join(". ")) }} />
            </div>
          );
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
      })}
    </div>
  );
}

function boldify(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900 font-bold">$1</strong>');
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Halo! Saya asisten AI Mustikatama ERP 🤖\n\nSaya bisa membantu Anda menganalisis data bisnis. Tanyakan apa saja dalam Bahasa Indonesia atau Inggris.\n\n**Contoh pertanyaan:**\n• Berapa stok plywood 18mm saat ini?\n• Customer mana yang punya piutang paling besar?\n• Tampilkan semua tagihan vendor yang jatuh tempo",
    }
  ]);
  const [input,     setInput]   = useState("");
  const [sending,   setSending] = useState(false);
  const [activeTab, setTab]     = useState("chat");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question || sending) return;

    setInput("");
    setSending(true);

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: question }]);

    // Add empty AI message (will stream into)
    const aiMsgIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    let full = "";
    try {
      for await (const chunk of queryStream(question)) {
        full += chunk;
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: full } : m
        ));
      }
    } catch (e) {
      full = `Maaf, terjadi kesalahan: ${e.message}`;
    } finally {
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, content: full, streaming: false } : m
      ));
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const TABS = [
    { key: "chat",      icon: "💬", label: "Tanya AI",          bi: "Chat" },
    { key: "anomalies", icon: "🔍", label: "Deteksi Anomali",   bi: "Anomaly Detection" },
    { key: "forecast",  icon: "📈", label: "Proyeksi Arus Kas", bi: "Cash Flow Forecast" },
  ];

  return (
    <div>
      <PageHeader title="Asisten AI" subtitle="Analisis data bisnis dengan kecerdasan buatan" />

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 pb-0 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? "border-blue-500 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
        {/* AI indicator */}
        <div className="ml-auto flex items-center gap-1.5 self-center mr-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500">Claude AI</span>
        </div>
      </div>

      {/* Chat tab */}
      {activeTab === "chat" && (
        <div className="flex flex-col" style={{ height: "calc(100vh - 260px)", minHeight: 400 }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {SUGGESTIONS.slice(0, 4).map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan apa saja tentang data bisnis… (Enter untuk kirim)"
              rows={2}
              className="flex-1 erp-input resize-none text-sm"
              disabled={sending}
            />
            <button
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl px-4 flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
              {sending ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="text-lg">↑</span>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">Enter untuk kirim · Shift+Enter untuk baris baru</p>
        </div>
      )}

      {/* Anomaly tab */}
      {activeTab === "anomalies" && (
        <Card title="Deteksi Anomali & Risiko" subtitle="AI menganalisis transaksi untuk menemukan pola tidak biasa">
          <AnomalyPanel compact={false} />
        </Card>
      )}

      {/* Forecast tab */}
      {activeTab === "forecast" && (
        <Card title="Proyeksi Arus Kas 90 Hari" subtitle="Berdasarkan AR/AP jatuh tempo dan saldo bank saat ini">
          <CashFlowForecast />
        </Card>
      )}
    </div>
  );
}
