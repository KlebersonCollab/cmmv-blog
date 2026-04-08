# Integrações e Dependências

## Visão Geral de Integrações

O sistema CMMV Blog usa uma arquitetura de plugin system onde múltiplos pacotes se integram através de APIs, rotas e contracts compartilhados.

## Integrações Internas

### 1. RSS Aggregation → Outros Pacotes

#### @cmmv/blog (Core Blogging)
- **Propósito**: Funcionalidades core de blogging
- **Integração**: Contracts extendem `AbstractContract`, admin routes
- **Dependência**: `workspace:plugin` no package.json
- **Uso**: Base para entidades de blog, admin layout

#### @cmmv/ai-content (AI Services)
- **Propósito**: Processamento de conteúdo com AI
- **Integração**: `AIContentService` usado em `RawService`
- **Dependência**: `workspace:ai-content` no package.json
- **Uso**: Geração de títulos, conteúdo, tags, categorias via AI

#### @cmmv/auth (Autenticação)
- **Propósito**: Sistema de autenticação
- **Integração**: `@Contract({ auth: true })` em contracts
- **Dependência**: `latest` no package.json
- **Uso**: Proteção de endpoints, permissões

#### @cmmv/core (Framework)
- **Propósito**: Framework base
- **Integração**: Decorators `@Contract`, `@ContractField`
- **Dependência**: `latest` no package.json
- **Uso**: Definição de entidades, injeção de dependências

#### @cmmv/http (HTTP Communication)
- **Propósito**: Comunicação HTTP
- **Dependência**: `latest` no package.json
- **Uso**: Fetching de feeds RSS/Atom

### 2. Admin App → Todos os Pacotes

#### Plugin System
- **Mecanismo**: `mergePluginRoutes` do `@cmmv/blog`
- **Integração**: Cada pacote exporta `admin/router.ts`
- **Routes merged**: Blog, RSS, YouTube, Affiliate, Odds, Newsletter
- **Navbar integration**: `useNavbar().addItems()`

#### Pacotes Integrados
1. **@cmmv/rss-aggregation**: Feeds RSS/Atom
2. **@cmmv/yt-aggregation**: Feeds YouTube (similar structure)
3. **@cmmv/blog**: Blog core
4. **@cmmv/affiliate**: Sistema de afiliados
5. **@cmmv/odds**: Sistema de odds
6. **@cmmv/newsletter**: Sistema de newsletter
7. **@cmmv/access-control**: Controle de acesso

## Integrações Externas

### 1. RSS/Atom Feeds
- **Tecnologia**: HTTP fetching + xml2js parsing
- **Formatos suportados**: RSS 2.0, Atom 1.0
- **Timeout handling**: Configurável por canal
- **Error handling**: Retry logic, fallbacks

### 2. AI Services (Gemini)
- **Provider**: Google Gemini (via @cmmv/ai-content)
- **Uso**: Content generation, classification, refinement
- **Rate limiting**: Implementado no serviço
- **Fallback**: Content original se AI falhar

### 3. Media Proxy
- **Propósito**: Cache e otimização de imagens
- **Integração**: URLs de imagem processadas no `RawService`
- **Cache strategy**: TTL configurável

### 4. Worker Threads
- **Propósito**: Isolamento de regex parsing
- **Tecnologia**: Node.js Worker Threads
- **Uso**: `ParserService` para operações CPU-intensive
- **Safety**: Prevenção de regex bombs

## APIs Expostas

### 1. RSS Aggregation API
- **Base path**: `/rss-aggregation`
- **Endpoints**:
  - `POST /feed/channels` - Criar canal RSS
  - `GET /feed/channels/processFeeds` - Processar todos feeds
  - `POST /feed/raw/startAIJob/:id` - Iniciar job AI
  - `GET /feed/parser/parseURL` - Parsear URL
- **Authentication**: Todos endpoints requerem auth
- **Documentation**: Via contracts e decorators

### 2. Admin Client API
- **Client**: `useFeedClient()` composable
- **Methods**: `channels`, `raw`, `parser` namespaces
- **Authentication**: `api.authRequest()` com tokens
- **Error handling**: Promise-based

## Fluxos de Dados

### 1. RSS Processing Pipeline
```
External RSS Feed → HTTP Fetch → xml2js Parse → ChannelsService → 
RawService (AI Processing) → ParserService (HTML Parse) → 
ContentSanitizer → Database → Blog Publishing
```

### 2. AI Job Flow
```
Raw Content → AIContentService → Gemini API → 
Title/Content Generation → Category Classification → 
Validation → Database Update
```

### 3. Admin UI Flow
```
Vue App → Router (merged routes) → View Component → 
useFeedClient() → API Request → Backend Service → 
Database → Response → UI Update
```

## Dependências de Versão

### 1. Workspace Dependencies
- **`workspace:*`**: Pacotes locais no monorepo
- **Version sync**: Todos usam mesma versão do @cmmv/core
- **Build order**: Dependências precisam ser built primeiro

### 2. External Dependencies
- **xml2js**: ^0.6.2 (RSS parsing)
- **firebase**: ^11.8.0 (possível auth/database)
- **vue**: ^3.5.13 (admin frontend)
- **@tiptap**: ^2.11.7 (rich text editor)

## Pontos de Acoplamento

### 1. Forte Acoplamento
- **Admin router**: Todos pacotes dependem do mesmo `mergePluginRoutes`
- **@cmmv/core contracts**: Todos contracts usam mesmo framework
- **Database schema**: Contracts geram schema de banco

### 2. Acoplamento Moderado
- **AI services**: `RawService` depende de `@cmmv/ai-content`
- **HTTP fetching**: `ChannelsService` depende de `@cmmv/http`

### 3. Baixo Acoplamento
- **External RSS feeds**: Pode trocar providers
- **Media proxy**: Implementação substituível

## Interfaces de Integração

### 1. Contract-based
- **Type safety**: TypeScript interfaces geradas
- **Validation**: Decorators providenciam validation
- **Database mapping**: Auto-generated schema

### 2. REST API
- **Standardized**: Todos endpoints seguem padrão similar
- **Documented**: Via contract decorators
- **Versioned**: Parte do pacote version

### 3. Admin Plugin
- **Route-based**: Cada pacote adiciona suas rotas
- **Navbar integration**: Items adicionados dinamicamente
- **Layout sharing**: Usa `AdminLayout` comum

## Riscos de Integração

### 1. Version Incompatibility
- **@cmmv/core updates**: Quebraria todos contracts
- **Breaking changes**: Em APIs compartilhadas
- **Build order**: Dependências circulares

### 2. External Service Failures
- **AI services offline**: Content generation falha
- **RSS feeds unavailable**: Pipeline interrompido
- **Rate limiting**: External APIs bloqueiam requests

### 3. Performance Bottlenecks
- **AI processing**: Lento, rate-limited
- **HTML parsing**: CPU-intensive
- **Database operations**: Múltiplos inserts/updates

## Estratégias de Fallback

### 1. Implementadas
- **Timeout handling**: Prevenção de hanging operations
- **Error logging**: Detalhado para debugging
- **Content fallback**: Usar conteúdo original se AI falhar

### 2. Recomendadas
- **Circuit breakers**: Para external services
- **Retry logic**: Com exponential backoff
- **Cache layer**: Para RSS feeds processados
- **Queue system**: Para jobs AI assíncronos