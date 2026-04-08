# Estrutura do Projeto

## Visão Geral do Monorepo

```
cmmv-blog/
├── packages/                    # Pacotes compartilhados
│   ├── rss-aggregation/        # Agregação RSS/Atom (3942 linhas)
│   ├── yt-aggregation/         # Agregação YouTube (similar)
│   ├── blog/                   # Funcionalidades core de blog
│   ├── ai-content/             # Serviços de AI
│   └── ... outros pacotes
├── apps/                       # Aplicações
│   └── admin/                  # Interface administrativa
├── .specs/                     # Documentação da análise
└── package.json                # Workspace root
```

## Estrutura do Pacote RSS Aggregation

### 1. Entry Points
- **index.ts** (22 linhas): Exportações principais e metadados do pacote
- **api/rss-aggregation.module.ts** (32 linhas): Módulo principal que agrega submodules

### 2. Contracts (383 linhas totais)
- **feed-channels.contract.ts** (83 linhas): Entidade para canais RSS
- **feed-parser.contract.ts** (75 linhas): Entidade para parsers
- **feed-raw.contract.ts** (193 linhas): Entidade para conteúdo raw processado
- **contracts/index.ts** (2 linhas): Re-export

**Padrão**: Todos usam decorators `@Contract` e `@ContractField` do @cmmv/core.

### 3. API Backend (2288 linhas totais)

#### Módulo Channels (569 linhas)
- **channels.module.ts** (14 linhas): Módulo do serviço de canais
- **channels.controller.ts** (30 linhas): Controller REST
- **channels.service.ts** (505 linhas): Serviço de processamento de feeds

#### Módulo Raw (1920 linhas)
- **raw.module.ts** (18 linhas): Módulo do serviço raw
- **raw.controller.ts** (114 linhas): Controller REST
- **raw.service.ts** (1269 linhas): Serviço massivo de jobs AI
- **content-sanitizer.ts** (379 linhas): Sanitizador de conteúdo

#### Módulo Parser (1083 linhas)
- **parser.module.ts** (14 linhas): Módulo do serviço parser
- **parser.controller.ts** (67 linhas): Controller REST
- **parser.service.ts** (1002 linhas): Serviço de parsing HTML

### 4. Admin Integration (163 linhas)
- **admin/router.ts** (42 linhas): Rotas Vue Router para admin
- **admin/client.ts** (79 linhas): Client API para frontend
- **admin/index.ts** (2 linhas): Re-export

## Estrutura do App Admin

### 1. Core Files
- **src/main.ts**: Ponto de entrada da aplicação Vue
- **src/App.vue** (9 linhas): Componente raiz simples
- **src/router.ts** (41 linhas): Router que importa rotas de pacotes
- **src/style.css**: Estilos globais
- **src/composables/useUtils.ts**: Utilitários compartilhados

### 2. Views
- **src/views/LoginView.vue**: Página de login

### 3. Build Configuration
- **vite.config.ts**: Configuração Vite
- **tailwind.config.ts**: Configuração TailwindCSS
- **tsconfig.json**: Configuração TypeScript
- **package.json**: Dependências e scripts

## Distribuição de Complexidade

### 1. Linhas de Código por Serviço
1. **raw.service.ts**: 1269 linhas (32% do pacote)
2. **parser.service.ts**: 1002 linhas (25% do pacote)
3. **channels.service.ts**: 505 linhas (13% do pacote)
4. **content-sanitizer.ts**: 379 linhas (10% do pacote)
5. **Contracts**: 383 linhas (10% do pacote)
6. **Restante**: 404 linhas (10% do pacote)

### 2. Métricas de Complexidade
- **Services grandes**: 3 services com 500+ linhas cada
- **Métodos longos**: Métodos com 50-100+ linhas
- **Aninhamento profundo**: Múltiplos níveis de condicionais
- **Dependências externas**: AI services, xml2js, workers

## Dependências entre Pacotes

### 1. RSS Aggregation Dependencies
```
@cmmv/rss-aggregation
├── @cmmv/blog (core blogging)
├── @cmmv/ai-content (AI services)
├── @cmmv/auth (authentication)
├── @cmmv/core (framework)
└── @cmmv/http (HTTP communication)
```

### 2. Admin App Dependencies
```
cmmv-blog-admin
├── @cmmv/rss-aggregation (feeds RSS)
├── @cmmv/yt-aggregation (feeds YouTube)
├── @cmmv/blog (core blogging)
├── @cmmv/affiliate (afiliados)
├── @cmmv/odds (odds)
├── @cmmv/newsletter (newsletter)
├── Vue 3 + ecosystem
└── TailwindCSS + Tiptap
```

## Organização de Código

### 1. Separação por Responsabilidade
- **Contracts**: Definição de entidades
- **Services**: Lógica de negócio
- **Controllers**: Endpoints REST
- **Modules**: Agrupamento e injeção
- **Admin**: Integração frontend

### 2. Padrões de Import/Export
- **Barrel exports**: `index.ts` em cada diretório
- **Relative imports**: Dentro do mesmo pacote
- **Workspace imports**: `workspace:*` para pacotes locais
- **External imports**: Dependências npm

### 3. Configuração de Build
- **tsup**: Para pacotes TypeScript
- **Vite**: Para app admin Vue
- **TypeScript 5.8.2**: Compilador

## Arquitetura de Diretórios

### 1. Pacote RSS Aggregation
```
rss-aggregation/
├── api/                    # Backend API
│   ├── channels/          # Processamento de feeds
│   ├── raw/               # Jobs AI e processamento
│   ├── parser/            # Parsing HTML
│   └── rss-aggregation.module.ts
├── contracts/             # Data contracts
├── admin/                 # Frontend integration
├── index.ts              # Package entry
└── package.json          # Dependencies
```

### 2. App Admin
```
admin/
├── src/
│   ├── views/            # Vue views
│   ├── composables/      # Vue composables
│   ├── App.vue          # Root component
│   ├── main.ts          # Entry point
│   ├── router.ts        # Router configuration
│   └── style.css        # Global styles
├── public/              # Static assets
├── server.js           # Production server
├── vite.config.ts      # Build config
└── package.json        # Dependencies
```

## Pontos de Entrada

### 1. Para Desenvolvedores
- **Package**: Importar de `@cmmv/rss-aggregation`
- **Admin**: Rodar `npm run dev` no diretório `apps/admin`

### 2. Para Build
- **Package**: `npm run build` (usa tsup)
- **Admin**: `npm run build` (usa Vite)

### 3. Para Execução
- **Admin dev**: `npm run dev`
- **Admin prod**: `npm start` (node server.js)

## Observações sobre a Estrutura

### 1. Pontos Fortes
- **Clara separação**: Contracts, services, controllers separados
- **Modularidade**: Módulos independentes que se integram
- **Consistência**: Padrões similares em todos os services

### 2. Áreas de Melhoria
- **Services muito grandes**: Refatorar em serviços menores
- **Falta de testes**: Estrutura de testes ausente
- **Complexidade concentrada**: 3 services têm 70% do código