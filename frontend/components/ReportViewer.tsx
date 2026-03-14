"use client";

import { useState } from "react";

interface Props {
  markdown: string;
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm,  "<h2>$1</h2>")
    .replace(/^# (.+)$/gm,   "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/`(.+?)`/g,       "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^---$/gm,  "<hr/>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[hul])(.+)$/gm, "<p>$1</p>");
}

export default function ReportViewer({ markdown }: Props) {
  const [copied, setCopied] = useState(false);
  const [view, setView]     = useState<"rendered" | "raw">("rendered");

  function handleCopy() {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
        <p className="text-sm font-medium text-gray-700">📄 Research Report</p>
        <div className="flex items-center gap-2">
          {/* Toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-xs">
            <button
              onClick={() => setView("rendered")}
              className={`px-3 py-1.5 transition-colors ${view === "rendered" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              Preview
            </button>
            <button
              onClick={() => setView("raw")}
              className={`px-3 py-1.5 transition-colors ${view === "raw" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              Markdown
            </button>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {view === "rendered" ? (
          <article
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 leading-relaxed">
            {markdown}
          </pre>
        )}
      </div>
    </div>
  );
}