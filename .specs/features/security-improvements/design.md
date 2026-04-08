# Design: Melhorias de Segurança RSS Aggregation

## Data: 2026-04-08
**Status**: Design criado baseado nas decisões do usuário

## Visão Geral da Arquitetura

Implementar melhorias de segurança no pacote rss-aggregation seguindo abordagem permissiva: apenas log warnings para conteúdo suspeito, máxima compatibilidade com feeds RSS externos.

### Princípios de Design

1. **Permissivo, não restritivo**: Apenas log warnings, não bloquear automaticamente conteúdo suspeito
2. **Compatibilidade máxima**: Manter funcionamento com feeds RSS/Atom existentes
3. **Logging detalhado**: Warnings informativos para admin debugging
4. **Dependências externas**: Usar sanitize-html e validator.js para segurança comprovada
5. **Performance**: <10% impact no throughput de parsing

## Componentes da Arquitetura

### 1. Security Service (Novo)

**Propósito**: Centralizar validações de segurança e logging de warnings.

**Localização**: `packages/rss-aggregation/api/security/security.service.ts`

**Interface**:
```typescript
interface SecurityWarning {
  type: 'xml_parsing' | 'html_content' | 'url_validation' | 'ai_prompt' | 'memory_usage';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
}

interface SecurityValidationResult {
  isValid: boolean;
  warnings: SecurityWarning[];
  sanitizedData?: any;
}
```

**Métodos**:
- `validateXmlInput(xml: string, source: string): SecurityValidationResult`
- `validateHtmlContent(html: string, context: string): SecurityValidationResult`
- `validateUrl(url: string, context: string): SecurityValidationResult`
- `validateAiPrompt(prompt: string): SecurityValidationResult`
- `logWarning(warning: SecurityWarning): void`

### 2. Enhanced XML Parsing (ChannelsService)

**Modificações em `channels.service.ts`**:
- Integrar validação de tamanho máximo (10MB) com warning
- Adicionar timeout de parsing (30 segundos)
- Validar estrutura XML básica, log warnings para malformações
- Manter sandboxed environment (worker threads existentes)

**Fluxo atual**:
```
External RSS Feed → HTTP Fetch → xml2js.ParseString() → ProcessFeedItem()
```

**Fluxo com segurança**:
```
External RSS Feed → HTTP Fetch → 
  ↓ SecurityService.validateXmlInput() (size, structure, timeout)
  ↓ xml2js.ParseString() 
  ↓ ProcessFeedItem() com logging de warnings
```

### 3. Enhanced HTML Parsing (ParserService)

**Modificações em `parser.service.ts`**:
- Integrar sanitize-html library para HTML sanitization
- Validar e sanitizar atributos HTML (href, src, etc.) com logging
- Manter worker isolation para parsing HTML (já existente)
- Preservar conteúdo original, aplicar sanitização apenas para logging

**Integração com sanitize-html**:
```typescript
import sanitizeHtml from 'sanitize-html';

const sanitized = sanitizeHtml(html, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'title', 'width', 'height']
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    'img': ['http', 'https', 'data']
  }
});
```

### 4. Enhanced URL Validation (ContentSanitizer)

**Modificações em `content-sanitizer.ts`**:
- Integrar validator.js para validação abrangente de URLs
- Validar scheme (http/https apenas) com warning para outros schemes
- Validar domain contra whitelist/blacklist (extensão da SOCIAL_DOMAINS existente)
- Implementar URL normalization mais robusta
- Validar tamanho máximo de URLs
- Implementar safe URL rewriting para media proxy

**Integração com validator.js**:
```typescript
import validator from 'validator';

const urlValidation = {
  isUrl: validator.isURL(url, { require_protocol: true }),
  isHttps: validator.isURL(url, { protocols: ['https'] }),
  isHttpOrHttps: validator.isURL(url, { protocols: ['http', 'https'] }),
  hasValidLength: url.length < 2048,
  hasValidDomain: this.isAllowedDomain(url)
};
```

### 5. Secure AI Service Integration (RawService)

**Modificações em `raw.service.ts`**:
- Implementar input sanitization para prompts AI
- Rate limiting para chamadas AI services (10 requisições/minuto por usuário)
- Timeout para chamadas AI (60 segundos)
- Logging de falhas de segurança em chamadas AI
- Content classification para detectar sensitive data (opcional)

