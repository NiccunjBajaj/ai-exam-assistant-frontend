"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none text-base md:text-[1.1rem] leading-relaxed tracking-[0.01em] selection:bg-[#ffe34333] selection:text-[#ffe343] transition-all duration-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[1.5rem] md:text-[1.7rem] font-[600] mt-6 mb-3 text-[#e2e8f0]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[1.4rem] md:text-[1.6rem] font-[600] mt-5 mb-2 text-[#e2e8f0]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[1.3rem] md:text-[1.5rem] font-[600] mt-4 mb-2 text-[#e2e8f0]">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-[#e6e6e6] my-2 leading-[1.9]">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#ebf0f8]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-[#f1e596] italic">{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8ab4f8] hover:text-[#F1E596] underline-offset-4 transition-colors"
            >
              {children}
            </a>
          ),
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : null;

            return !inline ? (
              <div className="relative my-4">
                {language && (
                  <div className="absolute top-0 right-0 bg-[#0b1e26] text-[#f1e596] text-xs font-mono px-2 py-1 rounded-bl-lg rounded-tr-xl">
                    {language}
                  </div>
                )}
                <pre className="bg-[#00141b] rounded-xl overflow-x-auto p-4 pt-8 text-[1rem] mod-scrollbar">
                  <code className={`${className} font-mono`} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-[#0b1e26] px-1.5 py-0.5 rounded-md text-[#e2e8f0] text-[1rem]">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#f1e596] bg-[#0b1e26] p-4 rounded-r-lg italic text-[#cfcfcf] my-4">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc ml-6 my-2 space-y-1 marker:text-[#e2e8f0]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-6 my-2 space-y-1 marker:text-[#e2e8f0]">
              {children}
            </ol>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-[#2a2a2a]">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left bg-[#0b1e26] border-b border-[#2a2a2a] text-[#e2e8f0] font-bold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-[#e2e8f0] border-b border-[#2a2a2a]">
              {children}
            </td>
          ),
          hr: () => <hr className="border-[#2a2a2a] my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
