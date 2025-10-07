// app/auth/success/page.jsx
"use client";
import dynamic from "next/dynamic";

const AuthSuccessClient = dynamic(
  () => import("./AuthSuccessClient"),
  { ssr: false } // ensures it only renders on the client
);

export default function AuthSuccessPage() {
  return <AuthSuccessClient />;
}
