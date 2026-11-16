const TRAFFIC_ENDPOINT = "/api/traffic";

export async function buscarUltimoEvento() {
  const resposta = await fetch(TRAFFIC_ENDPOINT, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(dados?.erro || `Falha ao consultar o FIWARE (HTTP ${resposta.status}).`);
  }

  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    throw new Error("O FIWARE retornou uma resposta inválida.");
  }

  return dados;
}
