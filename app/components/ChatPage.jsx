"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import AuthWrapper from "../components/AuthWrapper";
import FileUploadArea from "../components/FileUploader";
import CustomDropdown from "../components/CustomDropdown";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash.debounce";
import {
  PencilLine,
  SquarePen,
  Trash2Icon,
  AlertTriangle,
  X,
} from "lucide-react";
import { useAuth } from "./AuthContext";

function ChatContent() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const { setCredits } = useAuth();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [marks, setMarks] = useState(2);
  const [pastSessions, setPastSessions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileUploaderRef = useRef(null);
  const isNewSession = useRef(false);
  const isSubmitting = useRef(false);
  const isFetchingMessages = useRef(false);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const autoBoldKeywords = (text) =>
    text.replace(/\b(important|note|tip)\b/gi, "**$1**");

  const toggleSidebar = () => setShowSidebar((prev) => !prev);

  const debouncedSearch = useMemo(
    () =>
      debounce((q) => {
        if (q.trim() === "") {
          setSearchResults([]);
          return;
        }
        const results = pastSessions.filter((session) =>
          session.title.toLowerCase().includes(q.toLowerCase())
        );
        setSearchResults(results);
      }, 300),
    [pastSessions]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query, debouncedSearch]);

  // Rename session
  const handleRename = async (id, title) => {
    if (!title?.trim()) return;
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${BACKEND_URL}/rename-session/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Rename failed");
      setPastSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title } : s))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete session
  const handleDelete = async (id) => {
    // if (!confirm("Are you sure you want to delete this chat?")) return;

    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${BACKEND_URL}/delete-session/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");

      setPastSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === sessionId) {
        setSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch user sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPastSessions(await res.json());
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Fetch messages for current session
  useEffect(() => {
    if (!sessionId) return;

    // Skip fetching if this is a new session we just created
    if (isNewSession.current) {
      console.log("Skipping fetch - new session");
      return;
    }

    // Prevent double fetching due to React StrictMode
    if (isFetchingMessages.current) return;
    isFetchingMessages.current = true;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BACKEND_URL}/messages/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // Deduplicate messages by ID
        const uniqueMessages = data.filter(
          (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
        );

        setMessages(
          uniqueMessages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
        fileUploaderRef.current?.clearFile();
      } catch (err) {
        console.error("Failed to fetch messages", err);
      } finally {
        isFetchingMessages.current = false;
      }
    };

    fetchMessages();
  }, [sessionId]);

  const startNewChat = () => {
    // Just clear current session — don't create it in backend yet
    isNewSession.current = false; // Reset flag
    setSessionId(null);
    setMessages([]);
    fileUploaderRef.current?.clearFile();
    setShowSidebar(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isSubmitting.current) return;

    const token = localStorage.getItem("access_token");
    if (!token) return router.push("/login");

    // Set submitting flag to prevent double submission
    isSubmitting.current = true;

    // Store input value before clearing it
    const inputValue = input;

    const userMessage = {
      id: crypto.randomUUID(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    // 1. Optimistically update the UI with the user's message
    setMessages((prev) => {
      // Check if user message already exists to prevent duplicates
      const messageExists = prev.some(
        (m) =>
          m.content === userMessage.content &&
          Math.abs(new Date(m.timestamp) - userMessage.timestamp) < 1000
      );
      if (messageExists) {
        console.log("User message already exists, skipping");
        return prev;
      }
      return [...prev, userMessage];
    });
    setInput(""); // 2. Clear the input right away
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_input: userMessage.content, // Use content from the message object
          marks,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // FastAPI wraps HTTPException detail in "detail" property
        const error = errorData.detail || errorData;
        if (error.error === "out_of_credits") {
          setError(
            error.message ||
              "You have run out of credits. Please upgrade or wait for daily refill."
          );
        } else {
          setError(error.message || "Something went wrong");
        }
        // Remove user message since request failed
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        return; // ⛔ stop execution
      }

      const data = await res.json();

      const botMessage = {
        id: crypto.randomUUID(),
        content: data.response,
        role: "bot",
        timestamp: new Date(),
      };

      // If a new session was created, update state
      if (!sessionId && data.session_id) {
        console.log("Setting isNewSession to true");
        isNewSession.current = true;
        setSessionId(data.session_id);
        setPastSessions((prev) => [
          {
            id: data.session_id,
            title: data.title || inputValue.slice(0, 50),
            created_at: data.created_at || new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      // 3. Only add the bot's message when it arrives

      setMessages((prev) => {
        // Check if bot message already exists to prevent duplicates
        const messageExists = prev.some(
          (m) => m.role === "bot" && m.content === botMessage.content
        );
        if (messageExists) {
          return prev;
        }
        return [...prev, botMessage];
      });

      if (data.credits_left !== undefined) {
        setCredits(data.credits_left); // update global context
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err.message);
      // Optional: Add logic to show the user's message failed to send
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
      fileUploaderRef.current?.clearFile();
    }
  };

  const handlePastChatClick = (id) => {
    isFetchingMessages.current = false; // Reset fetch flag when switching sessions
    isNewSession.current = false; // Reset new session flag
    setSessionId(id);
    setShowSidebar(true);
  };

  useEffect(scrollToBottom, [messages]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showDeleteModal) {
          setShowDeleteModal(false);
        }
        if (showRenameModal) {
          setShowRenameModal(false);
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showDeleteModal, showRenameModal]);

  return (
    <>
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0000005b] backdrop-blur-[4px] flex items-center justify-center z-[1000]"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#1f1f1f] text-white p-6 rounded-2xl w-[90%] sm:w-[400px] shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-3">Delete Chat?</h3>
              <p className="text-sm mb-6 opacity-80">
                Are you sure you want to delete this chat permanently?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(targetSessionId);
                    setShowDeleteModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✏️ Rename Modal */}
      <AnimatePresence>
        {showRenameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0000005b] backdrop-blur-[4px] flex items-center justify-center z-[1000]"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#1f1f1f] text-white p-6 rounded-2xl w-[90%] sm:w-[400px] shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-3">Rename Chat</h3>
              <input
                type="text"
                value={newTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newTitle.trim()) {
                      handleRename(targetSessionId, newTitle);
                      setShowRenameModal(false);
                    }
                  }
                }}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#121212] border border-[#444] text-[#ffe243] outline-none mb-5"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRename(targetSessionId, newTitle);
                    setShowRenameModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#ffe243] text-black font-semibold hover:bg-[#ffeb6b]"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="min-h-screen flex bg-[#161616] select noto">
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
              className="h-[100vh] w-64 bg-[#181818] p-4"
            >
              <div className="text-white flex items-center w-full justify-between mb-2 z-[999] no_scrollbar">
                <a href="/" className="text-2xl opacity-0">
                  Proff
                </a>
              </div>
              <hr className="my-3 text-[#ffe243]" />
              <button
                onClick={startNewChat}
                className="w-full mb-3 py-2 text-[0.9rem] text-left text-white rounded-lg flex gap-2 hover:bg-[#ffe34385] transition-all duration-[0.3s] items-center"
              >
                <SquarePen size={20} /> New Chat
              </button>
              <hr className="mb-3 text-[#ffe243]" />
              <h2 className="text-[0.9rem] text-white font-semibold mb-2">
                Past Chats
              </h2>
              {pastSessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex justify-between rounded-lg mb-2 hover:bg-[#ffe34385] transition-all duration-[0.3s] ${
                    s.id === sessionId ? "bg-[#ffe34385]" : "text-[#fff]"
                  }`}
                >
                  <button
                    onClick={() => handlePastChatClick(s.id)}
                    className="text-[#ffe243] block w-full text-left px-3 py-2 text-[0.9rem]"
                  >
                    {s.title}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setTargetSessionId(s.id);
                        setNewTitle(s.title);
                        setShowRenameModal(true);
                      }}
                      className="p-2 rounded-md hover:bg-white/10"
                    >
                      <PencilLine
                        size={18}
                        className="text-white cursor-pointer"
                      />
                    </button>
                    <button
                      onClick={() => {
                        setTargetSessionId(s.id);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 rounded-md hover:bg-white/10"
                    >
                      <Trash2Icon
                        size={18}
                        className="text-red-500 cursor-pointer"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main pannel */}
        <AnimatePresence>
          <motion.section
            layout
            animate={{ width: showSidebar ? "calc(100% - 16rem)" : "100%" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="h-screen"
          >
            <div className="h-screen select1 relative">
              <div className="bg-[#1f1f1f] flex flex-col h-[inherit] w-[inherit] text-white">
                <header className="text-white select flex items-center justify-between w-fit">
                  <h1
                    onClick={() => setShowSidebar(true)}
                    className={`mx-[4vw] text-2xl cursor-pointer p-3 py-6 ${
                      showSidebar ? "hidden" : ""
                    }`}
                  >
                    ASTRA
                  </h1>
                </header>
                <div className="flex flex-col w-3/4 sm:w-1/2 md:w-1/3 mx-auto my-4">
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="p-4 w-full rounded-2xl text-[#ffe243] bg-[#121212] border-none outline-none"
                  />
                  {query && (
                    <div className="mt-1 flex-col flex max-h-96 overflow-y-auto bg-[#121212] rounded-2xl">
                      {searchResults.length > 0 ? (
                        searchResults.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => handlePastChatClick(session.id)}
                            className="p-3 text-left hover:bg-[#212121] rounded-md"
                          >
                            {session.title}
                          </button>
                        ))
                      ) : (
                        <p className="text-white p-3">No sessions found.</p>
                      )}
                    </div>
                  )}
                </div>
                <section className="flex-1 overflow-y-auto my-[6%] p-6 space-y-6 mx-[auto] no-scrollbar">
                  {messages.length === 0 ? (
                    <div className="text-center text-[#fff] mt-[14vw]">
                      <p className="text-5xl">
                        Start a{" "}
                        <span className="text-[#ffe243]">conversation!</span>
                      </p>
                      <p className="text-lg mt-5">
                        Ask me anything about your{" "}
                        <span className="text-[#ffe243]">studies</span>, and
                        I'll help you
                        <span className="text-[#ffe243]"> learn</span>.
                      </p>
                    </div>
                  ) : (
                    messages.map((m, index) => {
                      return (
                        <div
                          key={m.id}
                          className={`flex ${
                            m.role === "user" ? "justify-end" : "justify-start"
                          } px-6 sm:px-17 md:px-60`}
                        >
                          <div
                            className={`rounded-lg px-4 py-3 ${
                              m.role === "user"
                                ? "bg-[#121212] max-w-[75%]"
                                : "bg-none w-full"
                            } text-[#e5e4e4]`}
                          >
                            {m.file && (
                              <p className="text-sm text-gray-200 mb-1 flex items-center bg-[#333333] rounded-lg px-2 py-1 w-fit">
                                <span className="text-xl mr-2">📎</span>{" "}
                                {m.file}
                              </p>
                            )}
                            <MarkdownRenderer
                              content={autoBoldKeywords(m.content)}
                            />
                            <span className="text-xs opacity-70 mt-3 block">
                              {m.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </section>
                {error && (
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#2a0000] border border-red-700 text-[#ffb3b3] rounded-lg px-5 py-3 shadow-lg flex items-center gap-3 z-[999]">
                    <AlertTriangle className="text-red-500" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">Error</span>
                      <span className="text-xs">{error}</span>
                      {error.includes("credits") && (
                        <button
                          onClick={() => router.push("/price")}
                          className="ml-2 underline text-yellow-400"
                        >
                          View Plans
                        </button>
                      )}
                    </div>

                    <button onClick={() => setError("")}>
                      <X
                        className="text-red-400 hover:text-red-200"
                        size={18}
                      />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-center w-full absolute bottom-0">
                  <form
                    onSubmit={handleSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    className="bg-[#181818] p-2 rounded-2xl w-[55%]"
                  >
                    <div className="flex flex-col gap-5 items-center justify-center">
                      <div className="flex items-center justify-center w-full px-4 mt-2 min-h-fit">
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          // onKeyDown={handleKeyDown}
                          placeholder="Ask anything"
                          disabled={isLoading}
                          rows={1}
                          className="text-white placeholder-[#5c5c5c] bg-transparent text-xl flex-1 rounded-lg outline-none w-full resize-none overflow-y-auto max-h-[20vh]"
                        />
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <FileUploadArea
                          ref={fileUploaderRef}
                          key={sessionId}
                          sessionId={sessionId || ""}
                        />
                        <div>
                          <CustomDropdown marks={marks} setMarks={setMarks} />
                          <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="px-6 py-2 bg-transparent text-[#ffe243] rounded-lg font-semibold transition-opacity disabled:opacity-50"
                          >
                            {isLoading ? "..." : "Send"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>
      </main>
    </>
  );
}

export default ChatContent;
