const ENTITY_PATH = "/v2/entities/urn:ngsi-ld:Traffic:003?options=keyValues";

function getFiwareOrigin() {
  const configuredOrigin = globalThis.process?.env?.FIWARE_ORIGIN;

  if (!configuredOrigin) {
    throw new Error("FIWARE_ORIGIN não está configurada na Vercel.");
  }

  let origin;
  try {
    origin = new URL(configuredOrigin);
  } catch {
    throw new Error("FIWARE_ORIGIN deve ser uma URL válida, como http://184.195.90.61:1026.");
  }

  if (
    !["http:", "https:"].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    throw new Error("FIWARE_ORIGIN deve conter somente o protocolo, host e porta do Orion.");
  }

  return origin.origin;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ erro: "Método não permitido." });
  }

  let origin;
  try {
    origin = getFiwareOrigin();
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }

  try {
    const upstream = await fetch(`${origin}${ENTITY_PATH}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "fiware-service": "smart",
        "fiware-servicepath": "/",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    const responseText = await upstream.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({ erro: "O FIWARE retornou uma resposta que não é JSON válido." });
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        erro: `O Orion respondeu com HTTP ${upstream.status}.`,
        detalhe: data?.description || data?.error || undefined,
      });
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(502).json({ erro: "O FIWARE retornou dados em formato inválido." });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);
  } catch (error) {
    console.error("Falha na consulta ao Orion:", error);
    const timeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    return res.status(502).json({
      erro: timeout
        ? "Tempo esgotado ao consultar o FIWARE. Verifique a disponibilidade e as regras de rede da AWS."
        : "Não foi possível conectar ao FIWARE. Verifique a URL e as regras de rede da AWS.",
    });
  }
}
