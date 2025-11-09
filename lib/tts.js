export async function getTTS(text, noteId, token) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  try {
    const res = await fetch(`${BACKEND_URL}/voice/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, note_id: noteId }),
    });

    if (!res.ok) throw new Error("TTS generation failed");
    return await res.json();
  } catch (err) {
    console.error("Error generating TTS:", err);
    throw err;
  }
}
