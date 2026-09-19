# Documentação de Projeto: Site Animado - Setembro Amarelo

**Prazo de Entrega:** Quarta-feira, 23/09/2026  
**Instituição:** Faculdade FANS  
**Objetivo:** Criar uma experiência web interativa, acolhedora e animada para a campanha do Setembro Amarelo, focada em transmitir apoio emocional e fornecer contatos de emergência.

## 1. Detalhamento da Experiência e Interface (UI/UX)

### Identidade Visual

* **Fundo (Background):** Cinza claro levemente amarelado (ex: `#f7f6f2` ou `#f5f4f0`). Transmite calma e tira o "peso" do branco puro, combinando com a temática.
* **Cor da Fonte:** Marrom bem escuro (ex: `#3e2723` ou `#2d1b19`). Oferece excelente contraste e legibilidade, sendo mais suave e orgânico que o preto absoluto.

### Quadro 1: O Primeiro Contato

* **Ação:** Ao abrir o site, a tela exibe apenas o texto.
* **Texto:** "Olá."
* **Animação:** Efeito de digitação (*typewriter*), seguido de um *fade in* (surgimento suave).
* **Duração:** O texto permanece por 3 segundos na tela e depois desaparece suavemente (*fade out*).

### Quadro 2: O Acolhimento

* **Texto:** "Você não está sozinho(a)."
* **Elementos Visuais:**
  * Laço amarelo do Setembro Amarelo.
  * Seta discreta apontando para baixo (indicando que há mais conteúdo).
* **Animação:**
  * O texto surge com *fade in* suave, logo após o sumiço do Quadro 1.
  * O laço amarelo é desenhado na tela (animação de traço em SVG) como se uma fita estivesse se enrolando sozinha.
  * A seta aparece com um movimento cíclico e sutil (*bounce* vertical).

### Quadro 3: A Esperança e o Apoio

* **Ação:** O usuário rola a página para baixo (*scroll*). A seta do quadro anterior sobe e desaparece.
* **Elementos Visuais:**
  * Árvore amarela estilizada.
  * Folhas caindo continuamente de forma suave.
* **Texto/Poema:**
  "A chuva irá passar,
  vale a pena esperar pela primavera."
* **Contatos de Apoio (Centralizados):**
  * **188** - CVV (Centro de Valorização da Vida)
  * **192** - SAMU (Emergências)
* **Identificação Acadêmica e Rodapé (Footer):**
  * **Logo da Faculdade FANS:** Posicionada centralizada, logo acima do badge do GitHub. Aparece com transição/suavidade (*fade in*) acompanhando o surgimento das informações do Quadro 3.
  * **Badge GitHub:** Um *badge* (distintivo) cinza médio, levemente opaco, centralizado e localizado no final do Quadro 3 (abaixo da logo da FANS), contendo o ícone do GitHub à esquerda e o texto "GitHub", funcionando como link para o repositório do projeto.

## 2. Recomendações de Tecnologias

Para um projeto de página única (Single Page Application / Landing Page) focado em animações, a melhor abordagem é manter a *stack* leve e performática.

* **Estrutura:** HTML5 Semântico.
* **Estilização:** CSS3 puro ou **Tailwind CSS** (o Tailwind é excelente com IAs como o Codex, pois permite estilizar diretamente no HTML).
* **Animações (O coração do projeto):**
  * **GSAP (GreenSock):** A melhor biblioteca JavaScript para as transições de quadros, controle de *timeline* (Quadro 1 para Quadro 2) e *ScrollTrigger* (para descer ao Quadro 3).
  * **LottieFiles ou SVG Animado:** Para o laço amarelo se forming. Um arquivo Lottie (.json) é extremamente leve e pode ser gerado facilmente. Como alternativa, usar animação de `stroke-dasharray` em CSS para um SVG vetorial.
* **Acessibilidade:** Implementar a *media query* `@media (prefers-reduced-motion: reduce)` no CSS para pausar as folhas caindo caso o usuário tenha sensibilidade a movimento.

## 3. Estrutura Ideal para Manutenção com IA (Codex)

Modelos de linguagem como o Codex funcionam melhor quando o código é modular, bem comentado e possui responsabilidades claras. Arquivos gigantes confundem o contexto da IA.

### Estrutura de Pastas Sugerida

```
/setembro-amarelo
│
├── index.html          # Estrutura de blocos (Quadro 1, 2 e 3)
├── css/
│   └── style.css       # Variáveis de cor, tipografia e animações chave
├── js/
│   ├── main.js         # Lógica de inicialização e transições
│   └── animations.js   # Configurações do GSAP/Lottie isoladas
└── assets/
    ├── laco.svg        # Vetor do laço amarelo
    ├── arvore.svg      # Vetor da árvore
    ├── fans-logo.png   # Logo da Faculdade FANS (SVG ou PNG)
    └── github-icon.svg # Ícone do rodapé
```
