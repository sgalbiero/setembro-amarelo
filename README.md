# Setembro Amarelo — Faculdade FANS

Landing page da campanha Setembro Amarelo, adaptada para rodar continuamente nas telas da universidade e permitir a leitura individual pelo celular. A apresentação reúne quatro quadros, ilustrações vetoriais animadas e contatos de apoio sempre acessíveis.

O projeto usa HTML, CSS e JavaScript modular, sem framework, backend ou dependências externas de execução. Fontes, imagens e SVGs são locais. Não há áudio, formulários, cookies de rastreamento ou coleta de dados.

## Executar localmente

Na raiz do projeto:

```sh
python -m http.server 4173
```

| Modo | Endereço local | Comportamento inicial |
| --- | --- | --- |
| Leitura | http://localhost:4173/ | Navegação manual |
| Telão | http://localhost:4173/?modo=tela | Reprodução automática em loop |

Use um servidor HTTP: abrir `index.html` diretamente por `file://` pode impedir o carregamento dos módulos JavaScript. O modo é escolhido pelo parâmetro da URL, não pela largura da tela.

Para preparar as telas da universidade, consulte o [guia de operação](docs/OPERACAO.md). Publicação e geração do QR code ficam com o hospedador. O QR code deve apontar para o endereço de leitura, sem `modo=tela`.

## Os quatro quadros

| Quadro | Conteúdo e animação | Leitura | Entrada reservada | Total por quadro |
| --- | --- | ---: | ---: | ---: |
| 1 — Abertura | “Olá.” desenhado à mão e identificação da campanha | 1,5 s | 1 s | 2,5 s |
| 2 — Acolhimento | Laço amarelo deslizante, desenho da fita e “Você não está só.” | 8 s | 2,8 s | 10,8 s |
| 3 — Esperança | Ipê deslizante, poema e pétalas caindo | 12 s | 1,4 s | 13,4 s |
| 4 — Apoio | “Há espaço para conversar.”, contatos, marca FANS e pétalas caindo | 8 s | 0,9 s | 8,9 s |

O ciclo normal dura aproximadamente **35,6 segundos** e retorna diretamente do quarto quadro ao primeiro. Os totais incluem o tempo reservado para revelar os elementos; a transição de saída ocorre junto à entrada do próximo quadro.

As durações ficam nos arrays `durations` e `entranceDurations`, em milissegundos, no início de [js/main.js](js/main.js). Com movimento reduzido, os tempos de entrada são removidos e o ciclo dura aproximadamente 29,5 segundos.

## Navegação e reprodução

- As setas permitem ir ao quadro anterior ou seguinte, inclusive entre o último e o primeiro.
- O botão central alterna entre os ícones de reproduzir e pausar, com nome acessível e dica de texto atualizados.
- Navegar pelas setas durante a reprodução suspende o avanço. No modo telão, a reprodução pode retornar após 60 segundos sem nova navegação, desde que não esteja suspensa pelo foco de teclado.
- Uma pausa explícita pelo botão permanece até a pessoa selecionar reproduzir. A versão de leitura não retoma automaticamente após interação.
- Tocar no texto, no laço ou no ipê não pausa a apresentação.
- A navegação por `Tab` suspende o avanço. O foco de teclado é tratado para evitar mudanças de quadro durante a interação.
- Abas ocultas não avançam. Ao voltar a uma aba em reprodução, a contagem do quadro atual reinicia.

Os contatos **CVV 188** e **SAMU 192** são links `tel:` fixos no rodapé. A página não inicia ligações automaticamente.

## Ajustes visuais recentes

- Textos maiores nos três primeiros quadros em desktop; laço ampliado proporcionalmente no segundo.
- Escala ampliada aplicada a partir de 1024 px de largura e 576 px de altura, preservando a composição em telas pequenas ou baixas.
- Traços completos no SVG do “Olá”, com espessura acompanhando a escala e escrita animada preservada.
- Traços escuros da sobreposição do laço alinhados à fita.
- Pétalas animadas nos quadros do ipê e de apoio; a pausa também interrompe sua queda.
- Badges de contato com 44 px de altura, controles com ícones discretos e fundo do rodapé com 80% de opacidade.
- Setas e botão central alinhados ao centro, com indicador de quadro à direita. Em telas estreitas, o indicador ocupa uma linha abaixo para evitar sobreposição.
- Link do GitHub disponível no quadro do ipê no modo de leitura e oculto no modo telão.

