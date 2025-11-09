"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import StudyNav from "@/app/components/StudyNav";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/app/components/AuthContext";

export default function QuizFromFilePage() {
  const { fetchWithAuth } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [marks, setMarks] = useState(5);
  const [mode, setMode] = useState("short");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleUploadClick = () => inputRef.current?.click();

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    setLoading(true);

    const formData = new FormData();
    formData.append("file", selected);
    formData.append("session_id", "quiz-from-file");

    const res = await fetchWithAuth(`${BACKEND_URL}/upload-file`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setText(data.text);
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);

    const res = await fetchWithAuth(`${BACKEND_URL}/generate-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_input: text,
        source: "file",
        file_name: file?.name || "Uploaded Document",
        title,
        marks,
        mode,
      }),
    });

    const data = await res.json();
    router.push(`/study/quiz/${data.session_id}`);
  };

  return (
    <>
      <div
        className={`absolute ${
          isMobile ? "top-4 left-4" : "top-[1.3vw] left-[2vw]"
        } bg-[#ffe655] hover:bg-[#606060] text-[#00141b] rounded-[1vw] cursor-pointer`}
      >
        <Link
          href="/study/quiz"
          className={`${
            isMobile ? "text-lg px-2" : "text-[1.2vw] px-[0.5vw]"
          } flex items-center`}
        >
          <ArrowLeft />
          Back
        </Link>
      </div>
      <main className="p-6 mx-auto overflow-hidden">
        <div className="mt-[7vw]">
          <h1
            className={`${
              isMobile ? "text-5xl" : "text-8xl"
            } font-bold mb-6 text-center`}
          >
            Generate <span className="text-[#ffe655]">Quiz</span> from File
          </h1>

          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            hidden
            ref={inputRef}
            onChange={handleFileChange}
          />
          <div className="flex flex-col justify-center items-center">
            <button
              onClick={handleUploadClick}
              className={`flex items-center gap-3 p-6 pr-10 text-center rounded-full hover:bg-[#f1e596] bg-[#ffe655] text-[#00141b] transition-all duration-[.4s] ${
                isMobile ? "text-4xl mt-12" : "text-7xl mt-[8vw]"
              } ${-text ? "hidden" : ""} uppercase w-fit ${
                loading ? "opacity-5" : ""
              }`}
            >
              <Upload size={isMobile ? 30 : 50} /> Upload File
            </button>
            {loading && <p className="text-3xl mt-6">⏳ Processing...</p>}
          </div>

          {text && (
            <div
              className={`mt-[6vw] space-y-4 ${
                isMobile ? "w-full" : "w-1/2"
              } mx-auto text-[white] text-xl`}
            >
              <input
                type="text"
                placeholder="Enter quiz title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 outline-none rounded bg-[#0b1e26] text-[#ffe655]"
              />
              <div
                className={`flex gap-6 ${
                  isMobile ? "flex-col" : "justify-stretch"
                }`}
              >
                <select
                  className={`p-2 outline-none rounded bg-[#0b1e26] ${
                    isMobile ? "w-full" : "w-1/3"
                  }`}
                  value={marks}
                  onChange={(e) => setMarks(parseInt(e.target.value))}
                >
                  <option value={2}>2-marks quiz</option>
                  <option value={5}>5-marks quiz</option>
                  <option value={10}>10-marks quiz</option>
                  <option value={10}>150-words quiz</option>
                  <option value={10}>250-words quiz</option>
                </select>

                <select
                  className={`p-4 outline-none rounded bg-[#0b1e26] ${
                    isMobile ? "w-full" : "w-1/3"
                  }`}
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="answer">Answer Type</option>
                  <option value="mcq">Multiple Choice</option>
                </select>

                <button
                  className={`text-[#00141b] bg-[#606060] hover:bg-[#ffe655] px-4 py-2 rounded ${
                    isMobile ? "w-full" : "w-1/3"
                  }`}
                  onClick={handleGenerate}
                >
                  Generate Quiz
                </button>
              </div>

              <textarea
                className="w-full mt-4 p-4 outline-none rounded bg-[#0b1e26] text-sm"
                rows={10}
                value={text}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
