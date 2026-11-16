# SMART TRAFFIC

Aplicação web para acompanhar dados de trânsito recebidos pelo FIWARE. O painel consulta uma entidade do Orion Context Broker, calcula a velocidade média em intervalos de 30 segundos e representa o resultado em um trecho da Marginal Tietê, em São Paulo.

## O que a aplicação mostra

- Mapa interativo centrado em um trecho da Marginal Tietê, entre a região do Anhembi e a Ponte das Bandeiras.
- Velocidade mais recente recebida e velocidade média calculada em janelas de 30 segundos.
- Estado visual do trânsito associado à velocidade média:

| Velocidade média | Estado | Cor |
| --- | --- | --- |
| Até 20 km/h | Congestionado | Vermelho |
| Acima de 20 até 40 km/h | Moderado | Amarelo |
| Acima de 40 km/h | Livre | Verde |
| Dado ausente ou inválido | Sem dados | Cinza |

- Métricas de estado do sistema, veículos detectados, quantidade de medições e contagem regressiva para a próxima média.
- Mensagens de carregamento e erro de conexão.

## Como os dados são obtidos

O front-end consulta a entidade abaixo usando NGSI-v2 e as opções `keyValues`:

```text
GET http://184.195.90.61:1026/v2/entities/urn:ngsi-ld:Traffic:003?options=keyValues
```

A requisição inclui os cabeçalhos FIWARE:

```text
fiware-service: smart
fiware-servicepath: /
```

A consulta é repetida a cada segundo. Um registro é contado como nova medição quando seu `TimeInstant` muda. O campo `speed_kmh` é usado para calcular a média das medições recebidas nos últimos 30 segundos. A aplicação também exibe atributos como `s` (estado do sistema) e `vehicle_count` (veículos detectados), quando presentes.

A média é usada para colorir o trecho no mapa. Antes da primeira média concluída, a velocidade instantânea pode ser exibida como referência. Caso o valor esteja ausente ou não seja numérico, a interface indica que não há dados válidos.

## Tecnologias

- React 19 e JavaScript
- Vite
- Tailwind CSS 4
- React Leaflet e Leaflet
- OpenStreetMap para os mapas
- FIWARE Orion Context Broker (NGSI-v2)

## Executar localmente

Requisitos: Node.js e npm instalados, além de acesso à entidade FIWARE configurada em `src/trafficService.js`.

```bash
npm install
npm run dev
```

O Vite informa no terminal o endereço local, normalmente `http://localhost:5173`.

Comandos disponíveis:

```bash
npm run dev      # inicia o servidor de desenvolvimento
npm run build    # gera a versão de produção em dist/
npm run preview  # serve localmente a versão de produção
npm run lint     # executa o ESLint
```

## Estrutura principal

```text
.
├── api/
│   └── fiware.js                 # endpoint serverless/proxy FIWARE
├── src/
│   ├── components/
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   └── MapaTransito.jsx       # mapa, trecho e legenda visual do estado
│   ├── css/
│   │   └── index.css
│   ├── pages/                     # páginas auxiliares existentes
│   ├── App.jsx                    # consulta, média e painel principal
│   ├── trafficService.js          # consulta à entidade FIWARE
│   └── main.jsx                   # inicialização React
├── index.html
├── package.json
└── vite.config.js
```

## Integração e configuração

O endereço do Orion usado pelo painel principal está definido na constante `API_URL` de `src/trafficService.js`. Para apontar a aplicação a outro servidor, ajuste esse valor e confirme que o navegador pode acessá-lo (incluindo as regras de CORS do servidor).

O projeto também contém `api/fiware.js`, um handler serverless que encaminha requisições POST para um servidor FIWARE informado na chamada. Ele valida o formato de IP e permite as portas `1026`, `4041` e `8666`. A página principal atual faz a consulta diretamente pelo serviço em `src/trafficService.js`; o handler serverless não participa desse fluxo principal.

A aplicação espera que a entidade `urn:ngsi-ld:Traffic:003` forneça, conforme os dados disponíveis:

- `speed_kmh`: velocidade em km/h;
- `TimeInstant`: identificador temporal da medição, usado para reconhecer atualizações;
- `vehicle_count`: quantidade de veículos detectados;
- `s`: estado do sistema.

## Mapa e atribuição

O mapa é exibido com Leaflet e React Leaflet, usando os tiles do OpenStreetMap. A atribuição aos contribuidores do OpenStreetMap é apresentada no próprio mapa. O trecho destacado possui coordenadas definidas em `src/components/MapaTransito.jsx`.

## Observações

- A disponibilidade e a atualização dos valores dependem do Orion Context Broker e da origem que publica os dados nele.
- A média é calculada no navegador a partir das atualizações observadas durante cada intervalo de 30 segundos; se nenhuma medição válida chegar no intervalo, não há uma nova média para esse período.
- O mapa identifica visualmente um trecho para demonstração. A associação entre o sensor e a via é uma representação da interface, conforme o aviso exibido na página.
- A camada de mapa do OpenStreetMap requer conexão com a internet.
