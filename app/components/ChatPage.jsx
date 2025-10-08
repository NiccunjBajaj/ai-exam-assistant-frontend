"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import AuthWrapper from "../components/AuthWrapper";
import FileUploadArea from "../components/FileUploader";
import CustomDropdown from "../components/CustomDropdown";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash.debounce";
import { PencilLine, SquarePen, Trash2Icon } from "lucide-react";

function ChatContent() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearched, setIsSearched] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [marks, setMarks] = useState(2);
  const [pastSessions, setPastSessions] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileUploaderRef = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const startNewChat = () => {
    const newId = uuidv4();
    setSessionId(newId);
    setShowSidebar(true);
    localStorage.setItem("current_session_id", newId);
    setMessages([]);
    fileUploaderRef.current?.clearFile();
  };

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

  const handleRename = async (id) => {
    const newTitle = prompt("Enter new chat name:");
    if (!newTitle?.trim()) return;

    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://localhost:8000/rename-session/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!res.ok) throw new Error("Rename failed");

      setPastSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this chat?")) return;

    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://localhost:8000/delete-session/${id}`, {
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

  useEffect(() => {
    const stored = localStorage.getItem("current_session_id");
    const id = stored || uuidv4();
    if (!stored) localStorage.setItem("current_session_id", id);
    setSessionId(id);
  }, []);

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPastSessions(await res.json());
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`http://localhost:8000/messages/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMessages(
          data.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
        );
        fileUploaderRef.current?.clearFile();
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();
  }, [sessionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !sessionId) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fileName = fileUploaderRef.current?.getFileName();

    const userMessage = {
      id: uuidv4(),
      content: input,
      role: "user",
      timestamp: new Date(),
      ...(fileName ? { file: fileName } : {}),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const sesOk = await fetch(
        `http://localhost:8000/session-exists/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((r) => r.json());

      if (!sesOk.exists) {
        const title =
          prompt("📝 Name your new chat")?.trim() ||
          `Chat on ${new Date().toLocaleString()}`;
        await fetch("http://localhost:8000/create-session", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: sessionId, title }),
        });
      }

      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_input: input,
          marks,
        }),
      });

      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content: data.response,
          role: "bot",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      fileUploaderRef.current?.clearFile();
    }
  };

  const handlePastChatClick = (id) => {
    setSessionId(id);
    setShowSidebar(true);
  };

  return (
    <main className="min-h-screen flex bg-[#161616] select noto">
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="h-[100vh] w-64 bg-[#121212] p-4"
          >
            <div className="text-white flex items-center w-full justify-between mb-2 z-[999] no_scrollbar">
              <a href="/" className="text-2xl opacity-0">
                ASTRA
              </a>
            </div>
            <hr className="my-3 text-[#ffe243]" />
            <button
              onClick={startNewChat}
              className="w-full mb-3 py-2 bg-[#121212] text-left text-white rounded-lg flex gap-2 hover:bg-[#ffe34385] transition-all duration-[0.3s]"
            >
              <SquarePen /> New Chat
            </button>
            <hr className="mb-3 text-[#ffe243]" />
            <h2 className="text-xl text-white font-semibold mb-2">
              Past Chats
            </h2>
            {pastSessions.map((s) => (
              <div
                key={s.id}
                className={`flex justify-between rounded-lg mb-2 hover:bg-[#ffe34385] transition-all duration-[0.3s] ${
                  s.id === sessionId ? "bg-[#ffe34385]" : "bg-[#121212]"
                }`}
              >
                <button
                  onClick={() => handlePastChatClick(s.id)}
                  className="text-[#ffe243] block w-full text-left px-3 py-2"
                >
                  {s.title}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => handleRename(s.id)}>
                    <PencilLine className="text-white cursor-pointer" />
                  </button>
                  <button onClick={() => handleDelete(s.id)}>
                    <Trash2Icon className="text-red-500 cursor-pointer" />
                  </button>
                </div>
              </div>
            ))}
          </motion.aside>
        )}
      </AnimatePresence>
      <AnimatePresence>
        <motion.section
          layout
          animate={{ width: showSidebar ? "calc(100% - 16rem)" : "100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="h-screen"
        >
          <div className="h-screen select1 relative">
            <div className="bg-[#161616] flex flex-col h-[inherit] w-[inherit] text-white">
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
              <div className="w-1/4 flex flex-col fixed top-[1vw] left-[58vw] transform -translate-x-1/2">
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
              <section className="flex-1 overflow-y-auto mt-[6%] p-6 space-y-6 mx-[auto] no-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center text-[#fff] mt-[14vw]">
                    <p className="text-5xl">
                      Start a{" "}
                      <span className="text-[#ffe243]">conversation!</span>
                    </p>
                    <p className="text-lg mt-5">
                      Ask me anything about your{" "}
                      <span className="text-[#ffe243]">studies</span>, and I'll
                      help you
                      <span className="text-[#ffe243]"> learn</span>.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex px-[18vw] ${
                        m.role === "user"
                          ? "justify-end"
                          : "justify-center w-full"
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          m.role === "user"
                            ? "bg-[#121212] max-w-[75%]"
                            : "bg-none w-full text-justify"
                        } text-[#e5e4e4]`}
                      >
                        {m.file && (
                          <p className="text-sm text-gray-200 mb-1 flex items-center bg-[#333333] rounded-lg px-2 py-1 w-fit">
                            <span className="text-xl mr-2">📎</span> {m.file}
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
                  ))
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
                <div className="px-6 py-2 bg-red-100 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="flex items-center justify-center">
                <form
                  onSubmit={handleSubmit}
                  className="bg-[#121212] p-2 rounded-xl mb-6 w-1/2"
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
                          Send
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
  );
}

export default ChatContent;
