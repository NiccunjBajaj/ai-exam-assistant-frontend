"use client";
import { useEffect, useRef, useState } from "react";
import { X, Play, Pause } from "lucide-react";
import { getTTS } from "@/lib/tts";

// Hoisted function declaration (safe to call from effects)
function findWordIndex(ts, t) {
  if (!ts || !ts.length) return 0;
  let lo = 0,
    hi = ts.length - 1,
    ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (t >= ts[mid].time) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (t > (ts[ans]?.end ?? Infinity) && ans < ts.length - 1) ans++;
  return ans;
}

// Build synthetic timings when backend didn't return any.
// We weight by word length so longer words get slightly more time.
function buildSyntheticTimingsFromText(text, totalSeconds) {
  const tokens = text.replace(/\n+/g, " ").split(/\s+/).filter(Boolean);
  const weights = tokens.map((t) => {
    const core = t.replace(/[^A-Za-z0-9]/g, "");
    let w = core.length || 1;
    if (w > 8) w = 8 + (w - 8) * 0.3; // compress very long words
    if (/[.,;:]$/.test(t)) w += 2.5; // medium pause
    if (/[?!]$/.test(t)) w += 3; // longer pause
    return w;
  });
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;

  const timings = [];
  let acc = 0;
  for (let i = 0; i < tokens.length; i++) {
    const start = (acc / totalW) * totalSeconds;
    acc += weights[i];
    const end = (acc / totalW) * totalSeconds;
    timings.push({ text: tokens[i], time: start, end });
  }
  return { timings, tokens };
}

export default function ExplainPopup({ text, noteId, noteTitle, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [timings, setTimings] = useState([]); // [{text, time, end}]
  const [words, setWords] = useState([]); // tokens to render
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeout = useRef(null);

  const audioRef = useRef(null);
  const textRef = useRef(null);
  const timingsRef = useRef([]);
  const cleanedTextRef = useRef(""); // keep cleaned_text to synthesize timings if needed
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    let revoked = false;
    async function fetchTTS() {
      try {
        setIsLoading(true);
        const {
          audio,
          cleaned_text,
          timings: serverTimings,
        } = await getTTS(text, noteId, token);

        // Create object URL for audio
        const blob = new Blob(
          [Uint8Array.from(atob(audio), (c) => c.charCodeAt(0))],
          { type: "audio/wav" }
        );
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        cleanedTextRef.current = cleaned_text;

        if (serverTimings && serverTimings.length) {
          // Use real timings
          setTimings(serverTimings);
          timingsRef.current = serverTimings;
          setWords(serverTimings.map((t) => t.text));
        } else {
          // We'll build synthetic timings after we know audio duration (in onloadedmetadata)
          setTimings([]);
          timingsRef.current = [];
          setWords([]); // set in metadata once we compute
        }
      } catch (e) {
        console.error("TTS fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTTS();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (audioUrl && !revoked) {
        URL.revokeObjectURL(audioUrl);
        revoked = true;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, noteId]);

  // Setup audio + listeners
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoaded = () => {
      const d = audio.duration || 0;
      setDuration(d);
      setProgress(0);
      setCurrentTime(0);
      setCurrentWordIndex(0);
      setIsPlaying(false); // no autoplay

      // If backend didn't supply timings, synthesize them now with the real duration
      if (!timingsRef.current.length && cleanedTextRef.current) {
        const { timings: synth, tokens } = buildSyntheticTimingsFromText(
          cleanedTextRef.current,
          d || 1
        );
        setTimings(synth);
        timingsRef.current = synth;
        setWords(tokens);
      }
    };

    const onTimeUpdate = () => {
      const a = audioRef.current;
      if (!a || !a.duration) return;

      const t = a.currentTime;
      setCurrentTime(t);
      setProgress((t / a.duration) * 100);

      const ts = timingsRef.current;
      if (!ts?.length) return;

      const idx = findWordIndex(ts, t);
      if (idx !== currentWordIndex) {
        setCurrentWordIndex(idx);

        // only auto-scroll if user isn’t scrolling manually right now
        if (!isUserScrollingRef.current) {
          const container = textRef.current;
          const span = container?.children?.[idx];
          if (container && span) {
            const containerRect = container.getBoundingClientRect();
            const spanRect = span.getBoundingClientRect();

            if (
              spanRect.top < containerRect.top + 20 ||
              spanRect.bottom > containerRect.bottom - 20
            ) {
              span.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
              });
            }
          }
        }
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  const handlePlayPause = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.playbackRate = playbackRate;
      a.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const newProgress = Number(e.target.value);
    const newTime = (newProgress / 100) * duration;
    a.currentTime = newTime;
    setProgress(newProgress);
    setCurrentTime(newTime);
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatTime = (t) => {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-[#0000005b] backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-[#0b1e26] rounded-2xl w-[90%] md:w-[50%] p-6 shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer"
        >
          <X size={22} />
        </button>

        <h2 className="text-[2rem] font-semibold mb-3 text-[#f1e596]">
          Explaining {noteTitle}
        </h2>

        {isLoading ? (
          <p className="text-gray-500">Preparing explanation...</p>
        ) : (
          <>
            {/* Highlighted text */}
            <div
              ref={textRef}
              onScroll={() => {
                // Immediately mark that the user is scrolling (no React lag)
                isUserScrollingRef.current = true;
                clearTimeout(userScrollTimeout.current);
                userScrollTimeout.current = setTimeout(() => {
                  isUserScrollingRef.current = false; // resume auto-scroll after 1.5s idle
                }, 1500);
              }}
              className="text-lg leading-relaxed mb-6 h-56 overflow-y-auto scroll-smooth mod-scrollbar"
            >
              {words.length === 0 ? (
                <span className="text-gray-500">Loading text…</span>
              ) : (
                words.map((w, i) => (
                  <span
                    key={`${w}-${i}`}
                    className={`transition-colors duration-200 ${
                      i === currentWordIndex
                        ? "bg-[#ffe655] text-black px-1 rounded"
                        : ""
                    }`}
                  >
                    {w}{" "}
                  </span>
                ))
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handlePlayPause}
                className="bg-[#00141b] text-white rounded-full p-3 hover:bg-[#f1e586] hover:text-[#00141b]"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <div className="flex items-center gap-3 text-sm text-gray-700">
                <span>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={handleSeek}
                  className="w-64 accent-[#f2e596]"
                />
                <span>{formatTime(duration)}</span>
              </div>

              <button
                onClick={handleSpeedChange}
                className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400 text-sm"
              >
                {playbackRate}x
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
