"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Spline from "@splinetool/react-spline";
import { PencilLine, Trash2Icon } from "lucide-react";
import StudyNav from "@/app/components/StudyNav";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/components/AuthContext";

export default function QuizHomePage() {
  const { fetchWithAuth } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState([]);
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const fetchFlashcardSessions = async () => {
    const res = await fetchWithAuth(`${BACKEND_URL}/study-sessions?type=quiz`);
    const data = await res.json();
    setSessions(data);
  };
  useEffect(() => {
    fetchFlashcardSessions();
  }, []);

  const deleteSession = async (sessionId) => {
    try {
      await fetchWithAuth(`${BACKEND_URL}/study-sessions/${sessionId}`, {
        method: "DELETE",
      });

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Error deleting session", err);
      alert("Failed to delete note");
    }
  };

  const handleRename = async (id, title) => {
    if (!title?.trim()) return;
    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/study-rename-session/${id}`,
        {
          method: "PUT",
          body: JSON.stringify({ title }),
        }
      );
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title } : s))
      );
      if (!res.ok) throw new Error("Rename failed");
    } catch (err) {
      setError(err.message);
    }
  };

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
      <StudyNav />
      {/* <div className="fixed z-[-9999] w-full">
        <Spline scene="https://prod.spline.design/c6NMNa7uwCUsZ6kh/scene.splinecode" />
      </div> */}
      <main className="min-h-screen pt-[5vw] bg-[#00141b]">
        <h1
          className={`${
            isMobile ? "text-6xl" : "text-8xl"
          } font-bold text-center mb-6 text-[#ffe655]`}
        >
          Quiz
        </h1>
        <div
          className={`flex flex-col gap-4 ${isMobile ? "px-4" : "px-[15vw]"}`}
        >
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`mx-auto px-4 py-3 ${
              isMobile ? "w-full" : "w-1/3"
            } bg-[#0B1E26] rounded-md outline-none text-[#ffe655]`}
          />

          <div
            className={`grid ${
              isMobile ? "grid-cols-1" : "grid-cols-4"
            } gap-4 max-h-[65vh] overflow-auto p-4 hover_target mod-scrollbar rounded-lg`}
          >
            {filteredSessions.map((s) => {
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
                          className="bg-[#00141b] text-[#e2e8f0] p-6 rounded-2xl w-[90%] sm:w-[400px] shadow-xl"
                        >
                          <h3 className="text-lg font-semibold mb-3">
                            Delete Chat?
                          </h3>
                          <p className="text-sm mb-6 opacity-80">
                            Are you sure you want to delete this chat
                            permanently?
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
                  {/* Rename */}
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
                          <h3 className="text-lg font-semibold mb-3">
                            Rename Chat
                          </h3>
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

                  <div
                    key={s.id}
                    className="flex flex-col justify-end rounded-lg p-2 shadow hover:shadow-md cursor-pointer text-[#ffe655] bg-[#0B1E26] hover:scale-[1.04] backdrop-blur-[3px] mod-scrollbar transition-all duration-[0.4s]"
                  >
                    <div onClick={() => router.push(`/study/quiz/${s.id}`)}>
                      <div className="bg-black/50 p-2 rounded-md mt-2">
                        <h2 className="text-2xl font-semibold truncate">
                          {s.title}
                        </h2>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setTargetSessionId(s.id);
                          setNewTitle(s.title);
                          setShowRenameModal(true);
                        }}
                        className="p-2 rounded-md hover:bg-white/30"
                      >
                        <PencilLine
                          size={20}
                          className="text-white cursor-pointer"
                        />
                      </button>
                      <button
                        onClick={() => {
                          setTargetSessionId(s.id);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 rounded-md hover:bg-white/30"
                      >
                        <Trash2Icon
                          size={20}
                          className="text-red-600 cursor-pointer"
                        />
                      </button>
                    </div>
                  </div>
                </>
              );
            })}

            {filteredSessions.length === 0 && (
              <p className="text-gray-500">No Quiz found.</p>
            )}
          </div>
        </div>
        <div className={`mx-auto w-fit mt-[2vw]`}>
          <Link
            href={"/study/quiz/from_file"}
            className="p-3 text-center rounded-full hover:bg-[#f1e596] bg-[#ffe655] text-[#00141b] hover:text-black transition-all duration-[.4s]"
          >
            From-File &#8599;
          </Link>

          <Link
            href={"/study/quiz/from-chat"}
            className={`p-3 text-center rounded-full hover:bg-[#f1e596] bg-[#ffe655] text-[#00141b] hover:text-black transition-all duration-[.4s] mx-3`}
          >
            From-Chat &#8599;
          </Link>
          <Link
            href={"/study/quiz/from-study"}
            className="p-3 text-center rounded-full hover:bg-[#f1e596] bg-[#ffe655] text-[#00141b] hover:text-black transition-all duration-[.4s]"
          >
            From-Study &#8599;
          </Link>
        </div>
      </main>
    </>
  );
}
