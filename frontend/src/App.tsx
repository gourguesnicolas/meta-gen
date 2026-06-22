import { useState } from "react";
import UrlForm from "./components/UrlForm";
import MetaCard from "./components/MetaCard";

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? "http://localhost:8787";

type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; descriptions: string[] }
  | { status: "error"; message: string };

export default function App() {
  const [state, setState] = useState<AppState>({ status: "idle" });

  async function handleSubmit(url: string) {
    setState({ status: "loading" });
    try {
      const response = await fetch(`${WORKER_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = (await response.json()) as
        | { descriptions: string[] }
        | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Erreur inconnue");
      }

      setState({ status: "success", descriptions: data.descriptions });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setState({ status: "error", message });
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Meta-Gen AI</h1>
            <p className="text-xs text-gray-400">Générateur de méta-descriptions SEO par IA</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold mb-3">
            Collez une URL et obtenez{" "}
            <span className="text-violet-400">5 méta-descriptions SEO</span>
          </h2>
          <p className="text-gray-400">
            Optimisées pour le SEO · Moins de 160 caractères · Prêtes à copier
          </p>
        </div>

        <UrlForm
          onSubmit={handleSubmit}
          isLoading={state.status === "loading"}
        />

        {/* États */}
        <div className="mt-8">
          {state.status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-12 text-gray-400">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Analyse de la page en cours…</p>
            </div>
          )}

          {state.status === "error" && (
            <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
              <strong>Erreur :</strong> {state.message}
            </div>
          )}

          {state.status === "success" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">
                5 suggestions générées
              </p>
              {state.descriptions.map((desc, i) => (
                <MetaCard key={i} index={i + 1} description={desc} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
