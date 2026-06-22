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
    <div className="group rounded-lg border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 flex-1 min-w-0">
          <span className="mt-0.5 flex-shrink-0 text-xs font-mono text-gray-600">
            {String(index).padStart(2, "0")}
          </span>
          <p className="text-sm text-gray-200 leading-relaxed">{description}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 rounded-md px-3 py-1.5 text-xs font-medium
                     border border-gray-700 text-gray-400
                     hover:border-violet-600 hover:text-violet-400
                     transition-colors"
        >
          {copied ? "✓ Copié" : "Copier"}
        </button>
      </div>

      {/* Compteur de caractères */}
      <div className="mt-3 flex justify-end">
        <span
          className={`text-xs font-mono ${
            isOverLimit ? "text-red-400" : "text-gray-600"
          }`}
        >
          {charCount}/160
        </span>
      </div>
    </div>
  );
}
