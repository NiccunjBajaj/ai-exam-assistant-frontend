"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import StudyNav from "@/app/components/StudyNav";

export default function QuizFromFilePage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [marks, setMarks] = useState(5);
  const [mode, setMode] = useState("short");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

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

    const res = await fetch(`${BACKEND_URL}/upload-file`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    setText(data.text);
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);

    const res = await fetch(`${BACKEND_URL}/generate-quiz`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
      <StudyNav />
      <main className="p-6 mx-auto overflow-hidden">
        <div className="mt-[4vw]">
          <h1 className="text-8xl font-bold mb-6 text-center">
            Generate <span className="text-[#ffe243]">Quiz</span> from File
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
              className={`p-6 pr-10 text-center rounded-full hover:bg-[#606060] bg-[#ffe34385] text-[#161616] hover:text-black transition-all duration-[.4s] text-7xl mt-[8vw] ${
                text ? "hidden" : ""
              } uppercase w-fit ${loading ? "opacity-5" : ""}`}
            >
              📎Upload File
            </button>
            {loading && <p className="text-3xl mt-6">⏳ Processing...</p>}
          </div>

          {text && (
            <div className="mt-[6vw] space-y-4 w-1/2 mx-auto text-[white] text-xl">
              <input
                type="text"
                placeholder="Enter quiz title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 outline-none rounded bg-[#222222] text-[#ffe243]"
              />
              <div className="flex gap-6 justify-stretch">
                <select
                  className="w-1/3 p-2 outline-none rounded bg-[#222222]"
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
                  className="w-1/3 p-4 outline-none rounded bg-[#222222]"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="short">Answer Type</option>
                  <option value="mcq">Multiple Choice</option>
                </select>

                <button
                  className="text-[#161616] bg-[#606060] hover:bg-[#ffe243] px-4 py-2 rounded w-1/3"
                  onClick={handleGenerate}
                >
                  Generate Quiz
                </button>
              </div>

              <textarea
                className="w-full mt-4 p-4 outline-none rounded bg-[#222222] text-sm"
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
