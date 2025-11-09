"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { File, Loader2, Paperclip } from "lucide-react";

const MAX_FILES = 5;

const FileUploadArea = forwardRef(
  ({ sessionId, onUploadSuccess, isDragging, setIsDragging }, ref) => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef(null);

    useImperativeHandle(ref, () => ({
      clearFile: () => setUploadedFiles([]),
      getFileName: () =>
        uploadedFiles.length > 0 ? uploadedFiles[0].name : null,
      handleFiles: (files) => handleFiles(files),
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

      setIsUploading(true);
      try {
        await Promise.all(newFiles.map(uploadFile));
        setUploadedFiles((prev) => [...prev, ...newFiles]);
      } catch (error) {
        toast.error("File upload failed.");
      } finally {
        setIsUploading(false);
      }
    };

    const handleInputChange = (e) => handleFiles(e.target.files);

    const removeFile = (index) => {
      const updated = [...uploadedFiles];
      updated.splice(index, 1);
      setUploadedFiles(updated);
    };

    return (
      <div
        className={`flex gap-2 items-center p-2 rounded-lg transition ${
          isDragging ? "bg-muted/50" : ""
        }`}
      >
        <div
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer px-4 py-2"
        >
          <p className="text-2xl text-center text-[#ffe655]">+</p>
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
          {isUploading && (
            <div className="flex items-center gap-2 rounded-xl border p-2 bg-muted/40 w-fit">
              <Loader2 className="animate-spin" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          )}
          {uploadedFiles.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl border p-2 bg-muted/40 w-fit"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-10 h-10 rounded-md object-cover"
                />
              ) : (
                <File className="w-10 h-10" />
              )}
              <div>
                <p className="text-sm font-medium truncate max-w-[150px]">
                  {file.name}
                </p>
                <p className="text-xs text-[#e2e8f0]">
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
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
);

export default FileUploadArea;
