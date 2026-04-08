# Stack Tecnológico

## Linguagens

- **TypeScript**: Linguagem principal para pacotes e aplicações
- **Vue 3**: Framework frontend para interface administrativa
- **HTML/CSS/JavaScript**: Para conteúdo web

## Framework Backend

- **@cmmv/core**: Framework customizado para serviços e módulos
- **@cmmv/repository**: Camada de acesso a dados
- **@cmmv/http**: Comunicação HTTP
- **@cmmv/auth**: Sistema de autenticação

## Banco de Dados

- Não especificado no código, mas usa Repository pattern
- Entidades definidas via decorators `@ContractField`

## Ferramentas de Build

- **tsup**: Para build de pacotes TypeScript
- **Vite**: Para aplicação admin (Vue 3)
- **TypeScript 5.8.2**: Compilador

## Dependências Principais

### @cmmv/rss-aggregation
- **xml2js**: Parser de XML para RSS/Atom
- **@cmmv/ai-content**: Serviços de AI para processamento de conteúdo
- **@cmmv/blog**: Funcionalidades de blog
- **@cmmv/auth**: Autenticação

### apps/admin
- **Vue 3**: Framework frontend
- **Vue Router 4**: Roteamento
- **TailwindCSS 4**: Estilização
- **Tiptap**: Editor de rich text
- **Chart.js**: Gráficos
- **Firebase**: (Possível autenticação ou banco)
- **@cmmv/proxy**: Proxy para requests
- **@cmmv/rss-aggregation**: Pacote sendo analisado
- **@cmmv/yt-aggregation**: Similar para YouTube

## Processos de CI/CD

Não especificado no código, mas:
- Versões usando workspaces (`workspace:*`)
- Scripts de build em package.json

## Ambientes

- **dev**: Ambiente de desenvolvimento
- **build**: Ambiente de build
- **production**: Ambiente de produção

## Servidores/Deploy

- Servidor Node.js para admin (server.js)
- Build estático Vite para frontend