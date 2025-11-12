import { Suspense } from "react";
import AuthWrapper from "../components/AuthWrapper";
import ChatContent from "../components/ChatPage";

export const metadata = {
  title: "Proff – AI Study Chatbot | Learnee",
  description:
    "Chat with Proff, Learnee’s intelligent exam assistant. Upload study files, get mark-based answers, and auto-generated notes with AI.",
  alternates: {
    canonical: '/chat',
  },
  openGraph: {
    url: "https://www.learnee.space/chat",
    title: "Proff – AI Study Chatbot by Learnee",
    description:
      "Proff helps students prepare smarter by generating exam-ready answers, flashcards, and summaries from study files.",
    siteName: "Learnee",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Learnee – AI Toolbox for Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@learnee",
    title: "Proff – AI Study Chatbot by Learnee",
    description:
      "Proff by Learnee — the AI chatbot that generates structured exam answers, notes, and flashcards from your study files.",
    images: ["/og-image.png"],
  },
};

export default function ChatPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Proff by Learnee",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: "https://www.learnee.space/chat",
    description:
      "AI chatbot for students to prepare for exams through mark-based answers, notes, and flashcards.",
    creator: {
      "@type": "Organization",
      name: "Learnee",
      url: "https://www.learnee.space",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <AuthWrapper>
          <ChatContent />
        </AuthWrapper>
      </Suspense>
    </>
  );
}