### Capturas de referência

As capturas registram etapas específicas da implementação; nem todas representam todos os ajustes posteriores.

| Referência | Captura |
| --- | --- |
| Correção do “Olá” em desktop | [1920 px](docs/screenshots/hello-fixed-1920.png), [1366 px](docs/screenshots/hello-fixed-1366.png) |
| Laço com traços alinhados | [Quadro de acolhimento](docs/screenshots/ribbon-corrected.png) |
| Pétalas no último quadro | [Quadro de apoio](docs/screenshots/closing-petals.png) |
| Composição ampliada do poema | [Quadro do ipê](docs/screenshots/loop-1920-3.png) |

## Acessibilidade e comportamento alternativo

Os quadros inativos recebem `inert` e `aria-hidden`, impedindo interação e leitura indevida durante a apresentação. Os botões mantêm áreas de toque de 44 × 44 px, foco visível e nomes acessíveis; as ilustrações são decorativas.

A preferência `prefers-reduced-motion: reduce` elimina os deslocamentos e oculta as pétalas. Sem JavaScript, os quatro quadros ficam acessíveis por rolagem e os contatos continuam disponíveis.

Os recursos já carregados permitem que a apresentação continue sem novas requisições de rede. Isso não constitui suporte offline persistente: não há service worker, e uma recarga ou reinicialização pode precisar de conexão.

## Organização do código

| Arquivo ou pasta | Responsabilidade |
| --- | --- |
| `index.html` | Quatro quadros, vetores, contatos e controles semânticos |
| `css/style.css` | Layout responsivo, tipografia, transições e preferências de movimento |
| `js/main.js` | Modos de uso, temporizadores, navegação, pausa e foco |
| `js/animations.js` | Ativação e reinício das animações dos quadros |
| `assets/` | Fonte local, marca, ícones e ilustrações |
| `tools/` | Verificações no navegador via Chrome DevTools Protocol |
| `docs/screenshots/` | Capturas de referência geradas nas verificações |

## Verificação

Os scripts usam Node.js com `fetch` e `WebSocket` globais; o ambiente utilizado foi Node.js 24.18.0. Eles esperam o site em `http://127.0.0.1:4173/` e um Chromium de teste com depuração remota em `http://127.0.0.1:9222`.

Use um perfil separado de navegador para os testes. Exemplo de argumentos para iniciar o executável do Chrome:

```text
--remote-debugging-port=9222 --user-data-dir=<pasta-absoluta-do-perfil-de-teste>
```

| Comando | Cobertura |
| --- | --- |
| `node tools/qa-loop.mjs` | Navegação, retorno ao início, quadros inativos, largura, reprodução, pausa, movimento reduzido e ausência de JavaScript |
| `node tools/qa-controls.mjs` | Reprodução automática e pausa explícita pelos controles |
| `node tools/qa-refinements.mjs` | Abertura curta, avanço do ipê com a rede desativada após carregar, toque na ilustração e alinhamento do rodapé |
| `node tools/qa-hello.mjs` | Traços completos do “Olá” em 1920 e 1366 px |
| `node tools/qa-petals.mjs` | Movimento das pétalas no último quadro e captura do laço |

O teste de fluxo usa viewports de 1920 × 1080, 390 × 844, 320 × 568 e 844 × 390. Alguns testes aceleram os temporizadores longos; eles não substituem um ensaio prolongado. Scripts que geram capturas sobrescrevem os respectivos arquivos.

`tools/qa-and-capture.mjs` corresponde à experiência interativa anterior, de três quadros. Suas expectativas não são critérios de aceite da versão atual. As capturas `loop-*`, `hello-fixed-*`, `refinements-*`, `ribbon-corrected.png` e `closing-petals.png` pertencem à evolução da apresentação de quatro quadros; as demais são referências históricas.

A validação na tela física da universidade — leitura à distância, tela cheia, recuperação após reinício e execução por duas horas — permanece uma etapa operacional. Não foi realizada pelos testes desktop.
