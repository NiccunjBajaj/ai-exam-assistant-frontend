"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import Spline from "@splinetool/react-spline";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function NotesPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const { id } = useParams();
  const [notes, setNotes] = useState([]);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    if (!id) return;
    const fetchNotes = async () => {
      const res = await fetch(`${BACKEND_URL}/notes/by-session/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotes(data);
    };
    fetchNotes();
  }, [id, token]);

  const saveNote = useCallback(
    async (noteId, content) => {
      await fetch(`${BACKEND_URL}/notes/${noteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
    },
    [token]
  );

  const deleteNote = async (noteId) => {
    await fetch(`${BACKEND_URL}/study-sessions/${noteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    router.push("/study/notes");
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        notes.forEach((n) => saveNote(n.id, n.content));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [notes, saveNote]);

  const handleScrollText = () => {
    if (textareaRef.current && previewRef.current) {
      const ratio =
        textareaRef.current.scrollTop /
        (textareaRef.current.scrollHeight - textareaRef.current.clientHeight);
      previewRef.current.scrollTop =
        ratio *
        (previewRef.current.scrollHeight - previewRef.current.clientHeight);
    }
  };

  const handleScrollPre = () => {
    if (textareaRef.current && previewRef.current) {
      const ratio =
        previewRef.current.scrollTop /
        (previewRef.current.scrollHeight - previewRef.current.clientHeight);
      textareaRef.current.scrollTop =
        ratio *
        (textareaRef.current.scrollHeight - textareaRef.current.clientHeight);
    }
  };

  const autoBoldKeywords = (text) =>
    text.replace(/\b(important|note|tip)\b/gi, "**$1**");

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showDeleteModal) {
          setShowDeleteModal(false);
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showDeleteModal]);

  return (
    <>
      <div className="absolute top-[1vw] left-[2vw] bg-[#ffe243] hover:bg-[#606060] text-[#161616] rounded-[1vw] cursor-pointer">
        <Link
          href="/study/notes"
          className="text-[1.2vw] px-[0.5vw] flex items-center"
        >
          <ArrowLeft />
          Back
        </Link>
      </div>
      {/* <div className="fixed z-[-9999] w-full">
        <Spline scene="https://prod.spline.design/8UR40oDmhAS3NI8V/scene.splinecode" />
      </div> */}
      <main className="min-h-screen mx-auto noto bg-[#161616]">
        {notes.map((note) => (
          <h1
            key={`title-${note.id}`}
            className="text-6xl font-bold py-[0.5vw] w-fit mx-auto text-[#ffe243]"
          >
            {note.title || "Notes"}
          </h1>
        ))}

        {notes.length === 0 ? (
          <p className="text-gray-500 text-center">
            No Notes found for this set.
          </p>
        ) : (
          notes.map((note) => (
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
                      <h3 className="text-lg font-semibold mb-3">
                        Delete Note?
                      </h3>
                      <p className="text-sm mb-6 opacity-80">
                        Are you sure you want to delete this note permanently?
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
                            deleteNote(note.session_id);
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
              <div key={note.id} className="text-white">
                <h1 className="text-xl py-3 w-1/2 text-center font-bold">
                  Edit Here &darr;
                </h1>
                <div className="w-full grid grid-cols-2 gap-6">
                  <textarea
                    ref={textareaRef}
                    value={note.content}
                    onChange={(e) =>
                      setNotes((prev) =>
                        prev.map((n) =>
                          n.id === note.id
                            ? { ...n, content: e.target.value }
                            : n
                        )
                      )
                    }
                    onScroll={handleScrollText}
                    className="w-full p-4 px-10 outline-none rounded resize-none min-h-[35.5vw] bg-[#161616] backdrop-blur-[15px] text-[1.1rem] mod-scrollbar leading-[1.7] tracking-[-0.013rem] text-[#ffe243]"
                  />
                  <div
                    ref={previewRef}
                    onScroll={handleScrollPre}
                    className="w-full max-h-[35.5vw] p-4 px-10 text-[1.1rem] text-white bg-[#ffe3432d] backdrop-blur-[15px] rounded overflow-auto mod-scrollbar"
                  >
                    <MarkdownRenderer
                      content={autoBoldKeywords(note.content)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => saveNote(note.id, note.content)}
                    className="px-3 py-1 text-[#161616] bg-[#606060] hover:bg-[#ffe243] rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3 py-1  bg-[#606060] hover:bg-red-600 text-[#161616] rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          ))
        )}
      </main>
    </>
  );
}
