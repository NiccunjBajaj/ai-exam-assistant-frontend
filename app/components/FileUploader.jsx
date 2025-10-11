"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { toast } from "react-hot-toast";

const MAX_FILES = 5;

const FileUploadArea = forwardRef(({ sessionId, onUploadSuccess }, ref) => {
  const BACKEND_URL = process.env.BACKEND_URL;
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clearFile: () => setUploadedFiles([]),
    getFileName: () =>
      uploadedFiles.length > 0 ? uploadedFiles[0].name : null,
  }));

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", sessionId);

    const res = await fetch(`${BACKEND_URL}/upload-file`, {
      method: "POST",
      body: formData,
    });

    await res.json();
    if (!res.ok) throw new Error("Upload failed");
    onUploadSuccess?.();
  };

  const handleFiles = async (files) => {
    if (!files?.length) return;

    const newFiles = Array.from(files).slice(
      0,
      MAX_FILES - uploadedFiles.length
    );

    if (uploadedFiles.length + newFiles.length > MAX_FILES) {
      toast.error("Maximum 5 files allowed.");
      return;
    }

    for (const file of newFiles) {
      await uploadFile(file);
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleInputChange = (e) => handleFiles(e.target.files);

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    const updated = [...uploadedFiles];
    updated.splice(index, 1);
    setUploadedFiles(updated);
  };

  return (
    <div className="flex gap-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className="cursor-pointer px-4 py-2 transition"
      >
        <p className="text-2xl text-center text-[#ffe243]">
          {isDragging ? "Drop files to upload…" : "+"}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleInputChange}
          hidden
        />
      </div>

      {/* Preview */}
      <div className="flex gap-2">
        {uploadedFiles.map((file, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-xl border p-2 bg-muted/40 w-fit"
          >
            <span>📎</span>
            <div>
              <p className="text-sm font-medium truncate max-w-[150px]">
                {file.name.slice(0, 6)}...{" "}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => removeFile(index)}
              className="text-sm text-red-500 hover:underline"
              aria-label="Remove file"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default FileUploadArea;
