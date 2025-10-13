import "./globals.css";
import Menu from "./components/Menu";
import MouseFollower from "./components/MouseFollower";

export const metadata = {
  title: "Learnee",
  description: "Buzz through your exams with AI 🐝",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "image/png" },
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
        {/* <MouseFollower /> */}
        <div className="z-[10000]">
          <Menu />
        </div>
        {children}
      </body>
    </html>
  );
}
