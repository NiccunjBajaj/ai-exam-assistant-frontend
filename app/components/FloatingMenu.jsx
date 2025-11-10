import React from "react";
import { createPortal } from "react-dom";

export default function FloatingMenu({ position, children, menuRef }) {
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 100000,
      }}
      className="bg-[#0b1e26] rounded-md shadow-lg"
    >
      {children}
    </div>,
    document.getElementById("portal-root")
  );
}
