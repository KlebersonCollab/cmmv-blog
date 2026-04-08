# Especificação: Melhorias de Segurança RSS Aggregation

## Data: 2026-04-08
**Status**: Especificado

## Visão Geral
Implementar melhorias de segurança críticas no pacote rss-aggregation para mitigar riscos identificados na análise brownfield.

## Contexto
Análise do pacote rss-aggregation (3942 linhas) revelou múltiplas vulnerabilidades de segurança:

1. **XML/HTML parsing**: Vulnerabilidades no xml2js, regex-based HTML parsing (XSS vectors)
2. **URL validation**: Validação insuficiente no ContentSanitizer
3. **AI service integration**: Prompt injection, data leakage, rate limiting
4. **Memory leaks**: AI jobs e worker threads sem cleanup adequado
5. **Input validation**: Validação inconsistente de inputs de usuário

## Requisitos Funcionais

### SEC-01: Fortalecer Validação de Inputs XML/RSS
**Descrição**: Implementar validação de inputs XML/RSS com logging de warnings para conteúdo suspeito.

**Critérios de Aceitação:**
- [ ] SEC-01.1: Limitar tamanho máximo de feeds RSS (ex: 10MB) com warning
- [ ] SEC-01.2: Validar estrutura XML básica, log warning para malformações
- [ ] SEC-01.3: Implementar timeout de parsing (ex: 30 segundos)
- [ ] SEC-01.4: Isolar parsing XML em sandboxed environment
- [ ] SEC-01.5: Log warnings detalhados para conteúdo suspeito (não blocking)

**Localização**: `channels.service.ts`, `ChannelsService.processFeed()`

### SEC-02: Melhorar HTML Parsing Seguro
**Descrição**: Integrar sanitize-html para sanitização e logging de warnings para HTML suspeito.

**Critérios de Aceitação:**
- [ ] SEC-02.1: Integrar sanitize-html library para HTML sanitization
- [ ] SEC-02.2: Validar e sanitizar atributos HTML (href, src, etc.) com logging
- [ ] SEC-02.3: Log warnings para tags/scripts suspeitos (não remover automaticamente)
- [ ] SEC-02.4: Manter worker isolation para parsing HTML
- [ ] SEC-02.5: Preservar conteúdo original, aplicar sanitização apenas para logging

**Localização**: `parser.service.ts`, `ParserService.parseContent()`

### SEC-03: Reforçar Validação de URLs
**Descrição**: Implementar validação abrangente de URLs no ContentSanitizer.

**Critérios de Aceitação:**
- [ ] SEC-03.1: Validar scheme (http/https apenas)
- [ ] SEC-03.2: Validar domain contra whitelist/blacklist
- [ ] SEC-03.3: Implementar URL normalization
- [ ] SEC-03.4: Validar tamanho máximo de URLs
- [ ] SEC-03.5: Implementar safe URL rewriting para media proxy

**Localização**: `content-sanitizer.ts`, `ContentSanitizer.validateUrl()`

### SEC-04: Secure AI Service Integration
**Descrição**: Mitigar riscos de prompt injection e data leakage em AI services.

**Critérios de Aceitação:**
- [ ] SEC-04.1: Implementar input sanitization para prompts AI
- [ ] SEC-04.2: Rate limiting para chamadas AI services
- [ ] SEC-04.3: Timeout para chamadas AI (ex: 60 segundos)
- [ ] SEC-04.4: Logging de falhas de segurança em chamadas AI
- [ ] SEC-04.5: Optional: Implementar content classification para detectar sensitive data

**Localização**: `raw.service.ts`, `RawService.startAIJob()`

### SEC-05: Memory Safety em Worker Threads
**Descrição**: Prevenir memory leaks em AI jobs e worker threads.

**Critérios de Aceitação:**
- [ ] SEC-05.1: Implementar cleanup adequado para workers
- [ ] SEC-05.2: Limitar memory usage por worker
- [ ] SEC-05.3: Timeout e kill para workers stuck
- [ ] SEC-05.4: Monitoring de resource usage

**Localização**: `parser.service.ts`, `ParserService.createWorker()`

### SEC-06: Input Validation em API Endpoints
**Descrição**: Validar todos os inputs de API endpoints.

**Critérios de Aceitação:**
- [ ] SEC-06.1: Validar parâmetros de URL (IDs, query params)
- [ ] SEC-06.2: Validar corpo de requests (JSON schema validation)
- [ ] SEC-06.3: Rate limiting por IP/usuário
- [ ] SEC-06.4: Request size limiting

