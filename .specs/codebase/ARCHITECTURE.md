# Arquitetura do Sistema

## Visão Geral

O CMMV Blog é uma arquitetura modular baseada em monorepo com pacotes independentes que se integram através de APIs e rotas compartilhadas.

## Componentes Principais

### 1. RSS Aggregation Package (`@cmmv/rss-aggregation`)
**Responsabilidade**: Agregação, processamento e sanitização de feeds RSS/Atom

**Módulos**:
- **RssAggregationModule**: Módulo principal que coordena submodules
- **ChannelsService**: Processamento de feeds RSS/Atom (506 linhas)
  - Timeouts configuráveis
  - Tratamento robusto de erros
  - Extração de metadados de feeds
- **RawService**: Processamento massivo de jobs AI (1270 linhas)
  - Integração com serviços de AI (gemini)
  - Parsing de JSON complexo
  - Matching de categorias
  - Proxy de mídia
  - Classificação automática de conteúdo
- **ParserService**: Parsing HTML com workers (1003 linhas)
  - Workers para execução segura de regex
  - Integração com AI para refinamento
  - Validação de regex complexos
- **ContentSanitizer**: Sanitização de conteúdo (380 linhas)
  - Validação de URLs
  - Deduplicação de imagens
  - Remoção inteligente de blocos inválidos

**Patterns**:
- Service-based architecture com injeção de dependências
- Processamento assíncrono com Promises e async/await
- Timeout patterns para operações de rede
- Worker pattern para operações CPU-intensive (regex)

### 2. Admin App (`cmmv-blog-admin`)
**Responsabilidade**: Interface administrativa unificada

**Arquitetura**:
- **Shell App**: Aplicação Vue 3 minimalista que importa rotas de pacotes
- **Plugin System**: `mergePluginRoutes` combina rotas de múltiplos pacotes
- **Dependências**: Vue 3, Vite, TailwindCSS, Tiptap editor

**Integrações**:
- @cmmv/blog (core blogging)
- @cmmv/rss-aggregation (feeds RSS)
- @cmmv/yt-aggregation (feeds YouTube)
- @cmmv/affiliate (afiliados)
- @cmmv/odds (odds)
- @cmmv/newsletter (newsletter)

### 3. Framework @cmmv Core
**Componentes**:
- **@cmmv/core**: Framework base
- **@cmmv/repository**: Camada de acesso a dados
- **@cmmv/http**: Comunicação HTTP
- **@cmmv/auth**: Sistema de autenticação

## Padrões de Comunicação

### 1. API Interna
- Services expõem métodos assíncronos
- Contracts com decorators `@ContractField`
- Error handling unificado

### 2. Integração Admin
- Rotas Vue Router importadas dinamicamente
- Composables para lógica reutilizável
- Interface administrativa unificada

### 3. Processamento de Conteúdo
```
Feed RSS/Atom → ChannelsService → RawService (AI) → ParserService → ContentSanitizer → Banco de Dados
```

## Dependências Críticas

1. **xml2js**: Parser de XML para RSS/Atom
2. **@cmmv/ai-content**: Serviços de AI para processamento
3. **Vue 3**: Framework frontend admin
4. **Tiptap**: Editor de rich text
5. **Firebase**: Possível autenticação/banco

## Pontos de Acoplamento

1. **Admin Router**: Forte acoplamento entre pacotes via `mergePluginRoutes`
2. **AI Services**: Dependência de serviços externos de AI
3. **Database Layer**: Repository pattern abstrai banco de dados específico

## Decisões Arquiteturais Notáveis

1. **Monorepo com Workspaces**: Facilita desenvolvimento integrado
2. **Worker Pattern para Regex**: Isola operações CPU-intensive
3. **Timeout Patterns**: Prevenção de hanging operations
4. **Plugin System no Admin**: Extensibilidade via rotas dinâmicas

## Escalabilidade

**Pontos Fortes**:
- Processamento assíncrono
- Workers para operações pesadas
- Timeouts configuráveis

**Preocupações**:
- Services muito grandes (1000+ linhas)
- Complexidade ciclomática alta
- Possíveis memory leaks em jobs AI

## Segurança

**Implementado**:
- Sanitização de conteúdo
- Validação de URLs
- Workers isolam execução de regex

**Áreas para Revisão**:
- Parsing de XML (xml2js pode ter vulnerabilidades)
- Execução de código em workers
- Validação de inputs de AI services