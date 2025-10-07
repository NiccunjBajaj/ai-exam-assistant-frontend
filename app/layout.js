import "./globals.css";
import Menu from "./components/Menu";
import MouseFollower from "./components/MouseFollower";

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