**Localização**: Controllers (`*.controller.ts`)

## Requisitos Não Funcionais

### SEC-NF-01: Performance
- Impacto máximo de 10% no throughput de parsing
- Memory overhead < 20% para security checks

### SEC-NF-02: Backwards Compatibility
- Não quebrar APIs existentes
- Manter compatibilidade com feeds RSS existentes

### SEC-NF-03: Testabilidade
- Testes unitários para todas as validações
- Testes de segurança (fuzzing básico)

## Restrições Técnicas

1. **Dependências existentes**: xml2js, @cmmv/ai-content, @cmmv/core
2. **Compatibilidade**: Manter mesmo formato de output para database
3. **Performance**: RSS parsing é time-sensitive
4. **Complexidade**: Código existente é complexo (services grandes)

## Decisões Tomadas (2026-04-08)

### 1. Abordagem de Segurança
- **Permissiva**: Apenas log warnings para conteúdo suspeito, máxima compatibilidade
- **Nenhum blocking automático**: Conteúdo suspeito gera warning logs, não é automaticamente rejeitado

### 2. Dependências Externas
- **sanitize-html**: Para HTML sanitization e prevenção de XSS
- **validator.js**: Para validação abrangente de URLs
- Ambas dependências aprovadas para uso

### 3. Rate Limiting (Valores Padrão)
- **AI services**: 10 requisições/minuto por usuário
- **API endpoints**: 100 requisições/minuto por IP  
- **RSS fetching**: 1 requisição/5 minutos por feed

### 4. Error Handling
- **Error response detalhada**: Quando segurança bloquear conteúdo (configuração futura)
- **Logging**: Warnings detalhados para conteúdo suspeito

### 5. Memory Safety
- **Memory limits**: Kill workers > 100MB
- **Periodic cleanup**: Reiniciar workers a cada N jobs

## Dependências

### Dependências Internas
- `@cmmv/core`: Decorators de validação
- `@cmmv/ai-content`: Rate limiting de AI services
- `@cmmv/http`: Timeout de HTTP requests

### Dependências Externas (Aprovadas)
- **sanitize-html**: Para HTML sanitization e prevenção de XSS
- **validator.js**: Para validação abrangente de URLs

## Riscos

### Alto Risco
1. **Breaking existing functionality**: Validação muito restritiva pode quebrar feeds legítimos
2. **Performance degradation**: Security checks podem impactar throughput

### Médio Risco
1. **Dependency conflicts**: Novas libraries podem conflitar com dependências existentes
2. **Complexity increase**: Código de segurança pode tornar sistema mais complexo

### Baixo Risco
1. **False positives**: Validação pode bloquear conteúdo legítimo

## Priorização

### Fase 1 (Crítico - Executar Imediatamente)
1. SEC-03: Validação de URLs (maior risco de XSS)
2. SEC-02: HTML parsing seguro
3. SEC-01: Validação de inputs XML

### Fase 2 (Alto Risco - Curto Prazo)
1. SEC-04: Secure AI integration
2. SEC-06: API input validation

### Fase 3 (Médio Risco - Médio Prazo)
1. SEC-05: Memory safety em workers

## Métricas de Sucesso

1. **Redução de vulnerabilidades**: Zero vulnerabilidades críticas de XSS
2. **Coverage de validação**: 100% dos inputs validados
3. **Performance**: < 10% degradation
4. **Test coverage**: > 80% de código de segurança

## Decisões de Design (Resolvidas)

### 1. Balance Security vs Functionality
**Decisão**: Abordagem Permissiva - Apenas log warnings, nenhum blocking automático.

### 2. External Libraries vs Custom Implementation  
**Decisão**: Usar sanitize-html e validator.js - Dependências externas aprovadas.

### 3. Rate Limiting Thresholds
**Decisão**: Limites padrão definidos (10 req/min AI, 100 req/min API, 1 req/5min RSS).

### 4. Error Handling
**Decisão**: Error response detalhada para blocking futuro, logging warnings atual.

## Próximos Passos

1. **Discuss gray areas** com stakeholders (se necessário)
2. **Design architecture** para implementação
3. **Break into tasks** com dependências
4. **Implement incrementally** por fase

---

**ID do Feature**: security-improvements  
**Complexidade**: Grande (múltiplos componentes, mudanças arquiteturais)  
**Estado**: Especificado