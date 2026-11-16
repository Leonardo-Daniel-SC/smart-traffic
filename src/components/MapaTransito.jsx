import { MapContainer, TileLayer, Polyline, Popup, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet with React/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Função para calcular o estado do trânsito e a cor do trecho
function getStatusEColor(velocidade) {
  if (velocidade === null || velocidade === undefined || !Number.isFinite(Number(velocidade))) {
    return {
      label: "Sem dados",
      cor: "#6b7280",
      bgClass: "bg-gray-500",
      textClass: "text-gray-400"
    };
  }

  const v = Number(velocidade);

  if (v <= 20) {
    return {
      label: "Congestionado",
      cor: "#ef4444",
      bgClass: "bg-red-500",
      textClass: "text-red-500"
    };
  }

  if (v <= 40) {
    return {
      label: "Moderado",
      cor: "#eab308",
      bgClass: "bg-yellow-500",
      textClass: "text-yellow-500"
    };
  }

  return {
    label: "Livre",
    cor: "#22c55e",
    bgClass: "bg-green-500",
    textClass: "text-green-500"
  };
}

// Coordenadas do trecho da Marginal Tietê ao sul do Rio Tietê.
// Os pontos acompanham a curvatura da pista no sentido oeste -> leste.
const TRECHO_MARGINAL_TIETE = [
  [-23.51525, -46.6735],
  [-23.51545, -46.6715],
  [-23.51565, -46.6695],
  [-23.51585, -46.6675],
  [-23.51610, -46.6655],
  [-23.51645, -46.6635],
  [-23.51680, -46.6615],
  [-23.51715, -46.6595],
  [-23.51745, -46.6575],
  [-23.51770, -46.6555],
];

// Centro do mapa em São Paulo (focado na Marginal Tietê)
const CENTER_SP = [-23.5161, -46.6655];

const MapaTransito = ({ velocidadeMedia, erro, carregando }) => {
  const statusInfo = getStatusEColor(velocidadeMedia);
  const temDadosValidos = velocidadeMedia !== null && velocidadeMedia !== undefined && Number.isFinite(Number(velocidadeMedia));

  return (
    <div className="w-full bg-[#2F3E46] border border-[#2F3E46] rounded-2xl shadow-[0_0_30px_rgba(0,67,190,0.48)] overflow-hidden my-6">
      {/* Cabeçalho do Card */}
      <div className="bg-[#263239] px-6 py-4 border-b border-[#1f292d]">
        <h2 className="text-2xl font-bold text-white text-center">
          Simulação Visual do Trânsito em Tempo Real
        </h2>
        <p className="text-sm text-gray-300 text-center mt-1">
          Monitoramento via sensor FIWARE em trecho da Marginal Tietê - São Paulo / SP
        </p>
      </div>

      <div className="p-4 sm:p-6 flex flex-col gap-4">
        {/* Painel de Informações do Trecho */}
        <div className="bg-[#1B263B] p-4 rounded-xl border border-gray-700 flex flex-col justify-center items-center gap-4 text-center">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Via Monitorada</span>
            <span className="text-lg font-bold text-white">Marginal Tietê (Trecho Anhembi / Ponte das Bandeiras)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Velocidade Atual</span>
              <span className="text-xl font-bold text-white">
                {temDadosValidos ? `${Number(velocidadeMedia).toFixed(1)} km/h` : "Sem dados"}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Estado do Trânsito</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block animate-pulse"
                  style={{ backgroundColor: statusInfo.cor }}
                />
                <span className="text-lg font-bold" style={{ color: statusInfo.cor }}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tratar estados de Carregamento e Erro */}
        {carregando && (
          <div className="bg-blue-900/40 border border-blue-500/50 text-blue-200 px-4 py-2 rounded-lg text-sm text-center">
            Aguardando primeiras medições do FIWARE...
          </div>
        )}

        {erro && (
          <div className="bg-red-900/40 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm text-center">
            {erro}
          </div>
        )}

        {/* Mapa Leaflet */}
        <div className="w-full h-[360px] sm:h-[420px] rounded-xl overflow-hidden border border-gray-700 relative z-0">
          <MapContainer
            center={CENTER_SP}
            zoom={14}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Linha destacada do trecho único da Marginal Tietê */}
            {/* Camada 1: Halo suave (cor desaturada, baixa opacidade, espessura maior) */}
            <Polyline
              positions={TRECHO_MARGINAL_TIETE}
              pathOptions={{
                color: statusInfo.cor,
                weight: 12,
                opacity: 0.18,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Camada 2: Destaque principal (cor original, opacidade normal, espessura menor) */}
            <Polyline
              positions={TRECHO_MARGINAL_TIETE}
              pathOptions={{
                color: statusInfo.cor,
                weight: 5,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            >
              <Popup>
                <div className="text-black text-sm font-sans p-1">
                  <strong>Marginal Tietê (Trecho)</strong><br />
                  Velocidade: {temDadosValidos ? `${Number(velocidadeMedia).toFixed(1)} km/h` : "Sem dados"}<br />
                  Estado: <span style={{ color: statusInfo.cor, fontWeight: 'bold' }}>{statusInfo.label}</span>
                </div>
              </Popup>
            </Polyline>

            {/* Marcador do Sensor no trecho - localizado no trecho central da Marginal Tietê */}
            <Marker position={[-23.5161, -46.6655]}>
              <Popup>
                <div className="text-black text-sm font-sans p-1">
                  <strong>Estação de Medição FIWARE</strong><br />
                  Localização: Marginal Tietê - SP<br />
                  Sensor: urn:ngsi-ld:Traffic:003
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Aviso de Simulação Visual */}
        <div className="bg-[#141d2c] border border-amber-500/30 p-3 rounded-lg text-center">
          <p className="text-xs text-amber-200/90 leading-relaxed">
            ⚠️ <strong>Aviso de Simulação:</strong> A cor e o status exibidos no mapa representam uma <u>simulação visual</u> baseada exclusivamente no dado de velocidade média recebido pelo sensor (FIWARE) para este trecho específico. Não constitui uma medição em tempo real de toda a extensão da Marginal Tietê nem do trânsito oficial da cidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapaTransito;
