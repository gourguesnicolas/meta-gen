import { useState } from "react";
import UrlForm from "./components/UrlForm";
import MetaCard from "./components/MetaCard";

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? "http://localhost:8787";

type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; descriptions: string[] }
  | { status: "error"; message: string };

const BASE = import.meta.env.BASE_URL;

function SunIcon({ dark }: { dark: boolean }) {
  return (
    <img // SOURCE de l'icône: https://www.flaticon.com/authors/freepik
      src={`${BASE}sun.png`}
      alt="Thème clair"
      width={24}
      height={24}
      style={{
        filter: dark
          ? "brightness(0) saturate(100%) invert(75%) sepia(30%) saturate(800%) hue-rotate(210deg) brightness(110%)"
          : "brightness(0) saturate(100%) invert(22%) sepia(60%) saturate(900%) hue-rotate(250deg) brightness(90%)",
      }}
    />
  );
}

function MoonIcon({ dark }: { dark: boolean }) {
  return (
    <img // SOURCE de l'icône: https://www.flaticon.com/authors/good-ware
      src={`${BASE}moon.png`}
      alt="Thème sombre"
      width={24}
      height={24}
      style={{
        filter: dark
          ? "brightness(0) saturate(100%) invert(75%) sepia(30%) saturate(800%) hue-rotate(210deg) brightness(110%)"
          : "brightness(0) saturate(100%) invert(75%) sepia(30%) saturate(800%) hue-rotate(210deg) brightness(110%)",
      }}
    />
  );
}

export default function App() {
  const [state, setState] = useState<AppState>({ status: "idle" });
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

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

  const gradientStyle = dark
    ? {
        backgroundColor: "#030712",
        backgroundImage:
          "radial-gradient(ellipse 140% 90% at 50% 125%, rgba(109, 40, 217, 0.55) 0%, rgba(76, 29, 149, 0.25) 35%, rgba(30, 10, 80, 0.08) 60%, transparent 80%)",
      }
    : {
        backgroundColor: "#f5f3ff",
        backgroundImage:
          "radial-gradient(ellipse 140% 90% at 50% 125%, rgba(139, 92, 246, 0.35) 0%, rgba(167, 139, 250, 0.12) 40%, transparent 75%)",
      };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen text-gray-900 dark:text-white transition-colors duration-300" style={gradientStyle}>

        {/* Header */}
        <header
          className="px-6 py-5"
          style={dark
            ? { background: "linear-gradient(135deg, #1a0533 0%, #2d0f5e 50%, #1a0533 100%)" }
            : { background: "linear-gradient(135deg, #3b0764 0%, #5b21b6 50%, #3b0764 100%)" }
          }
        >
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            {/* SOURCE de l'icône: https://www.flaticon.com/authors/hidemaru */}
            <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
              <div className="absolute w-7 h-7 rounded-full bg-white" />
              <img src={`${import.meta.env.BASE_URL}ai-text.png`} alt="Meta-Gen AI" className="relative w-12 h-12 object-contain" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Meta-Gen AI</h1>
              <p className="text-sm" style={{ color: "rgba(196,181,253,0.7)" }}>Générateur de méta-descriptions SEO par IA</p>
            </div>
            <button
              onClick={toggleTheme}
              className="rounded-full p-2.5 transition-colors"
              style={dark
                ? { color: "rgba(196,181,253,0.9)", border: "1.5px solid rgba(139,92,246,0.5)", background: "rgba(109,40,217,0.25)" }
                : { color: "rgba(196,181,253,0.9)", border: "1.5px solid rgba(196,181,253,0.6)", background: "rgba(109,40,217,0.25)" }
              }
              aria-label="Basculer le thème"
            >
              {dark ? <SunIcon dark={dark} /> : <MoonIcon dark={dark} />}
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
              Collez une URL et obtenez{" "}
              <span className="text-violet-600 dark:text-violet-400">5 méta-descriptions SEO</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Optimisées pour le SEO · Moins de 160 caractères · Prêtes à copier
            </p>
          </div>

          <UrlForm onSubmit={handleSubmit} isLoading={state.status === "loading"} />

          <div className="mt-8">
            {state.status === "loading" && (
              <div className="flex flex-col items-center gap-4 py-12 text-gray-500 dark:text-gray-400">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Analyse de la page en cours…</p>
              </div>
            )}

            {state.status === "error" && (
              <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-700 dark:text-red-300">
                <strong>Erreur :</strong> {state.message}
              </div>
            )}

            {state.status === "success" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium mb-4">
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
    </div>
  );
}
