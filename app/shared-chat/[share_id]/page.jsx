"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import MarkdownRenderer from "../../components/MarkdownRenderer";

function SharedChatPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const params = useParams();
  const share_id = params.share_id;

  const [chatData, setChatData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!share_id) return;

    const fetchSharedChat = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/shared-chat/${share_id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch shared chat");
        }
        const data = await res.json();
        setChatData(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchSharedChat();
  }, [share_id]);

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (!chatData) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-[#00141b] text-[#e2e8f0] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#ffe655]">
          {chatData.title}
        </h1>
        <div className="space-y-6">
          {chatData.messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-3 ${
                  m.role === "user"
                    ? "bg-[#0B1E26] max-w-[75%]"
                    : "bg-[#00141b] w-full"
                }`}
              >
                <MarkdownRenderer content={m.content} />
                <span className="text-xs opacity-70 mt-3 block">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full flex justify-center text-sm bg-[#0b1e26] fixed bottom-0 py-2">
        <p className="text-[#606060]">
          This is a shared chat(not saved in your account), it will
          update/delete when the owner makes any changes, reload to view the
          changes.
        </p>
      </div>
    </main>
  );
}

export default SharedChatPage;
