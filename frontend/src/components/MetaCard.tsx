import { useState } from "react";

interface MetaCardProps {
  index: number;
  description: string;
}

export default function MetaCard({ index, description }: MetaCardProps) {
  const [copied, setCopied] = useState(false);
  const charCount = description.length;
  const isOverLimit = charCount > 160;

  async function handleCopy() {
    await navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="card-appear group rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-4 transition-colors hover:border-violet-300 dark:hover:border-gray-700"
      style={{ animationDelay: `${(index - 1) * 120}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 flex-1 min-w-0">
          <span className="mt-0.5 flex-shrink-0 text-xs font-mono text-violet-600 dark:text-violet-400">
            {String(index).padStart(2, "0")}
          </span>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{description}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 rounded-md px-3 py-1.5 text-xs font-medium
                     border border-gray-300 dark:border-gray-700
                     text-gray-500 dark:text-gray-400
                     hover:border-violet-500 hover:text-violet-600 dark:hover:border-violet-600 dark:hover:text-violet-400
                     transition-colors"
        >
          {copied ? "✓ Copié" : "Copier"}
        </button>
      </div>

      <div className="mt-3 flex justify-end">
        <span className={`text-xs font-mono ${isOverLimit ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-600"}`}>
          {charCount}/160
        </span>
      </div>
    </div>
  );
}
