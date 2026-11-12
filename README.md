# Portfólio — Engenharia de Computação

Portfólio pessoal estático feito com **HTML5, CSS3 e JavaScript puro**, pronto para o GitHub Pages.
Não usa backend, frameworks, bibliotecas, npm nem etapa de build.

```
.
├── index.html        # Estrutura e todo o conteúdo textual
├── style.css         # Estilos (variáveis de cor, tipografia e espaçamento em :root)
├── script.js         # Menu, dados configuráveis (CONFIG), GitHub e animações
├── assets/
│   └── favicon.svg   # Ícone do site
└── README.md
```

## Visualizar localmente

Abrir o `index.html` direto no navegador funciona. Para reproduzir o comportamento do GitHub Pages
(e da API do GitHub), prefira um servidor local simples:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Onde alterar os dados pessoais

| O quê | Onde |
|---|---|
| Nome | `index.html` — busque por `Seu Nome` (título da aba, Open Graph, cabeçalho, hero e rodapé) |
| Instituição da Mecânica Automotiva | `index.html` — busque por `Instituição a informar` |
| Foto, currículo, LinkedIn, e-mail, WhatsApp, GitHub | bloco `CONFIG` no topo do `script.js` |
| Links de comprovação das certificações | `CONFIG.certificationLinks` |
| Datas dos marcos da formação | `CONFIG.milestones` |
| Textos (sobre, competências, projetos) | diretamente no `index.html` |
| Cores e fontes | variáveis em `:root` no `style.css` |

Os comentários `PERSONALIZAR` no HTML marcam os pontos de edição.
Campos vazios (`''`) no `CONFIG` são tratados como “não informado” e **não aparecem** na página.

### Contato

```js
contact: {
  linkedin: 'https://www.linkedin.com/in/seu-perfil/',
  email: 'voce@exemplo.com',
  whatsapp: '+55 51 99999-9999', // código do país + DDD; o script remove espaços e símbolos
},
```

O WhatsApp vira um link `https://wa.me/5551999999999`. O e-mail vira `mailto:`.
O link do GitHub é gerado a partir de `CONFIG.github.username`.

> Os links de contato são inseridos pelo JavaScript. Sem JavaScript, a seção mostra um aviso.

## Foto e currículo

1. Coloque os arquivos em `assets/` usando nomes sem acentos e sem espaços, por exemplo `assets/foto.jpg` e `assets/curriculo.pdf`.
2. No `script.js`:

```js
photo: { src: 'assets/foto.jpg', width: 600, height: 600 }, // dimensões reais da imagem
resume: 'assets/curriculo.pdf',
```

- Prefira uma foto quadrada, entre 400 e 800 px, em JPG ou WebP, com menos de ~150 KB.
- Enquanto `resume` estiver vazio, o hero exibe “Currículo em PDF disponível em breve” em vez de um botão.
- Se o arquivo da foto não for encontrado, o espaço reservado continua aparecendo (sem imagem quebrada).
- Use sempre caminhos relativos (`assets/...`), nunca começando com `/`.

## Substituir projetos demonstrativos por reais

Os cinco projetos atuais estão marcados como **“Ideia de projeto”**. Para cada projeto real, no `index.html`:

1. Troque o texto do selo `<span class="badge">Ideia de projeto</span>` por `Em desenvolvimento` ou `Concluído`
   e adicione a classe `badge--signal` (ex.: `<span class="badge badge--signal">Concluído</span>`).
2. Troque `Tecnologias sugeridas` por `Tecnologias utilizadas` e ajuste as etiquetas.
3. Reescreva *Problema* e *Proposta* com o que foi de fato feito (você pode renomear “Proposta” para “Solução”).
4. Dentro de `<footer class="project-links"></footer>`, adicione o link do repositório:

```html
<a class="text-link" href="https://github.com/SEU-USUARIO/SEU-REPOSITORIO" target="_blank" rel="noopener noreferrer">Ver repositório</a>
```

