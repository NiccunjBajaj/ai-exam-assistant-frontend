import HomePageClient from "./components/HomePageClient";

export const metadata = {
  title: "Learnee – Learn Smarter, Not Harder | AI Study Assistant",
  description:
    "Chat with Proff, your AI exam assistant. Generate notes, flashcards, and mark-based answers instantly from uploaded files.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: "https://www.learnee.space/",
    title: "Learnee – AI Toolbox for Students",
    description:
      "Learnee helps students prepare smarter by generating notes, flashcards, and structured answers from uploaded files.",
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
    title: "Learnee – Learn Smarter, Not Harder",
    description:
      "AI-powered study assistant that helps students create notes, flashcards, and exam-ready answers.",
    images: ["/og-image.png"],
  },
};

export default function Home() {
  return <HomePageClient />;
}
