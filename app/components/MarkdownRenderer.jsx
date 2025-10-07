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
              <pre className="bg-[#ffe34353] inline-block text-base px-2 rounded-lg font-semibold text-white">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-700 px-1 rounded text-pink-300 text-sm">
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
              <h1 className="text-4xl my-5 font-bold bg-[#ffe34385] px-2 rounded-md text-black w-fit">
                {children} :
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-3xl my-5 font-semibold bg-[#ffe34385] px-2 rounded-md text-black w-fit">
                {children} :
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-xl my-5 font-semibold bg-[#ffe34385] px-2 rounded-md text-black w-fit">
                {children} :
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
            const childArray = React.Children.toArray(children);

            return (
              <p className="inline">
                {childArray.map((child, i) => {
                  if (
                    cursorMode &&
                    typeof child === "string" &&
                    child.includes("<cursor-placeholder/>")
                  ) {
                    const parts = child.split("<cursor-placeholder/>");
                    return parts.flatMap((part, index) =>
                      index < parts.length - 1
                        ? [
                            part,
                            <span
                              key={`cursor-${i}-${index}`}
                              className="inline-block w-[2px] h-[1.2em] bg-white align-text-bottom animate-pulse"
                            />,
                          ]
                        : [part]
                    );
                  }
                  return child;
                })}
              </p>
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