5. Opcional: troque o SVG da ilustração por uma imagem real, com dimensões e lazy loading:

```html
<img src="assets/projetos/estacao.webp" alt="Estação meteorológica montada em protoboard" width="640" height="384" loading="lazy">
```

Remova os cards que não pretende desenvolver e, quando todos forem reais, ajuste o parágrafo de introdução da seção.

## Seção GitHub

```js
github: {
  username: 'seu-usuario',
  featured: ['estacao-meteorologica-esp32', 'braco-robotico'], // opcional, na ordem desejada
  autoSelect: true,
  limit: 6,
  cacheMinutes: 60,
},
```

- **Sem `username`:** nenhuma requisição é feita e a seção exibe uma mensagem neutra.
- **Com `featured`:** apenas esses repositórios aparecem, na ordem da lista (prioridade sobre a seleção automática).
- **Sem `featured` e com `autoSelect: true`:** mostra até `limit` repositórios públicos próprios, sem forks e arquivados,
  ordenados pela atualização mais recente. O critério aparece escrito na página.
- Usa a API pública (`api.github.com`) **sem token** — não adicione tokens ao código.
  O limite anônimo é de 60 requisições por hora por IP; por isso a resposta fica em cache no `localStorage`
  pelo tempo de `cacheMinutes`. Se a API falhar, o cache vencido é usado (com aviso) ou uma mensagem de erro é exibida
  junto do link para o perfil.

## Datas da trajetória

```js
milestones: {
  'mecanica-automotiva': '2022',
  'cursos-senai': '2023-07',
  pucrs: '2024-03',
  projetos: '2024',
},
```

Formato `AAAA` ou `AAAA-MM`. As datas aparecem nos itens preenchidos; a lista só é reordenada
cronologicamente quando **todas** as datas forem informadas. Também é possível reordenar os `<li>` à mão no HTML.

## Publicar no GitHub Pages

1. Crie um repositório público no GitHub (ex.: `portfolio`), ou `seu-usuario.github.io` para publicar na raiz do domínio.
2. Envie os arquivos para a branch `main`:

```bash
git init
git add .
git commit -m "Primeira versão do portfólio"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

3. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   escolha **Branch: `main`** e pasta **`/ (root)`**, e salve.
4. Após alguns minutos o site estará em `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

Todos os caminhos do projeto são relativos, então o site funciona nesse subdiretório.
Depois de publicado, você pode descomentar `og:url` e `og:image` no `<head>` com as URLs reais.

## Decisões de acessibilidade e desempenho

- HTML semântico, um único `h1`, link “Pular para o conteúdo”, foco visível e alvos de toque ≥ 44 px.
- Menu móvel com `aria-expanded`, fechamento por `Esc` (o foco volta ao botão) e ao tocar fora.
- Sem JavaScript, o menu fica sempre visível e todo o conteúdo textual permanece acessível.
- Animações só de `opacity`/`translate`, ativadas apenas quando o JavaScript confirma suporte; desligadas com `prefers-reduced-motion`.
- Fontes do sistema, ícones SVG inline, nenhuma dependência externa além da API opcional do GitHub.
- Dados vindos da API são inseridos com `textContent`, nunca com `innerHTML`.

## Antes de compartilhar

- [ ] Nome em `index.html` (todas as ocorrências de `Seu Nome`)
- [ ] Instituição da certificação em Mecânica Automotiva
- [ ] `CONFIG.github.username`
- [ ] `CONFIG.contact` (LinkedIn, e-mail, WhatsApp)
- [ ] Foto em `assets/` + `CONFIG.photo`
- [ ] Currículo PDF em `assets/` + `CONFIG.resume`
- [ ] Links de comprovação das certificações (opcional)
- [ ] Datas dos marcos da formação (opcional)
- [ ] Projetos: manter como “Ideia de projeto” ou substituir por projetos reais com repositório
