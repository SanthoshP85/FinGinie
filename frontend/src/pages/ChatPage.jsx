import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  Plus,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { chatService } from "../services/services";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Add welcome message when no session is selected
  useEffect(() => {
    if (!sessionId) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm FinGinie, your AI financial assistant. I can help you with budgeting, investments, savings strategies, and more. How can I assist you today?",
        },
      ]);
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await chatService.getSessions();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSessionMessages = async (session) => {
    try {
      setLoading(true);
      setSessionId(session._id);
      setSidebarOpen(false);

      const response = await chatService.getSessionMessages(session._id);
      const sessionMessages = response.data.session?.messages || [];

      // Convert to display format
      const displayMessages = sessionMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      if (displayMessages.length === 0) {
        displayMessages.push({
          role: "assistant",
          content:
            "Hello! I'm FinGinie, your AI financial assistant. How can I help you today?",
        });
      }

      setMessages(displayMessages);
    } catch (error) {
      console.error("Failed to load session messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);

    try {
      const response = await chatService.sendMessage(message, sessionId);
      const newSessionId = response.data.sessionId;

      // If this is a new session, refresh sessions list
      if (!sessionId && newSessionId) {
        loadSessions();
      }

      setSessionId(newSessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.assistantResponse },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleNewChat = async () => {
    setSessionId(null);
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm FinGinie, your AI financial assistant. How can I help you today?",
      },
    ]);
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (e, sessionIdToDelete) => {
    e.stopPropagation();
    try {
      await chatService.deleteSession(sessionIdToDelete);
      setSessions((prev) => prev.filter((s) => s._id !== sessionIdToDelete));

      // If deleting current session, start new chat
      if (sessionId === sessionIdToDelete) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const formatSessionDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const quickPrompts = [
    "How can I create a budget?",
    "What are good investment options?",
    "How to start an emergency fund?",
    "Tips for reducing expenses",
  ];

  return (
    <div className="flex h-full relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-secondary-200 px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-secondary-800">
              {sessionId ? "Chat" : "New Chat"}
            </h1>
            <p className="text-sm text-secondary-500">
              Ask me anything about finance
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Bot size={18} className="text-primary-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-secondary-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-secondary-200 rounded-full flex items-center justify-center">
                  <User size={18} className="text-secondary-600" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Bot size={18} className="text-primary-600" />
              </div>
              <div className="bg-white border border-secondary-200 rounded-2xl px-4 py-3">
                <Loader2
                  size={18}
                  className="animate-spin text-secondary-400"
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts (show when no messages or only welcome) */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInput(prompt)}
                  className="text-sm px-3 py-1.5 bg-white border border-secondary-200 rounded-full text-secondary-600 hover:bg-secondary-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-secondary-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-secondary-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Sessions Sidebar - Right Side */}
      <div
        className={`
        fixed lg:relative inset-y-0 right-0 z-50 w-72 bg-secondary-50 border-l border-secondary-200 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        flex flex-col
      `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-secondary-200 rounded"
          >
            <X size={20} />
          </button>
          <h2 className="font-semibold text-secondary-800">Chat History</h2>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {sessionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-secondary-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-secondary-500 text-sm">
              No chat history yet
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  onClick={() => loadSessionMessages(session)}
                  className={`
                    group p-3 rounded-lg cursor-pointer transition-colors
                    ${
                      sessionId === session._id
                        ? "bg-primary-100 border border-primary-300"
                        : "hover:bg-secondary-100 border border-transparent"
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare
                      size={16}
                      className="text-secondary-500 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-800 truncate">
                        {session.title || "New Conversation"}
                      </p>
                      <p className="text-xs text-secondary-500 mt-0.5">
                        {formatSessionDate(
                          session.updatedAt || session.createdAt,
                        )}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, session._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