### 6. Memory Safety Enhancements (ParserService)

**Modificações em `parser.service.ts`**:
- Implementar cleanup adequado para workers
- Limitar memory usage por worker (kill workers > 100MB)
- Timeout e kill para workers stuck
- Monitoring de resource usage
- Periodic cleanup (reiniciar workers a cada N jobs)

### 7. API Input Validation (Controllers)

**Modificações em todos controllers (`*.controller.ts`)**:
- Validar parâmetros de URL (IDs, query params)
- Validar corpo de requests (JSON schema validation)
- Rate limiting por IP/usuário (100 requisições/minuto por IP)
- Request size limiting

## Decisões de Implementação

### 1. Abordagem de Logging

**Estratégia**: Usar Logger existente do @cmmv/core com nível WARNING

**Exemplo**:
```typescript
this.logger.warn('Security warning', {
  type: 'xml_parsing',
  source: feedUrl,
  issue: 'Malformed XML structure',
  details: { line: 42, column: 15 }
});
```

**Formato de log**:
```
[WARN] SecurityService: XML parsing warning - Malformed structure at line 42
  source: https://example.com/feed.xml
  details: { line: 42, column: 15 }
```

### 2. Dependências Externas

**sanitize-html**:
```json
{
  "dependencies": {
    "sanitize-html": "^2.14.0"
  }
}
```

**validator.js**:
```json
{
  "dependencies": {
    "validator": "^13.12.0"
  }
}
```

**Instalação**: `npm install sanitize-html validator`

### 3. Rate Limiting Implementation

**AI Services (10 req/min)**:
- Usar token bucket algorithm
- Armazenar em Redis ou memory store
- Configurável via environment variable: `AI_RATE_LIMIT=10`

**API Endpoints (100 req/min)**:
- Implementar middleware de rate limiting
- Usar `express-rate-limit` ou custom implementation
- Configurável: `API_RATE_LIMIT=100`

**RSS Fetching (1 req/5min)**:
- Já implementado via `intervalUpdate` em channels
- Reforçar com adicional validation

### 4. Error Handling para Futuro Blocking

**Estrutura de error response**:
```typescript
{
  "error": "Security validation failed",
  "code": "SECURITY_VALIDATION_FAILED",
  "details": {
    "type": "url_validation",
    "reason": "Invalid URL scheme",
    "offendingValue": "javascript:alert(1)",
    "suggestedAction": "Use http:// or https:// URLs only"
  },
  "timestamp": "2026-04-08T10:30:00Z"
}
```

**Logging para debugging**:
- Manter logs detalhados mesmo quando não bloquear
- Incluir contexto completo para análise posterior

### 5. Memory Safety Implementation

**Worker monitoring**:
```typescript
interface WorkerMetrics {
  memoryUsage: number;
  cpuUsage: number;
  jobCount: number;
  lastRestart: Date;
}

class WorkerManager {
  private metrics = new Map<Worker, WorkerMetrics>();
  
  enforceMemoryLimit(worker: Worker, limitMB: number = 100) {
    const usage = process.memoryUsage();
    if (usage.heapUsed > limitMB * 1024 * 1024) {
      this.logger.warn('Worker exceeded memory limit', {
        workerId: worker.threadId,
        memoryMB: usage.heapUsed / (1024 * 1024),
        limitMB
      });
      worker.terminate();
      return false;
    }
    return true;
  }
}
```

## Integração com Código Existente

### 1. ChannelsService Modificações

**Arquivo**: `packages/rss-aggregation/api/channels/channels.service.ts`

**Mudanças**:
- Adicionar import do SecurityService
- Modificar `getFeed()` para incluir validação de tamanho
- Adicionar timeout de parsing
- Adicionar logging de warnings para XML malformado

**Código exemplo**:
```typescript
async getFeed(rss: string): Promise<RssFeed> {
  // Validação de tamanho
  const securityResult = this.securityService.validateXmlInput(xml, rss);
  if (securityResult.warnings.length > 0) {
    securityResult.warnings.forEach(warning => this.logger.warn(warning.message, warning.details));
  }
  
  // Parsing com timeout
  return Promise.race([
    parser.parseStringPromise(xml),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('XML parsing timeout')), 30000)
    )
  ]);
}
```

