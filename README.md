# Repositorie-Front-End

Repositório do **Checkpoint 5** de Front-End Design (1ES, 2026), com as 4 atividades das últimas semanas: revisão, Bootstrap, Tailwind e vibecode.

- **Disciplina:** Front-End Design – 1ES – 2026
- **Professora:** Cyntia Sayuri
- **Desenvolvimento:** individual

## Atividades

| # | Conteúdo | Projeto | Tecnologias |
|---|----------|---------|-------------|
| 1 | Revisão | NovaCore | HTML5, CSS3 |
| 2 | Bootstrap | Confeitaria Doce Arte | Bootstrap 5.3.3 |
| 3 | Tailwind | Fio & Prensa | Tailwind CSS 3.4.17 |
| 4 | Vibecode | EuSouOMilior | Node.js, JavaScript, APIs |

## Estrutura

```
Repositorie-Front-End/
├── 01-revisao-novacore/
│   ├── index.html
│   ├── style.css
│   └── reset.css
├── 02-bootstrap-doce-arte/
│   ├── index.html
│   └── bolo.jpg
├── 03-tailwind-fio-e-prensa/
│   ├── index.html
│   └── images/
├── 04-vibecode-eusuoomilior/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── public/
│       ├── index.html
│       ├── css/
│       │   ├── style.css
│       │   └── responsive.css
│       └── js/
│           └── app.js
└── README.md
```

## 1. Revisão: NovaCore

Landing page institucional de uma empresa de tecnologia. Feita só com HTML e CSS.

- Menu com âncoras e rolagem suave.
- Seções: início, serviços, sobre nós, clientes, contato e rodapé.
- Seis cards de serviços em CSS Grid.
- Três depoimentos de clientes.
- Formulário de contato (nome, e-mail, empresa e mensagem).
- Variáveis CSS para cores e fonte (Roboto).

**Como abrir:** abra `index.html` no navegador.

## 2. Bootstrap: Confeitaria Doce Arte

Site de uma confeitaria fictícia, feito com componentes do Bootstrap.

- Navbar responsiva com menu recolhível.
- Hero com imagem do bolo.
- Carrossel de depoimentos.
- Accordion de perguntas frequentes.
- Modal para montar o pedido.

O Bootstrap é carregado por CDN. Precisa de internet.

**Como abrir:** abra `index.html` no navegador.

## 3. Tailwind: Fio & Prensa

Site de um ateliê de encadernação artesanal, estilizado só com classes utilitárias.

- Paleta própria com cores arbitrárias (terracota, verde-musgo, bege).
- Fontes Fraunces e Work Sans.
- Hero com lista de materiais.
- Seção "O ofício em quatro etapas".
- Galeria de peças em duas colunas.
- Depoimento e rodapé com endereço e horário.
- Layout responsivo com `sm:`, `md:` e `grid`.

O Tailwind é carregado por CDN. Precisa de internet.

**Como abrir:** abra `index.html` no navegador.

## 4. Vibecode: EuSouOMilior

Site de futebol com resultados, tabelas, notícias e um jogo de pênaltis.

> Esta é a única atividade em que o uso de IA é permitido, conforme o Checkpoint 5.

### Recursos

- **Resultados:** partidas de hoje, ao vivo, próximas e encerradas.
- **Competições:** classificação, jogos e artilheiros de 12 ligas (Brasileirão, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Primeira Liga, Eredivisie, Championship, Champions League, Eurocopa e Copa do Mundo).
- **Notícias:** busca por termo e filtro por categoria.
- **Desafio:** jogo de cinco pênaltis contra o goleiro.
- **Interface:** layout responsivo, menu mobile, barra de progresso e animações de rolagem.

### Requisitos

- Node.js 18 ou superior.
- Chaves gratuitas das APIs (necessárias para dados reais).

### Configuração

1. Crie uma conta em [football-data.org](https://www.football-data.org/client/register) e copie a chave.
2. Crie uma conta em [GNews](https://gnews.io/) e copie a chave.
3. Entre na pasta do projeto: `cd 04-vibecode-eusuoomilior`.
4. Copie `.env.example` para `.env`.
5. Preencha as variáveis:

```env
FOOTBALL_DATA_KEY=sua_chave_aqui
GNEWS_KEY=sua_chave_aqui
PORT=3000
```

6. Inicie o servidor:

```bash
npm start
```

7. Abra http://localhost:3000.

O servidor lê o `.env` sem dependências extras. **Nunca publique o arquivo `.env`.**

### Arquitetura

- `server.js`: servidor HTTP em Node puro. Faz proxy das APIs, guarda cache em memória e serve os arquivos estáticos.
- `public/`: front-end em HTML, CSS e JavaScript puros.
- As chaves ficam só no backend. O navegador nunca as recebe.

### Rotas da API

| Rota | Descrição |
|------|-----------|
| `GET /api/config` | Lista competições e status das chaves |
| `GET /api/matches?tab=` | Partidas (`today`, `live`, `upcoming`, `finished`) |
| `GET /api/competitions/:code/standings` | Classificação |
| `GET /api/competitions/:code/matches` | Jogos da competição |
| `GET /api/competitions/:code/scorers` | Artilheiros |
| `GET /api/news?q=&cat=` | Notícias por busca ou categoria |

### Limites das APIs gratuitas

- football-data.org (plano Free): 12 competições, placares com atraso, dados ao vivo podem não estar disponíveis.
- GNews (plano Free): limite diário de consultas e notícias com atraso.
- O conteúdo das notícias fica na fonte original. Os links abrem a matéria.

### Créditos

Foto do jogador: Jonas Augustin, via [Unsplash](https://unsplash.com/photos/a-football-player-kicking-a-ball-_lrPruJVt4w), sob a licença Unsplash.

## Uso de IA

Conforme o Checkpoint 5, IA só foi usada na atividade 4 (vibecode). As atividades 1, 2 e 3 foram feitas sem IA.

## Autor

[kaicklima284737](https://github.com/kaicklima284737)
