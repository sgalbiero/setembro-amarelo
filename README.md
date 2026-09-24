# Setembro Amarelo — Faculdade FANS

Página estática com quatro quadros: abertura, acolhimento, esperança e apoio. Mantém os vetores originais do laço e do ipê, com animações e transições laterais.

## Executar

```sh
python -m http.server 4173
```

- Leitura e interação: `http://localhost:4173/`
- Telão, com reprodução automática: `http://localhost:4173/?modo=tela`

O hospedador é responsável pela publicação e pelo QR code. O QR deve apontar para o endereço padrão, sem `modo=tela`.

## Operação

O modo telão começa automaticamente. Cada quadro permanece por 1,5, 8, 12 e 8 segundos de leitura, respectivamente, acrescidos de 1, 2,8, 1,4 e 0,9 segundos para entrada e revelação dos elementos. A abertura dura 2,5 segundos no total; o ciclo completo dura aproximadamente 34 segundos. Os tempos estão no início de `js/main.js`.

Anterior e próximo permitem navegar nos dois modos, inclusive do último ao primeiro. A navegação pelas setas suspende a reprodução; tocar na cena não pausa o ciclo. No telão, ela retorna após 60 segundos de inatividade. Pausar explicitamente permanece em vigor até selecionar Reproduzir. O modo padrão começa em leitura manual e não retoma automaticamente após interação.

O teclado suspende o avanço enquanto há foco de navegação. Ao sair dos controles, o ciclo pode continuar. Abas ocultas não avançam; ao voltar, a contagem do quadro reinicia. Não há som, formulários, rastreamento ou dependências externas de execução.

Os contatos ficam fixos. Quadros inativos não recebem foco e são ocultados de leitores de tela. Movimento reduzido elimina os deslocamentos e as pétalas; os tempos de leitura são preservados. Sem JavaScript, os quatro quadros ficam disponíveis por rolagem.

## Verificação

`tools/qa-loop.mjs` valida o fluxo atual via Chrome DevTools em `http://127.0.0.1:9222`, com o site em `http://127.0.0.1:4173`. Executar com Node 22 ou superior:

```sh
node tools/qa-loop.mjs
```

O teste verifica navegação, retorno ao início, isolamento dos quadros inativos, largura do conteúdo, pausa explícita e avanço automático em viewports de 1920×1080, 390×844, 320×568 e 844×390. Salva capturas em `docs/screenshots/loop-*`. Os temporizadores longos são acelerados apenas no teste de reprodução.

`tools/qa-and-capture.mjs` e capturas sem prefixo `loop-` documentam o fluxo anterior e não são critérios de aceite da nova apresentação.

Antes da exibição pública, verificar na tela real: leitura à distância, funcionamento em tela cheia, reinicialização do equipamento e execução contínua por duas horas. Esses testes operacionais não são substituídos pela emulação desktop.

### Ajustes de reprodução e rodapé

`node tools/qa-refinements.mjs` verifica a abertura curta, o avanço do ipê com a rede desativada após o carregamento, ausência de pausa ao tocar na ilustração, badges de 44 px e alinhamento dos controles em desktop e celular. Usa o mesmo servidor e Chrome DevTools descritos acima.
