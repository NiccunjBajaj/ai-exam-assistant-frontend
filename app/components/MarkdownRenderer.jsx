import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

const MarkdownRenderer = ({ content, cursorMode = false }) => {
  return (
    <div className="prose prose-invert max-w-none text-xl tracking-[0.01vw] leading-[2vw]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ node, inline, className, children, ...props }) {
            return !inline ? (
              <pre className="inline-block text-[1rem] px-2 rounded-lg font-normal text-white w-full">
                <code className={`${className} rounded `} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-500 px-1 rounded text-pink-300 text-sm">
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="table-auto w-full border border-[#fefefe]">
                  {children}
                </table>
              </div>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-pink-400"
              >
                {children}
              </a>
            );
          },
          h1({ children }) {
            return (
              <h1 className="text-[1.5rem] my-3 font-bold bg-[#ffe34385] px-[0.35rem] rounded-md text-black w-fit">
                {children} :
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-[1.4rem] my-3 font-semibold bg-[#ffe34385] px-[0.35rem] rounded-md text-black w-fit">
                {children} :
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-[1.2rem] my-3 font-semibold bg-[#ffe34385] px-[0.35rem] rounded-md text-black w-fit">
                {children}
              </h3>
            );
          },
          hr() {
            return <hr className="my-3" />;
          },
          strong({ children }) {
            return (
              <strong className="font-semibold text-[#ffe243] px-1">
                {children}
              </strong>
            );
          },
          p: ({ children }) => {
            return (
              <p className="text-[1.1rem] tracking-[-0.013rem]">{children}</p>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
