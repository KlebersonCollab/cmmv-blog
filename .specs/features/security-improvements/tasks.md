# Tasks: Melhorias de Segurança RSS Aggregation

## Data: 2026-04-08
**Status**: Tasks criadas baseadas em design e especificação

## Visão Geral

Breakdown das tarefas para implementar melhorias de segurança no pacote rss-aggregation, organizadas por fase de priorização do spec.

### Fases de Implementação

**Fase 1 (Crítico - Executar Imediatamente)**
1. SEC-03: Validação de URLs (maior risco de XSS)
2. SEC-02: HTML parsing seguro
3. SEC-01: Validação de inputs XML

**Fase 2 (Alto Risco - Curto Prazo)**
1. SEC-04: Secure AI integration
2. SEC-06: API input validation

**Fase 3 (Médio Risco - Médio Prazo)**
1. SEC-05: Memory safety em workers

## Task List

### Fase 1: Validação Crítica

#### TASK-01: Criar Security Service Base
**ID**: TASK-01  
**Descrição**: Criar service central para validações de segurança e logging de warnings  
**Complexidade**: Média  
**Dependências**: Nenhuma  
**Localização**: `packages/rss-aggregation/api/security/security.service.ts`  
**Critérios de Aceitação**:
- [ ] Service criado com interface SecurityWarning e SecurityValidationResult
- [ ] Métodos básicos: validateXmlInput, validateHtmlContent, validateUrl, validateAiPrompt
- [ ] Integração com Logger do @cmmv/core
- [ ] Logging de warnings com formato padronizado
- [ ] Testes unitários básicos

#### TASK-02: Instalar Dependências Externas
**ID**: TASK-02  
**Descrição**: Adicionar sanitize-html e validator.js ao package.json  
**Complexidade**: Baixa  
**Dependências**: Nenhuma  
**Localização**: `packages/rss-aggregation/package.json`  
**Critérios de Aceitação**:
- [ ] sanitize-html adicionado como dependency
- [ ] validator.js adicionado como dependency
- [ ] npm install executado sem erros
- [ ] TypeScript types instalados (@types/sanitize-html, @types/validator)
- [ ] Build do pacote funciona com novas dependências

#### TASK-03: Implementar Validação de URLs (SEC-03)
**ID**: TASK-03  
**Descrição**: Aprimorar validação de URLs no ContentSanitizer com validator.js  
**Complexidade**: Média  
**Dependências**: TASK-01, TASK-02  
**Localização**: `packages/rss-aggregation/api/raw/content-sanitizer.ts`  
**Critérios de Aceitação**:
- [ ] Integrar validator.js para validação abrangente de URLs
- [ ] Validar scheme (http/https apenas) com warning para outros schemes
- [ ] Validar domain contra whitelist/blacklist (extensão da SOCIAL_DOMAINS)
- [ ] Implementar URL normalization mais robusta
- [ ] Validar tamanho máximo de URLs (2048 caracteres)
- [ ] Log warnings para URLs inválidas (não bloquear)
- [ ] Testes com casos edge: javascript:, data:, mailto:, tel:

#### TASK-04: Implementar HTML Parsing Seguro (SEC-02)
**ID**: TASK-04  
**Descrição**: Integrar sanitize-html no ParserService para sanitização e logging  
**Complexidade**: Alta  
**Dependências**: TASK-01, TASK-02  
**Localização**: `packages/rss-aggregation/api/parser/parser.service.ts`  
**Critérios de Aceitação**:
- [ ] Integrar sanitize-html library para HTML sanitization
- [ ] Validar e sanitizar atributos HTML (href, src, etc.) com logging
- [ ] Log warnings para tags/scripts suspeitos (não remover automaticamente)
- [ ] Manter worker isolation para parsing HTML (já existente)
- [ ] Preservar conteúdo original, aplicar sanitização apenas para logging
- [ ] Configuração de allowedTags/allowedAttributes apropriada para conteúdo RSS
- [ ] Testes com HTML malicioso (XSS vectors)

