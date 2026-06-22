// Extrait le texte utile d'une page HTML (titre, meta existante, body tronqué)
function extractTextFromHtml(html: string): string {
  // Titre
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Meta description existante
  const metaMatch = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
  );
  const existingMeta = metaMatch ? metaMatch[1].trim() : "";

  // Supprimer scripts, styles, balises HTML
  let bodyText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Garder seulement les 2000 premiers caractères du body pour le contexte
  bodyText = bodyText.substring(0, 2000);

  return `TITRE: ${title}\nMETA EXISTANTE: ${existingMeta}\nCONTENU: ${bodyText}`;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const headers = corsHeaders(allowedOrigin);

    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Méthode non supportée" }), {
        status: 405,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    let url: string;
    try {
      const body = await request.json<{ url: string }>();
      url = body.url?.trim();
      if (!url) throw new Error("URL manquante");
      // Valider l'URL
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "URL invalide ou manquante" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Fetch de la page cible (avec fallback URL-only si la page bloque le bot)
    let pageContent = "";
    let fetchFailed = false;
    try {
      const pageResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "fr-CA,fr;q=0.9,en-CA;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!pageResponse.ok) {
        fetchFailed = true;
      } else {
        const html = await pageResponse.text();
        pageContent = extractTextFromHtml(html);
      }
    } catch {
      fetchFailed = true;
    }

    if (fetchFailed) {
      const parsed = new URL(url);
      // Construire un contexte minimal à partir de l'URL
      const slug = parsed.pathname
        .split("/")
        .filter(Boolean)
        .join(" ")
        .replace(/[-_]/g, " ");
      pageContent = `URL: ${url}\nDomaine: ${parsed.hostname}\nChemin: ${slug || parsed.hostname}`;
    }

    // Appel Cloudflare AI
    try {
      const prompt = `Tu es un expert SEO chevronné. Génère exactement 5 méta-descriptions SEO professionnelles en français pour la page web ci-dessous.

UNE MÉTA-DESCRIPTION SEO C'EST QUOI :
Une phrase ou deux complètes et informatives (pas un slogan !), qui résument le contenu de la page, mentionnent les mots-clés importants, incluent un appel à l'action, et donnent envie de cliquer depuis Google.

EXEMPLES DE BONNES MÉTA-DESCRIPTIONS :
"Découvrez les services de Nicolas Gourgues, Développeur Web Full-Stack basé à Québec. Expertise TypeScript, React et Tailwind CSS. Contactez-moi pour discuter de votre projet."
"Envie d'une cuisine québécoise revisitée avec des produits locaux ? Réservez votre table au restaurant Le Bistro dès aujourd'hui et vivez une expérience gourmande unique."
"Découvrez notre nouvelle collection de vêtements écoresponsables pour femmes. Livraison rapide partout au Québec et retours gratuits. Magasinez en ligne dès maintenant!"

RÈGLES ABSOLUES :
- Chaque description doit faire ENTRE 120 ET 160 caractères (jamais moins de 120 !)
- Être spécifique au contenu réel de la page (noms, services, lieux, offres mentionnés)
- Contenir un verbe d'action et un appel à l'action clair (Découvrez, Contactez, Explorez, Réservez…)
- Se terminer par un point final.
- 5 angles différents : ex. (1) présentation générale, (2) expertise/services, (3) bénéfice client, (4) localisation/contexte, (5) appel à l'action direct
- Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après
- Format exact : {"descriptions": ["desc1", "desc2", "desc3", "desc4", "desc5"]}

CONTENU DE LA PAGE :
${pageContent}`;

      const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      });

      // Extraire le texte selon le format retourné (varie selon le modèle)
      const r = aiResponse as Record<string, unknown>;
      let responseText: string;
      if (typeof r.response === "string") {
        // Format standard CF AI : { response: "..." }
        responseText = r.response;
      } else if (Array.isArray(r.choices) && r.choices.length > 0) {
        // Format OpenAI-compatible : { choices: [{ message: { content: "..." } }] }
        const msg = (r.choices[0] as Record<string, unknown>).message as Record<string, unknown>;
        responseText = typeof msg?.content === "string" ? msg.content : JSON.stringify(aiResponse);
      } else {
        responseText = JSON.stringify(aiResponse);
      }

      // Nettoyer les backticks markdown si présents
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleaned) as { descriptions: string[] };

      if (!Array.isArray(parsed.descriptions)) {
        throw new Error("Format de réponse invalide");
      }

      // S'assurer que toutes les descriptions font moins de 160 chars
      const descriptions = parsed.descriptions
        .slice(0, 5)
        .map((d: string) => d.substring(0, 160));

      return new Response(JSON.stringify({ descriptions }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      return new Response(
        JSON.stringify({ error: `Erreur IA: ${message}` }),
        {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
    }
  },
} satisfies ExportedHandler<Env>;
