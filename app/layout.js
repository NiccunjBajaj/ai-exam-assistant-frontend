import "./globals.css";
import Menu from "./components/Menu";
import { AuthProvider } from "./components/AuthContext";
export const metadata = {
  title: {
    default: "Learnee – AI Toolbox for Students",
    template: "%s | Learnee",
  },
  description:
    "Learnee is an AI-powered exam assistant helping students learn smarter with auto-generated notes, flashcards, and structured answers.",
  metadataBase: new URL("https://www.learnee.space"),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: "https://www.learnee.space/",
    title: "Learnee – AI Toolbox for Students",
    description:
      "Learnee transforms exam prep with AI. Generate notes, flashcards, and mark-based answers instantly with Proff, your study chatbot.",
    siteName: "Learnee",
    images: [
      {
        url: "/og-image.png", // Relative to metadataBase
        width: 1200,
        height: 630,
        alt: "Learnee – AI Toolbox for Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@learnee",
    title: "Learnee – Learn Smarter, Not Harder",
    description:
      "AI-powered assistant for students to auto-generate notes, flashcards, and exam answers.",
    images: ["/og-image.png"], // Relative to metadataBase
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="no-scrollbar">
        <AuthProvider>
          <div className="z-[10000]">
            <Menu />
          </div>
          {children}
          <div id="portal-root"></div>
        </AuthProvider>
      </body>
    </html>
  );
}
