# SMART TRAFFIC

Aplicação web para acompanhar dados de trânsito recebidos pelo FIWARE. O painel consulta uma entidade do Orion Context Broker, calcula a velocidade média em intervalos de 30 segundos e representa o resultado em um trecho da Marginal Tietê, em São Paulo.


**Acesse a página:** [SMART TRAFFIC](https://smart-traffic-blush-xi.vercel.app/)

**Acesse a Wokwi:** [PROTÓTIPO WOKWI](https://wokwi.com/projects/480448466731941889)

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

O front-end consulta o endpoint same-origin `/api/traffic`. Em produção, esse endpoint serverless consulta a entidade abaixo usando NGSI-v2 e as opções `keyValues`:

```text
GET http://184.195.90.61:1026/v2/entities/urn:ngsi-ld:Traffic:003?options=keyValues
```

A requisição do servidor à AWS inclui os cabeçalhos FIWARE:

```text
fiware-service: smart
fiware-servicepath: /
```

A URL base do Orion é configurada pela variável de ambiente `FIWARE_ORIGIN`. A consulta é repetida a cada segundo. Um registro é contado como nova medição quando seu `TimeInstant` muda. O campo `speed_kmh` é usado para calcular a média das medições recebidas nos últimos 30 segundos. A aplicação também exibe atributos como `s` (estado do sistema) e `vehicle_count` (veículos detectados), quando presentes.

A média é usada para colorir o trecho no mapa. Antes da primeira média concluída, a velocidade instantânea pode ser exibida como referência. Caso o valor esteja ausente ou não seja numérico, a interface indica que não há dados válidos.

## Tecnologias

- React 19 e JavaScript
- Vite
- Tailwind CSS 4
- React Leaflet e Leaflet
- OpenStreetMap para os mapas
- FIWARE Orion Context Broker (NGSI-v2)

## Executar localmente

Requisitos: Node.js e npm instalados, além de acesso à entidade FIWARE configurada por `FIWARE_ORIGIN`.

Crie um arquivo `.env.local` na raiz com a URL base do Orion:

```env
FIWARE_ORIGIN=http://184.195.90.61:1026
```

O Vite usa essa URL para encaminhar localmente `/api/traffic` ao Orion. A variável fica no servidor de desenvolvimento e não é incluída no bundle do navegador.

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
│   ├── fiware.js                 # proxy legado para outras operações FIWARE
│   └── traffic.js                # proxy serverless de leitura do trânsito
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

Configure `FIWARE_ORIGIN` como URL base do Orion, sem caminho de entidade, credenciais, query string ou fragmento. Para a instância indicada neste projeto, o valor é `http://184.195.90.61:1026`.

### Vercel

No painel do projeto Vercel, abra **Settings → Environment Variables** e crie:

| Variável | Valor | Ambientes |
| --- | --- | --- |
| `FIWARE_ORIGIN` | `http://184.195.90.61:1026` | Production, Preview e Development, conforme necessário |

Depois de salvar ou alterar a variável, faça um novo deploy para que a função serverless receba a configuração. A página acessa `/api/traffic` no mesmo domínio HTTPS da aplicação; o navegador não chama diretamente a URL HTTP da AWS.

### Acesso da Vercel à AWS

O endpoint indicado é `184.195.90.61:1026`. O código não altera firewall nem regras da AWS. Confirme no servidor e nos grupos de segurança/firewall que o Orion está ativo e que a porta 1026 aceita conexões de saída da infraestrutura Vercel. A Vercel não oferece um conjunto fixo de IPs de saída em todos os planos; se a AWS exigir allowlist de IP, use uma solução de saída estática compatível com a infraestrutura em uso, em vez de abrir a porta para qualquer origem. Prefira restringir o acesso ao Orion ao necessário.

O endpoint `api/traffic.js` só encaminha a consulta fixa da entidade de trânsito para o host configurado no servidor. Ele não aceita uma URL de destino fornecida pelo navegador.

O projeto também contém `api/fiware.js`, um proxy legado usado por componentes auxiliares de controle FIWARE e separado da leitura de trânsito. A página principal usa exclusivamente `/api/traffic`.

A aplicação espera que a entidade `urn:ngsi-ld:Traffic:003` forneça, conforme os dados disponíveis:

- `speed_kmh`: velocidade em km/h;
- `TimeInstant`: identificador temporal da medição, usado para reconhecer atualizações;
- `vehicle_count`: quantidade de veículos detectados;
- `s`: estado do sistema.

## Validar a conexão

Localmente, com `FIWARE_ORIGIN` configurada em `.env.local`, inicie `npm run dev` e consulte `http://localhost:5173/api/traffic`. A resposta esperada é um objeto JSON da entidade. Uma resposta de erro 500 indica variável ausente/inválida; erros 502 indicam indisponibilidade, timeout ou resposta inválida do Orion.

Após o deploy, abra `https://SEU-DOMINIO/api/traffic` no navegador. Confirme que retorna JSON e que o painel atualiza os dados. Se ocorrer timeout ou erro de conexão, verifique a variável no ambiente correto da Vercel, faça novo deploy e confirme a acessibilidade da porta 1026 a partir da Vercel na AWS.

## Mapa e atribuição

O mapa é exibido com Leaflet e React Leaflet, usando os tiles do OpenStreetMap. A atribuição aos contribuidores do OpenStreetMap é apresentada no próprio mapa. O trecho destacado possui coordenadas definidas em `src/components/MapaTransito.jsx`.

## Observações

- A disponibilidade e a atualização dos valores dependem do Orion Context Broker e da origem que publica os dados nele.
- A média é calculada no navegador a partir das atualizações observadas durante cada intervalo de 30 segundos; se nenhuma medição válida chegar no intervalo, não há uma nova média para esse período.
- O mapa identifica visualmente um trecho para demonstração. A associação entre o sensor e a via é uma representação da interface, conforme o aviso exibido na página.
- A camada de mapa do OpenStreetMap requer conexão com a internet.




