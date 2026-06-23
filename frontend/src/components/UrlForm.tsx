import { useState } from "react";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function UrlForm({ onSubmit, isLoading }: UrlFormProps) {
  const [url, setUrl] = useState("");

  function handleClick() {
    const trimmed = url.trim();
    if (!trimmed) return;
    const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    onSubmit(normalized);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleClick();
  }

  return (
    <div className="flex gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://exemple.com/ma-page"
        disabled={isLoading}
        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700
                   bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm
                   px-4 py-3 text-sm text-gray-900 dark:text-white
                   placeholder-gray-400 dark:placeholder-gray-500
                   outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500
                   disabled:opacity-50 transition-colors"
      />
      <button
        onClick={handleClick}
        disabled={isLoading || !url.trim()}
        className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-medium text-white
                   hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors whitespace-nowrap"
      >
        {isLoading ? "Analyse…" : "Générer"}
      </button>
    </div>
  );
}
