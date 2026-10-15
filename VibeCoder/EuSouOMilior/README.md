# EuSouOMilior

Site responsivo de futebol com resultados, tabelas, notícias e disputa de pênaltis.

## Requisitos
- Node.js 18 ou superior
- Chaves gratuitas das APIs (opcional, mas necessárias para dados reais)

## Configuração
1. Crie uma conta em https://www.football-data.org/client/register
2. Copie sua chave em https://www.football-data.org/client
3. Crie uma conta em https://gnews.io/ e copie a chave da API
4. Copie `.env.example` para `.env`
5. Preencha `FOOTBALL_DATA_KEY` e `GNEWS_KEY`
6. Execute `npm start`
7. Abra http://localhost:3000

O servidor lê `.env` sem dependências adicionais. Nunca publique o arquivo `.env`.
As APIs gratuitas têm limites e cobertura restrita. O football-data.org Free
oferece 12 competições e placares atrasados; dados ao vivo podem não estar
disponíveis. O GNews Free limita consultas diárias e atrasa notícias.
O conteúdo de notícias permanece no site de origem: os links abrem a matéria.

## APIs
- football-data.org v4: partidas, tabelas e artilheiros. Cabeçalho `X-Auth-Token`.
- GNews v4: notícias e pesquisa. Chave enviada pelo backend, nunca pelo navegador.

## Estrutura
- `server.js`: servidor HTTP, proxy seguro, cache e rotas de API.
- `public/index.html`: estrutura da página.
- `public/css/style.css`: estilos principais e animações.
- `public/css/responsive.css`: ajustes para telas menores.
- `public/js/app.js`: interação e renderização.

### Créditos da imagem do jogador
A foto do jogador utiliza uma imagem de Jonas Augustin, via Unsplash, sob a licença Unsplash: https://unsplash.com/photos/a-football-player-kicking-a-ball-_lrPruJVt4w
