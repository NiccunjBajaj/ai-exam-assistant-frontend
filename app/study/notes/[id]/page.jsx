"use client";

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import Spline from "@splinetool/react-spline";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ExplainPopup from "@/app/components/ExplainPopup";
import { useAuth } from "@/app/components/AuthContext";

export default function NotesPage() {
  const { fetchWithAuth } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const { id } = useParams();
  const [notes, setNotes] = useState([]);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchNotes = async () => {
      const res = await fetchWithAuth(`${BACKEND_URL}/notes/by-session/${id}`);
      const data = await res.json();
      setNotes(data);
    };
    fetchNotes();
  }, [id]);

  const saveNote = useCallback(async (noteId, content) => {
    await fetchWithAuth(`${BACKEND_URL}/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  }, []);

  const deleteNote = async (noteId) => {
    await fetchWithAuth(`${BACKEND_URL}/study-sessions/${noteId}`, {
      method: "DELETE",
    });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    router.push("/study/notes");
  };

  const handleDownloadDOCX = async (note) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/generate-docx`, {
      method: "POST",
      body: JSON.stringify({
        content: note.content,
        title: note.studysession?.title,
      }),
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.studysession?.title || "notes"}.docx`;
    a.click();
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
      <div
        className={`absolute ${
          isMobile ? "top-4 left-4" : "top-[1.4vw] left-[2vw]"
        } bg-[#ffe655] hover:bg-[#606060] text-[#00141b] rounded-[1vw] cursor-pointer`}
      >
        <Link
          href="/study/notes"
          className={`${
            isMobile ? "text-lg px-2" : "text-[1.2vw] px-[0.5vw]"
          } flex items-center`}
        >
          <ArrowLeft />
          Back
        </Link>
      </div>
      {/* <div className="fixed z-[-9999] w-full">
        <Spline scene="https://prod.spline.design/8UR40oDmhAS3NI8V/scene.splinecode" />
      </div> */}
      <main className="min-h-screen mx-auto noto bg-[#00141b]">
        {notes.map((note) => (
          <h1
            key={`title-${note.id}`}
            className={`${
              isMobile ? "text-4xl" : "text-6xl"
            } font-bold py-[0.5vw] w-fit mx-auto text-[#ffe655]`}
          >
            {note.studysession.title}
          </h1>
        ))}

        {notes.length === 0 ? (
          <p className="text-[#e2e8f0] text-center">
            No Notes found for this set.
          </p>
        ) : (
          notes.map((note) => (
            <Fragment key={note.id}>
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
                        Delete Note?
                      </h3>
                      <p className="text-sm mb-6 opacity-80">
                        Are you sure you want to delete this note permanently?
                      </p>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowDeleteModal(false)}
                          className="px-4 py-2 rounded-lg bg-[#0b1e26] hover:bg-gray-600"
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
              <div key={note.id} className="text-[#e2e8f0]">
                <h1
                  className={`text-xl py-3 ${
                    isMobile ? "w-full" : "w-1/2"
                  } text-center font-bold`}
                >
                  Edit Here &darr;
                </h1>
                <div
                  className={`w-full ${
                    isMobile ? "flex flex-col" : "grid grid-cols-2"
                  } gap-6`}
                >
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
                    className={`w-full p-4 px-10 outline-none rounded resize-none ${
                      isMobile ? "min-h-[40vh]" : "min-h-[35.5vw]"
                    } bg-[#0b1e26] backdrop-blur-[15px] text-[1.1rem] mod-scrollbar leading-[1.7] tracking-[-0.013rem] text-[#e2e8f0]`}
                  />
                  <div
                    ref={previewRef}
                    onScroll={handleScrollPre}
                    className={`w-full ${
                      isMobile ? "max-h-[40vh]" : "max-h-[35.5vw]"
                    } p-4 px-10 backdrop-blur-[15px] rounded overflow-auto mod-scrollbar`}
                  >
                    <MarkdownRenderer
                      content={autoBoldKeywords(note.content)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => saveNote(note.id, note.content)}
                    className={`${
                      isMobile ? "px-4 py-2 text-base" : "px-3 py-1"
                    } text-[#00141b] bg-[#606060] hover:bg-[#ffe655] rounded`}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className={`${
                      isMobile ? "px-4 py-2 text-base" : "px-3 py-1"
                    } bg-[#606060] hover:bg-red-600 text-[#00141b] rounded`}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleDownloadDOCX(note)}
                    className={`${
                      isMobile ? "px-4 py-2 text-base" : "px-3 py-1"
                    } text-[#00141b] bg-[#606060] hover:bg-[#ffe655] rounded`}
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedText({
                        text: note.content,
                        noteId: note.id,
                        noteTitle: note.studysession.title,
                        // userId: localStorage.getItem("access_token"), // assuming you store it after login
                      })
                    }
                    className={`${
                      isMobile ? "px-4 py-2 text-base" : "px-3 py-1"
                    } text-[#00141b] bg-[#f2e586] hover:bg-[#ffe655] rounded`}
                  >
                    Explain
                  </button>
                </div>
              </div>
            </Fragment>
          ))
        )}
        {selectedText && (
          <ExplainPopup
            key={selectedText.noteId}
            text={selectedText.text}
            noteId={selectedText.noteId}
            noteTitle={selectedText.noteTitle}
            onClose={() => setSelectedText(null)}
          />
        )}
      </main>
    </>
  );
}