#### TASK-05: Implementar Validação de Inputs XML (SEC-01)
**ID**: TASK-05  
**Descrição**: Adicionar validações de segurança no XML parsing do ChannelsService  
**Complexidade**: Média  
**Dependências**: TASK-01  
**Localização**: `packages/rss-aggregation/api/channels/channels.service.ts`  
**Critérios de Aceitação**:
- [ ] Limitar tamanho máximo de feeds RSS (10MB) com warning
- [ ] Validar estrutura XML básica, log warning para malformações
- [ ] Implementar timeout de parsing (30 segundos)
- [ ] Isolar parsing XML em sandboxed environment (worker threads existentes)
- [ ] Log warnings detalhados para conteúdo suspeito (não blocking)
- [ ] Testes com XML malformado e grandes

### Fase 2: Integrações de Risco

#### TASK-06: Implementar Secure AI Integration (SEC-04)
**ID**: TASK-06  
**Descrição**: Adicionar segurança em integração com AI services no RawService  
**Complexidade**: Alta  
**Dependências**: TASK-01  
**Localização**: `packages/rss-aggregation/api/raw/raw.service.ts`  
**Critérios de Aceitação**:
- [ ] Implementar input sanitization para prompts AI
- [ ] Rate limiting para chamadas AI services (10 requisições/minuto por usuário)
- [ ] Timeout para chamadas AI (60 segundos)
- [ ] Logging de falhas de segurança em chamadas AI
- [ ] Optional: Implementar content classification para detectar sensitive data
- [ ] Testes de rate limiting e timeout

#### TASK-07: Implementar API Input Validation (SEC-06)
**ID**: TASK-07  
**Descrição**: Adicionar validação de inputs em todos controllers  
**Complexidade**: Média  
**Dependências**: TASK-01  
**Localização**: Todos controllers (`*.controller.ts`) no pacote rss-aggregation  
**Critérios de Aceitação**:
- [ ] Validar parâmetros de URL (IDs, query params)
- [ ] Validar corpo de requests (JSON schema validation)
- [ ] Rate limiting por IP/usuário (100 requisições/minuto por IP)
- [ ] Request size limiting
- [ ] Testes de validação para cada endpoint

### Fase 3: Segurança de Memória

#### TASK-08: Implementar Memory Safety em Workers (SEC-05)
**ID**: TASK-08  
**Descrição**: Prevenir memory leaks em AI jobs e worker threads  
**Complexidade**: Média  
**Dependências**: Nenhuma (pode ser paralelo)  
**Localização**: `packages/rss-aggregation/api/parser/parser.service.ts`  
**Critérios de Aceitação**:
- [ ] Implementar cleanup adequado para workers
- [ ] Limitar memory usage por worker (kill workers > 100MB)
- [ ] Timeout e kill para workers stuck
- [ ] Monitoring de resource usage
- [ ] Periodic cleanup (reiniciar workers a cada N jobs)
- [ ] Testes de memory limits e cleanup

### Tarefas de Configuração e Testes

#### TASK-09: Configurar Environment Variables
**ID**: TASK-09  
**Descrição**: Adicionar variáveis de ambiente para configuração de segurança  
**Complexidade**: Baixa  
**Dependências**: TASK-01 a TASK-08  
**Localização**: `.env.example`, documentação  
**Critérios de Aceitação**:
- [ ] Variáveis para tamanho máximo XML (SECURITY_MAX_XML_SIZE_MB)
- [ ] Variáveis para timeouts (SECURITY_XML_TIMEOUT_MS, SECURITY_AI_TIMEOUT_MS)
- [ ] Variáveis para rate limits (SECURITY_AI_RATE_LIMIT, SECURITY_API_RATE_LIMIT)
- [ ] Variáveis para memory limits (SECURITY_WORKER_MEMORY_LIMIT_MB)
- [ ] Documentação das variáveis
- [ ] Valores padrão sensíveis

#### TASK-10: Criar Test Suite de Segurança
**ID**: TASK-10  
**Descrição**: Desenvolver testes abrangentes para validações de segurança  
**Complexidade**: Alta  
**Dependências**: TASK-01 a TASK-09  
**Localização**: `packages/rss-aggregation/__tests__/security/`  
**Critérios de Aceitação**:
- [ ] Unit tests para SecurityService
- [ ] Integration tests para feed processing com conteúdo suspeito
- [ ] Security tests: XML injection, HTML XSS, URL validation bypass
- [ ] Performance tests: throughput com security checks
- [ ] Test coverage > 80% para código de segurança

