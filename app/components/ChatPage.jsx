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
  ProjectorIcon,
  SendHorizonal,
  Share2,
  MoreHorizontal,
  Upload,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import FloatingMenu from "./FloatingMenu";

function StreamingMessage({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const iRef = useRef(0);

  // adaptive speed (short answers feel snappier, long ones still smooth)
  const base = text.length < 120 ? 18 : text.length < 600 ? 14 : 10;

  useEffect(() => {
    if (!text) return;
    iRef.current = 0;
    setDisplayed("");

    // stream characters; make punctuation breathe a bit
    const tick = () => {
      if (iRef.current >= text.length) {
        onDone?.();
        return;
      }
      const nextChar = text[iRef.current++];
      setDisplayed((prev) => prev + nextChar);

      const slowDown =
        nextChar === "." || nextChar === "!" || nextChar === "?"
          ? 12
          : nextChar === "," || nextChar === ";"
          ? 6
          : 0;

      setTimeout(tick, base + slowDown);
    };

    const t = setTimeout(tick, base);
    return () => clearTimeout(t);
  }, [text, onDone]);

  return (
    <div className="relative">
      <MarkdownRenderer content={displayed} />
      <span className="inline-block w-2 h-5 bg-[#ffe343] ml-1 animate-pulse rounded-sm absolute -bottom-1"></span>
    </div>
  );
}

function ChatContent() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const { setCredits, fetchWithAuth } = useAuth();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [marks, setMarks] = useState(2);
  const [pastSessions, setPastSessions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [dropdownPos, setDropdownPos] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileUploaderRef = useRef(null);
  const menuRef = useRef(null);
  const isNewSession = useRef(false);
  const isSubmitting = useRef(false);
  const isFetchingMessages = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) setShowSidebar(true);
  });

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
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/rename-session/${id}`, {
        method: "PUT",
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
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/delete-session/${id}`, {
        method: "DELETE",
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

  const handleShare = async (id) => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/share-chat/${id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Share failed");
      const data = await res.json();
      setShareLink(`${window.location.origin}/shared-chat/${data.share_id}`);
      setShowShareModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch user sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/sessions`);
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

    if (isNewSession.current) {
      console.log("Skipping fetch - new session");
      return;
    }

    if (isFetchingMessages.current) return;
    isFetchingMessages.current = true;

    const fetchMessages = async () => {
      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/messages/${sessionId}`);
        const data = await res.json();

        const uniqueMessages = data.filter(
          (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
        );

        setMessages(
          uniqueMessages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
            streaming: false,
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
    isNewSession.current = false;
    setSessionId(null);
    setMessages([]);
    fileUploaderRef.current?.clearFile();
    setShowSidebar(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isSubmitting.current) return;

    isSubmitting.current = true;

    const inputValue = input;

    const userMessage = {
      id: crypto.randomUUID(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => {
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
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/chat`, {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          user_input: userMessage.content,
          marks,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const error = errorData.detail || errorData;
        if (error.error === "out_of_credits") {
          setError(
            error.message ||
              "You have run out of credits. Please upgrade or wait for daily refill."
          );
        } else {
          setError(error.message || "Something went wrong");
        }
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        return;
      }

      const data = await res.json();

      const botMessage = {
        id: crypto.randomUUID(),
        content: data.response,
        role: "bot",
        timestamp: new Date(),
        streaming: true,
      };

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

      setMessages((prev) => {
        const exists = prev.some(
          (m) => m.role === "bot" && m.content === botMessage.content
        );
        return exists ? prev : [...prev, botMessage];
      });

      if (data.credits_left !== undefined) {
        setCredits(data.credits_left);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err.message);
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
        if (showShareModal) {
          setShowShareModal(false);
        }
        if (openMenuId) {
          setOpenMenuId(null);
        }
        if (isMobile) {
          if (showSidebar) {
            setShowSidebar(false);
          }
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [
    showDeleteModal,
    showRenameModal,
    showShareModal,
    showSidebar,
    openMenuId,
  ]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        openMenuId &&
        !event.target.closest(".menu-container") &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openMenuId]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    fileUploaderRef.current?.handleFiles(e.dataTransfer.files);
  };

  return (
    <>
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="text-center text-[#e2e8f0]">
              <Upload size={64} />
              <p className="mt-4 text-2xl">Drop files to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
              className="bg-[#00141b] text-[#e2e8f0] p-6 rounded-2xl w-[90%] sm:w-[400px] shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-3">Delete Chat?</h3>
              <p className="text-sm mb-6 opacity-80">
                Are you sure you want to delete this chat permanently?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#0B1E26] hover:bg-gray-600"
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
              className="bg-[#00141b] text-[#e2e8f0] p-6 rounded-2xl w-[90%] sm:w-[400px] shadow-xl"
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
                className="w-full p-3 rounded-lg bg-[#00141b] border border-[#e2e8f0] text-[#ffe655] outline-none mb-5"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#0B1E26] hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRename(targetSessionId, newTitle);
                    setShowRenameModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#f1e596] text-black font-semibold hover:bg-[#ffe655]"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
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
              className="bg-[#00141b] text-[#e2e8f0] p-6 rounded-2xl w-[90%] sm:w-[400px] shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-3">Share Chat</h3>
              <p className="text-sm mb-4 opacity-80">
                Anyone with this link can view the chat.
              </p>
              <input
                type="text"
                readOnly
                value={shareLink}
                className="w-full p-3 rounded-lg bg-[#00141b] border border-[#e2e8f0] text-[#ffe655] outline-none mb-5"
                onFocus={(e) => e.target.select()}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#0B1E26] hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(shareLink)}
                  className="px-4 py-2 rounded-lg bg-[#f1e596] text-black font-semibold hover:bg-[#ffe655]"
                >
                  Copy Link
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Pannel */}
      <main
        className={`min-h-screen flex bg-[#00141b] select noto ${
          isMobile && showSidebar ? "overflow-hidden" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
      >
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ x: isMobile ? -window.innerWidth : -300 }}
              animate={{ x: 0 }}
              exit={{ x: isMobile ? -window.innerWidth : -300 }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
              className={`h-[100vh] ${
                isMobile ? "w-full fixed top-0 left-0 z-50" : "w-[15%]"
              } bg-[#0B1E26] p-4`}
            >
              <div className="flex items-center w-full justify-between mb-2 z-[999] no_scrollbar">
                <a
                  href="/"
                  className="text-5xl font-[mouse] tracking-wide text-center w-full"
                >
                  Proff
                </a>
                {isMobile && (
                  <button onClick={toggleSidebar} className="text-white">
                    <X size={24} />
                  </button>
                )}
              </div>
              <hr className="my-3 text-[#00141b]" />
              <button
                onClick={startNewChat}
                className="w-full mb-3 py-2 text-[1.2rem] text-left rounded-lg flex gap-2 hover:bg-[#f1e596] hover:text-[#000] transition-all duration-[0.3s] items-center"
              >
                <SquarePen size={20} /> New Chat
              </button>
              <hr className="mb-3 text-[#00141b]" />
              <h2 className="text-[1.2rem] text-white font-semibold mb-2">
                Past Chats
              </h2>
              <div className="min-h-[60vh] overflow-y-auto">
                {pastSessions.map((s) => (
                  <div
                    key={s.id}
                    className={`flex justify-between items-center rounded-lg mb-2 hover:bg-[#F1E596] hover:text-[#000] transition-all duration-[0.3s] ${
                      s.id === sessionId
                        ? "bg-[#F1E596] text-[#000]"
                        : "text-[#e2e8f0]"
                    }`}
                  >
                    <button
                      onClick={() => handlePastChatClick(s.id)}
                      className="block w-full text-left px-3 py-2 text-[1.02rem]"
                    >
                      {s.title}
                    </button>
                    <div className="relative menu-container">
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownPos({
                            top: rect.top,
                            left: rect.right + 10,
                          });
                          setOpenMenuId(openMenuId === s.id ? null : s.id);
                        }}
                        className="p-2 rounded-md hover:bg-black/10"
                      >
                        <MoreHorizontal size={20} className="cursor-pointer" />
                      </button>
                      {openMenuId === s.id && dropdownPos && (
                        <FloatingMenu position={dropdownPos} menuRef={menuRef}>
                          <button
                            onClick={() => {
                              handleShare(s.id);
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 w-full rounded-2xl text-left px-4 py-2 text-sm text-[#e2e8f0] hover:bg-[#F1E596] hover:text-[#000]"
                          >
                            <Share2 size={16} />
                            Share
                          </button>

                          <button
                            onClick={() => {
                              setTargetSessionId(s.id);
                              setNewTitle(s.title);
                              setShowRenameModal(true);
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 w-full rounded-2xl text-left px-4 py-2 text-sm text-[#e2e8f0] hover:bg-[#F1E596] hover:text-[#000]"
                          >
                            <PencilLine size={16} />
                            Rename
                          </button>

                          <button
                            onClick={() => {
                              setTargetSessionId(s.id);
                              setShowDeleteModal(true);
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 w-full rounded-2xl text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2Icon size={16} />
                            Delete
                          </button>
                        </FloatingMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main pannel */}
        <AnimatePresence>
          <motion.section
            layout
            animate={{
              width: showSidebar ? (isMobile ? "100%" : "85%") : "100%",
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="h-screen"
          >
            <div className="h-screen select1 relative">
              {sessionId && (
                <button
                  onClick={() => handleShare(sessionId)}
                  className={`p-2 flex items-center gap-1 absolute ${
                    isMobile ? "top-18.5 left-3" : "top-[1.3vw] left-[1vw]"
                  } rounded-md bg-[#ffe655] hover:bg-[#f1e596] text-[#00141b] cursor-pointer`}
                >
                  <Share2 size={15} /> {isMobile ? "" : "Share"}
                </button>
              )}
              <div className="bg-[#00141b] flex flex-col h-[inherit] w-[inherit] text-[#e2e8f0]">
                <header className="select flex items-center justify-between w-fit">
                  {isMobile && (
                    <button onClick={toggleSidebar} className="p-3 w-15">
                      <img
                        src="/smalllogo.svg"
                        alt="Beee"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                </header>
                <div className="flex flex-col w-3/4 sm:w-1/2 md:w-1/3 mx-auto my-4">
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="p-4 w-full rounded-2xl text-[#ffe655] bg-[#0b1e26] border-none outline-none"
                  />
                  {query && (
                    <div className="mt-1 flex-col flex max-h-96 overflow-y-auto bg-[#0b1e26] rounded-2xl">
                      {searchResults.length > 0 ? (
                        searchResults.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => handlePastChatClick(session.id)}
                            className="p-3 text-left hover:bg-[#f1e596] hover:text-[#000] rounded-md"
                          >
                            {session.title}
                          </button>
                        ))
                      ) : (
                        <p className="p-3">No sessions found.</p>
                      )}
                    </div>
                  )}
                </div>
                <section
                  className={`flex-1 overflow-y-auto ${
                    isMobile ? "p-4" : "p-6"
                  } space-y-6 no-scrollbar`}
                >
                  {messages.length === 0 || query ? (
                    <div
                      className={`${!query ? "block" : "hidden"} text-center ${
                        isMobile ? "mt-[20vw]" : "mt-[14vw]"
                      }`}
                    >
                      <p
                        className={`${
                          isMobile ? "text-3xl" : "text-5xl"
                        } text-[#e2e8f0]`}
                      >
                        Start a{" "}
                        <span className="text-[#ffe655]">conversation!</span>
                      </p>
                      <p className="text-lg mt-5">
                        Ask me anything about your{" "}
                        <span className="text-[#ffe655]">studies</span>, and
                        I'll help you
                        <span className="text-[#ffe655]"> learn</span>.
                      </p>
                    </div>
                  ) : (
                    messages.map((m, index) => {
                      const isLastBotMessage =
                        index === messages.length - 1 &&
                        m.role === "bot" &&
                        isLoading;

                      return (
                        <div
                          key={m.id}
                          className={`flex ${
                            m.role === "user" ? "justify-end" : "justify-start"
                          } ${isMobile ? "px-4" : "w-[55%]"} mb-30 mx-auto`}
                        >
                          <div
                            className={`rounded-lg px-4 py-3 ${
                              m.role === "user"
                                ? `bg-[#0B1E26] ${
                                    isMobile ? "max-w-[90%]" : "max-w-[100%]"
                                  }`
                                : "bg-none w-full"
                            } text-[#e2e8f0]`}
                          >
                            {m.file && (
                              <p className="text-sm text-gray-200 mb-1 flex items-center bg-[#333333] rounded-lg px-2 py-1 w-fit">
                                <span className="text-xl mr-2">📎</span>{" "}
                                {m.file}
                              </p>
                            )}

                            {m.role === "bot" && m.streaming ? (
                              <StreamingMessage
                                text={m.content}
                                onDone={() =>
                                  setMessages((prev) =>
                                    prev.map((msg) =>
                                      msg.id === m.id
                                        ? { ...msg, streaming: false }
                                        : msg
                                    )
                                  )
                                }
                              />
                            ) : (
                              <MarkdownRenderer
                                content={autoBoldKeywords(m.content)}
                              />
                            )}
                            <span
                              className={`text-xs opacity-70 ${
                                isMobile ? "mt-1" : "mt-3"
                              } block`}
                            >
                              {m.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-lg px-4 py-3">
                        <motion.div
                          className="flex space-x-2"
                          initial="start"
                          animate="end"
                          variants={{
                            start: {},
                            end: {
                              transition: {
                                staggerChildren: 0.2,
                              },
                            },
                          }}
                        >
                          <motion.div
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            variants={{
                              start: { y: "0%" },
                              end: { y: "100%" },
                            }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "easeInOut",
                            }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            variants={{
                              start: { y: "0%" },
                              end: { y: "100%" },
                            }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "easeInOut",
                            }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            variants={{
                              start: { y: "0%" },
                              end: { y: "100%" },
                            }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "easeInOut",
                            }}
                          />
                        </motion.div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </section>
                {error && (
                  <div
                    className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#2a0000] border border-red-700 text-[#ffb3b3] rounded-lg ${
                      isMobile ? "px-3 py-2 text-sm" : "px-5 py-3"
                    } shadow-lg flex items-center gap-3 z-[999]`}
                  >
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
                <div className="flex items-center justify-center absolute bottom-0 w-full">
                  <form
                    onSubmit={handleSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    className={`bg-[#0B1E26] p-2 rounded-t-2xl ${
                      isMobile ? "w-screen" : "w-[55%]"
                    }`}
                  >
                    <div className="flex flex-col gap-5 items-center justify-center">
                      <div className="flex items-center justify-center w-full px-4 mt-2 min-h-fit">
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Ask anything"
                          disabled={isLoading}
                          rows={1}
                          className={`text-[#e2e8f0] ${
                            isMobile ? "text-base" : "text-xl"
                          } flex-1 rounded-lg outline-none w-full resize-none overflow-y-auto max-h-[20vh]`}
                        />
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <FileUploadArea
                          ref={fileUploaderRef}
                          key={sessionId}
                          sessionId={sessionId || ""}
                          isDragging={isDragging}
                          setIsDragging={setIsDragging}
                        />
                        <div>
                          <CustomDropdown marks={marks} setMarks={setMarks} />
                          <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={`bg-[#00141b] hover:bg-[#0B1E26] text-[#ffe655] rounded-lg font-semibold transition-opacity disabled:opacity-50 ${
                              isMobile ? "px-4 py-2" : "px-6 py-2"
                            }`}
                          >
                            {isLoading ? <ProjectorIcon /> : <SendHorizonal />}
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
