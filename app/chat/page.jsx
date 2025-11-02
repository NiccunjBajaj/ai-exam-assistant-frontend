import { StrictMode, Suspense } from "react";
import AuthWrapper from "../components/AuthWrapper";
import ChatContent from "../components/ChatPage";

export default function ChatPage() {
  return (
    <StrictMode>
      <Suspense fallback={<div>Loading...</div>}>
        <AuthWrapper>
          <ChatContent />
        </AuthWrapper>
      </Suspense>
    </StrictMode>
  );
}