## Dependências entre Tasks

```
TASK-01 (Security Service Base)
      ├── TASK-03 (URL Validation)
      ├── TASK-04 (HTML Parsing)
      ├── TASK-05 (XML Validation)
      ├── TASK-06 (AI Integration)
      └── TASK-07 (API Validation)

TASK-02 (Dependências Externas)
      ├── TASK-03 (URL Validation - validator.js)
      └── TASK-04 (HTML Parsing - sanitize-html)

TASK-08 (Memory Safety) → Independente
TASK-09 (Config) → Depende de todas
TASK-10 (Tests) → Depende de todas
```

## Ordem de Execução Recomendada

1. **Setup inicial**: TASK-01, TASK-02 (em paralelo)
2. **Fase 1 crítica**: TASK-03, TASK-04, TASK-05 (em paralelo após setup)
3. **Fase 2 risco**: TASK-06, TASK-07 (em paralelo após fase 1)
4. **Fase 3 memória**: TASK-08 (paralelo com fase 2)
5. **Configuração**: TASK-09 (após implementações)
6. **Testes**: TASK-10 (final)

## Estimativas de Esforço

| Task ID | Complexidade | Horas Estimadas | Prioridade |
|---------|--------------|-----------------|------------|
| TASK-01 | Média        | 4               | Alta       |
| TASK-02 | Baixa        | 1               | Alta       |
| TASK-03 | Média        | 6               | Crítica    |
| TASK-04 | Alta         | 8               | Crítica    |
| TASK-05 | Média        | 6               | Crítica    |
| TASK-06 | Alta         | 10              | Alta       |
| TASK-07 | Média        | 8               | Alta       |
| TASK-08 | Média        | 6               | Média      |
| TASK-09 | Baixa        | 2               | Baixa      |
| TASK-10 | Alta         | 12              | Alta       |

**Total estimado**: 63 horas (~8 dias de trabalho)

## Critérios de Verificação

### Verificação por Task
Cada task deve incluir:
- [ ] Código implementado
- [ ] Logging de warnings funcionando (onde aplicável)
- [ ] Testes unitários (quando apropriado)
- [ ] Documentação de mudanças
- [ ] Build do pacote funciona

### Verificação Final
- [ ] Todas tasks da Fase 1 completas
- [ ] Performance impact < 10% (testes de benchmark)
- [ ] Zero vulnerabilidades críticas de XSS (scan básico)
- [ ] Test coverage > 80% para código de segurança
- [ ] Logging de warnings funcionando em produção-like environment

## Riscos e Mitigações

### Riscos Técnicos
1. **Breaking changes**: Abordagem permissiva minimiza risco
2. **Performance impact**: Monitorar e otimizar
3. **Dependency conflicts**: Testar em staging antes de produção
4. **False positives**: Logging detalhado para debugging

### Riscos de Processo
1. **Scope creep**: Manter foco em melhorias de segurança
2. **Time estimation**: Revisar estimativas após primeiras tasks
3. **Integration complexity**: Testar integração incrementalmente

## Próximos Passos Imediatos

1. **Iniciar TASK-01**: Criar Security Service base
2. **Iniciar TASK-02**: Instalar dependências externas
3. **Executar em paralelo**: TASK-03, TASK-04, TASK-05 após setup
4. **Validar incrementalmente**: Testar cada componente isolado

## Notas de Implementação

### Abordagem Permissiva
- Apenas log warnings, não bloquear conteúdo automaticamente
- Manter máxima compatibilidade com feeds existentes
- Logging detalhado para admin debugging

### Compatibilidade
- Não quebrar APIs existentes
- Manter mesmo formato de output para database
- Não alterar comportamento existente (apenas adicionar warnings)

### Performance
- Target: <10% impact no throughput
- Otimizar validações (caching, early returns)
- Monitorar em ambiente de staging

---

**Status**: Tasks definidas, pronto para execução  
**Prioridade**: Alta - começar com Fase 1 (crítica)  
**Complexidade**: Grande (63 horas estimadas)  
**Risco**: Médio (integração com código complexo existente)