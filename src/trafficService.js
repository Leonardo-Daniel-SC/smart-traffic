
const API_URL = "http://184.195.90.61:1026";

export async function buscarUltimoEvento() {
  console.log("1 - Função buscarUltimoEvento executada");

  try {
    console.log("2 - Tentando consultar o Orion...");

    const resposta = await fetch(
      `${API_URL}/v2/entities/urn:ngsi-ld:Traffic:003?options=keyValues`,
      {
        method: "GET",
        headers: {
          "fiware-service": "smart",
          "fiware-servicepath": "/"
        },
        cache: "no-store"
      }
    );

    console.log("3 - Resposta recebida:", resposta.status);

    if (!resposta.ok) {
      const mensagem = await resposta.text();
      throw new Error(`HTTP ${resposta.status}: ${mensagem}`);
    }

    const dados = await resposta.json();

    console.log("4 - JSON recebido:", dados);

    return dados;

  } catch (erro) {
    console.error("Erro detalhado no FIWARE:", erro);
    throw erro;
  }
}