### 2. ParserService Modificações

**Arquivo**: `packages/rss-aggregation/api/parser/parser.service.ts`

**Mudanças**:
- Adicionar import do sanitize-html
- Modificar métodos de parsing para incluir sanitização
- Adicionar logging de warnings para HTML suspeito
- Reforçar worker memory limits

### 3. ContentSanitizer Modificações

**Arquivo**: `packages/rss-aggregation/api/raw/content-sanitizer.ts`

**Mudanças**:
- Adicionar import do validator
- Aprimorar `shouldSkipLink()` com validação completa
- Adicionar `validateUrl()` method com validação abrangente
- Extender SOCIAL_DOMAINS com configuração

### 4. RawService Modificações

**Arquivo**: `packages/rss-aggregation/api/raw/raw.service.ts`

**Mudanças**:
- Adicionar rate limiting para AI jobs
- Implementar sanitização de prompts
- Adicionar timeout para chamadas AI
- Logging de falhas de segurança

## Configuração

### Environment Variables

```
# Security Configuration
SECURITY_LOG_LEVEL=WARN
SECURITY_MAX_XML_SIZE_MB=10
SECURITY_XML_TIMEOUT_MS=30000
SECURITY_AI_RATE_LIMIT=10
SECURITY_API_RATE_LIMIT=100
SECURITY_WORKER_MEMORY_LIMIT_MB=100
SECURITY_WORKER_RESTART_JOBS=100

# URL Validation
SECURITY_ALLOWED_DOMAINS=instagram.com,facebook.com,youtube.com
SECURITY_BLOCKED_DOMAINS=malicious.com,phishing.com
SECURITY_MAX_URL_LENGTH=2048
```

### Configuração de Logging

**Níveis**:
- `INFO`: Operações normais
- `WARN`: Security warnings (conteúdo suspeito)
- `ERROR`: Security violations (quando blocking for habilitado)

**Destinos**:
- Console (desenvolvimento)
- File rotation (produção)
- External monitoring (Sentry, Datadog)

## Test Strategy

### 1. Unit Tests
- SecurityService: validações individuais
- Integração com sanitize-html e validator.js
- Rate limiting algorithms
- Memory monitoring

### 2. Integration Tests
- Feed processing com conteúdo suspeito
- URL validation com casos edge
- AI service rate limiting
- Worker memory limits

### 3. Security Tests
- XML injection vectors
- HTML XSS vectors
- URL validation bypass attempts
- Prompt injection attempts

### 4. Performance Tests
- Throughput com security checks
- Memory overhead
- Worker restart impact

## Riscos e Mitigações

### 1. Breaking Existing Functionality
**Risco**: Validação muito restritiva pode quebrar feeds legítimos
**Mitigação**: Abordagem permissiva (apenas warnings), configuração por canal futura

### 2. Performance Degradation
**Risco**: Security checks impactam throughput
**Mitigação**: Otimizações, caching, <10% target degradation

### 3. Dependency Conflicts
**Risco**: Novas libraries conflitam com dependências existentes
**Mitigação**: Testar em ambiente staging, version pinning

### 4. False Positives
**Risco**: Validação bloqueia conteúdo legítimo
**Mitigação**: Logging detalhado, configuração ajustável

## Próximos Passos

1. **Criar SecurityService** com validações básicas
2. **Implementar XML validation** no ChannelsService
3. **Integrar sanitize-html** no ParserService
4. **Aprimorar URL validation** no ContentSanitizer
5. **Adicionar rate limiting** no RawService
6. **Implementar memory safety** no ParserService
7. **Adicionar API validation** nos controllers
8. **Criar testes** para cada componente

## Decisões de Design Confirmadas

1. **Abordagem**: Permissiva - apenas warnings, não blocking
2. **Libraries**: sanitize-html + validator.js aprovadas
3. **Rate limits**: 10/min AI, 100/min API, 1/5min RSS
4. **Error reporting**: Error response detalhada para futuro blocking
5. **Memory safety**: Limits (100MB) + periodic cleanup

---

**Complexidade**: Grande (múltiplos componentes, integração com código existente)
**Dependências**: sanitize-html, validator.js
**Risco**: Médio (integração com código complexo existente)
**Prazo estimado**: 2-3 semanas incremental