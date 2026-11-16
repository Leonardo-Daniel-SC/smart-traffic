import { useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MapaTransito from "./components/MapaTransito";
import { buscarUltimoEvento } from "./trafficService";

function App() {
  const [dados, setDados] = useState(null);
  const [media, setMedia] = useState(null);
  const [quantidadeMedicoes, setQuantidadeMedicoes] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(30);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let somaVelocidades = 0;
    let totalMedicoes = 0;
    let ultimaAtualizacao = null;

    let inicioIntervalo = Date.now();
    let buscando = false;

    console.log("Smart Traffic iniciado!");

    async function consultarFIWARE() {
      if (buscando) return;

      buscando = true;

      try {
        const resultado = await buscarUltimoEvento();

        setDados(resultado);
        setErro("");

        // Identifica uma nova atualização do Orion
        if (
          resultado?.TimeInstant &&
          resultado.TimeInstant !== ultimaAtualizacao
        ) {
          ultimaAtualizacao = resultado.TimeInstant;

          const velocidade = Number(resultado.speed_kmh);

          if (Number.isFinite(velocidade)) {
            somaVelocidades += velocidade;
            totalMedicoes++;

            setQuantidadeMedicoes(totalMedicoes);

            console.log("Nova velocidade:", velocidade);
            console.log("Soma atual:", somaVelocidades);
            console.log("Medições:", totalMedicoes);
          }
        }

      } catch (error) {
        setErro(error.message || "Não foi possível consultar o FIWARE.");
        console.error("Erro ao atualizar dados:", error);

      } finally {
        buscando = false;
        setCarregando(false);
      }
    }

    // Primeira consulta
    consultarFIWARE();

    // Consulta a cada segundo
    const consulta = setInterval(consultarFIWARE, 1000);

    // Calcula a média a cada 30 segundos
    const relogio = setInterval(() => {
      const decorrido = Math.floor(
        (Date.now() - inicioIntervalo) / 1000
      );

      setTempoRestante(Math.max(0, 30 - decorrido));

      if (decorrido >= 30) {
        if (totalMedicoes > 0) {
          const resultadoMedia =
            somaVelocidades / totalMedicoes;

          setMedia(resultadoMedia);

          console.log("MÉDIA DOS ÚLTIMOS 30 SEGUNDOS:", resultadoMedia);
        } else {
          console.log("Nenhuma medição recebida neste período.");
        }

        // Reinicia as variáveis
        somaVelocidades = 0;
        totalMedicoes = 0;

        setQuantidadeMedicoes(0);
        inicioIntervalo = Date.now();
        setTempoRestante(30);
      }
    }, 250);

    return () => {
      clearInterval(consulta);
      clearInterval(relogio);
    };
  }, []);

  // Velocidade efetiva a ser exibida (usa a média calculada, ou a velocidade instantânea caso exista, ou null se ausente/inválida)
  const velocidadeEfetiva = media !== null && Number.isFinite(Number(media))
    ? Number(media)
    : (dados?.speed_kmh !== undefined && Number.isFinite(Number(dados.speed_kmh)))
      ? Number(dados.speed_kmh)
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#1B263B] font-sans">
      <Header />

      <main className="grow px-4 sm:px-[5%] py-4 sm:py-6 max-w-7xl mx-auto w-full flex flex-col gap-6 sm:gap-8 overflow-x-hidden">
        {/* Seção Principal do Mapa da Marginal Tietê */}
        <section>
          <MapaTransito
            velocidadeMedia={velocidadeEfetiva}
            erro={erro}
            carregando={carregando}
          />
        </section>

        {/* Cards de Métricas do FIWARE em Destaque */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-white">
          <div className="bg-[#2F3E46] p-4 rounded-xl border border-gray-700 shadow-md">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-1">
              Status do Sistema
            </span>
            <span className="text-xl font-bold">
              {dados?.s === "on" ? "Ligado" : "Desligado"}
            </span>
          </div>

          <div className="bg-[#2F3E46] p-4 rounded-xl border border-gray-700 shadow-md">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-1">
              Última Velocidade Medida
            </span>
            <span className="text-xl font-bold">
              {dados?.speed_kmh !== undefined && Number.isFinite(Number(dados.speed_kmh))
                ? `${Number(dados.speed_kmh)} km/h`
                : "Sem dados"}
            </span>
          </div>

          <div className="bg-[#2F3E46] p-4 rounded-xl border border-gray-700 shadow-md">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-1">
              Velocidade Média (30s)
            </span>
            <span className="text-xl font-bold text-green-400">
              {media !== null && Number.isFinite(Number(media))
                ? `${Number(media).toFixed(2)} km/h`
                : "Calculando..."}
            </span>
          </div>

          <div className="bg-[#2F3E46] p-4 rounded-xl border border-gray-700 shadow-md">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-1">
              Veículos Detectados
            </span>
            <span className="text-xl font-bold">
              {dados?.vehicle_count ?? 0}
            </span>
            <span className="text-xs text-gray-400 block mt-1">
              {quantidadeMedicoes} medições / próx. média em {tempoRestante}s
            </span>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
