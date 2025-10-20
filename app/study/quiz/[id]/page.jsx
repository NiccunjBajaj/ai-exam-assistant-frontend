"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Spline from "@splinetool/react-spline";
import Link from "next/link";

export default function QuizPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const { id } = useParams();
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [canRetryPartial, setCanRetryPartial] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;

      const res = await fetch(`${BACKEND_URL}/quizzes/by-session/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setQuiz(data);
      setAnswers(Array(data.length).fill(""));
    };

    fetchQuiz();
  }, [id, token]);

  const handleOptionSelect = (index, optionIndex) => {
    const updated = [...answers];
    updated[index] = String.fromCharCode(65 + optionIndex);
    setAnswers(updated);
  };

  const handleTextChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const evaluateAnswer = async (question, correctAnswer, userAnswer, marks) => {
    const res = await fetch(`${BACKEND_URL}/evaluate-answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question,
        correct_answer: correctAnswer,
        user_answer: userAnswer,
        marks,
      }),
    });

    return await res.json();
  };

  const handleSubmit = async () => {
    setLoading(true);
    const tempResults = [];

    for (let i = 0; i < quiz.length; i++) {
      const q = quiz[i];
      const userInput = answers[i] || "";

      if (q.type === "mcq") {
        const selectedIndex = userInput.charCodeAt(0) - 65;
        const correct = q.options?.[selectedIndex] === q.correct_option;
        tempResults.push({
          question: q.question,
          userAnswer: userInput,
          verdict: correct ? "Correct" : "Incorrect",
          explanation: `Correct answer: ${q.correct_option}`,
        });
      } else {
        const evalResult = await evaluateAnswer(
          q.question,
          q.correct_answer || "",
          userInput,
          q.marks || 5
        );
        tempResults.push({
          question: q.question,
          userAnswer: userInput,
          verdict: evalResult.verdict,
          explanation: evalResult.explanation,
          correct_ans: evalResult.correct_ans,
        });
      }
    }

    setResults(tempResults);
    setShowResult(true);
    setLoading(false);

    const payload = quiz.map((q, i) => ({
      session_id: id,
      question_id: q.id,
      user_answer: answers[i],
      verdict: tempResults[i]?.verdict || "Unknown",
      explanation: tempResults[i]?.explanation || "",
      correct_ans: tempResults[i]?.correct_ans || "",
    }));

    try {
      await fetch(`${BACKEND_URL}/quiz-attempts/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const statusRes = await fetch(`${BACKEND_URL}/quiz/${id}/draft-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const status = await statusRes.json();
      setCanRetryPartial(status.can_retry_partial);
    } catch (err) {
      console.error("⚠️ Save error:", err);
    }
  };

  const handleRetryIncorrect = () => {
    const retried = results
      .map((r, i) => (r.verdict !== "Correct" ? quiz[i] : null))
      .filter((q) => q !== null);

    setQuiz(retried);
    setAnswers(Array(retried.length).fill(""));
    setResults([]);
    setShowResult(false);
    setLoading(false);
    setCurrentIndex(0);
  };

  return (
    <>
      {/* <div className="fixed z-[-9999] w-full">
        <Spline scene="https://prod.spline.design/8UR40oDmhAS3NI8V/scene.splinecode" />
      </div> */}
      <div className="absolute top-[1vw] left-[2vw] bg-[#ffe243] hover:bg-[#606060] text-[#161616] rounded-[1vw] cursor-pointer">
        <Link
          href="/study/quiz"
          className="text-[1.2vw] px-[0.5vw] flex items-center"
        >
          <ArrowLeft />
          Back
        </Link>
      </div>
      <main className="h-screen w-screen bg-[#161616] select1 noto">
        <div className="max-w-4xl mx-auto p-6 pt-[4vw]">
          <h1 className="text-7xl font-bold mb-6 text-center text-[#ffe243]">
            Quiz Attempt
          </h1>

          {!showResult ? (
            <div className="mt-[4vw]">
              {quiz.length > 0 && (
                <div className="p-4 bg-[#313131] rounded-lg">
                  <p className="mb-2 text-2xl flex flex-col">
                    <span className="font-[700] text-[#ffe243] text-2xl w-fit mb-2 pb-2">
                      Q{currentIndex + 1} of {quiz.length}
                    </span>
                    <span className="w-fit pb-2">
                      {quiz[currentIndex].question}
                    </span>
                  </p>

                  {quiz[currentIndex].type === "mcq" &&
                    quiz[currentIndex].options?.length === 4 && (
                      <div className="space-y-2 text-[#e8e7e7]">
                        {quiz[currentIndex].options.map((opt, i) => {
                          const label = String.fromCharCode(65 + i);
                          return (
                            <label key={i} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`q-${currentIndex}`}
                                checked={answers[currentIndex] === label}
                                onChange={() =>
                                  handleOptionSelect(currentIndex, i)
                                }
                                className="bg-[#222222]"
                              />
                              <span className="mr-2 text-lg">
                                {label}.<span className="ml-2">{opt}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                  {quiz[currentIndex].type === "short" && (
                    <textarea
                      className="w-full outline-none bg-[#272727] text-[#ffe243] rounded p-2 mt-2 text-xl resize-none"
                      rows={4}
                      placeholder="Write your answer..."
                      value={answers[currentIndex]}
                      onChange={(e) =>
                        handleTextChange(currentIndex, e.target.value)
                      }
                    />
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                  disabled={currentIndex === 0}
                  className="border rounded p-2 disabled:opacity-50 text-[#ffe243] cursor-pointer"
                >
                  <ArrowLeft size={25} />
                </button>

                {currentIndex < quiz.length - 1 ? (
                  <button
                    onClick={() =>
                      setCurrentIndex((i) => Math.min(i + 1, quiz.length - 1))
                    }
                    className="border rounded p-2 text-[#ffe243] cursor-pointer"
                  >
                    <ArrowRight size={25} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 text-[#161616] bg-[#606060] hover:bg-[#ffe243] rounded"
                  >
                    {loading ? "Evaluating..." : "Submit"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-4">📊 Quiz Results</h2>
              <div className="p-4 rounded bg-[#222222] text-[#aeadad] font-medium mb-6">
                🧾 You got{" "}
                {results.filter((r) => r.verdict === "Correct").length} out of{" "}
                {results.length} correct (
                {results.length > 0
                  ? Math.round(
                      (results.filter((r) => r.verdict === "Correct").length /
                        results.length) *
                        100
                    )
                  : 0}
                % )
              </div>

              <ul className="space-y-4">
                {results.map((r, index) => (
                  <li key={index} className="p-4 rounded bg-[#3d3d3d]">
                    <p className="font-medium text-lg">
                      Q{index + 1}: {r.question}
                    </p>
                    <hr className="my-[0.5vw]" />
                    <p className="text-lg text-[#a6a6a6] mt-1">
                      <span className="font-bold text-[#fff]">Your Answer</span>
                      : {r.userAnswer}
                    </p>
                    <hr className="my-[0.5vw]" />
                    <p
                      className={`mt-1 font-semibold ${
                        r.verdict === "Correct"
                          ? "text-green-600"
                          : r.verdict === "Partially Correct"
                          ? "text-yellow-300"
                          : "text-red-500"
                      }`}
                    >
                      Verdict: {r.verdict}
                    </p>
                    <hr className="my-[0.5vw]" />
                    <p className="text-lg text-[#a6a6a6] mt-1">
                      <span className="font-bold text-[#fff]">Explanation</span>
                      : {r.explanation}
                    </p>
                    <hr className="my-[0.5vw]" />
                    <p className="text-lg text-[#a6a6a6] mt-1">
                      <span className="font-bold text-[#fff]">
                        Correct Answer
                      </span>
                      : {r.correct_ans}
                    </p>
                  </li>
                ))}
              </ul>

              {canRetryPartial ? (
                <button
                  onClick={handleRetryIncorrect}
                  className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded"
                >
                  🔁 Retry Incorrect
                </button>
              ) : (
                <div className="text-sm text-red-600 font-medium">
                  You got more than 3 wrong answers. Please revise and retry the
                  full quiz.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
