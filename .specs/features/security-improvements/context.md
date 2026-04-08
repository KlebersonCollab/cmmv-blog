# Contexto: Decisões sobre Melhorias de Segurança

## Data: 2026-04-08
**Status**: Decisões tomadas, pronto para design

## Gray Areas Identificados

### 1. Balance Security vs Functionality
**Problema**: Quão restritivas devem ser as validações de segurança?

**Contexto**: 
- Feeds RSS/Atom são externos, não controlados por nós
- Conteúdo pode ser malformado mas legítimo
- Validação muito restritiva pode bloquear muitos feeds
- Validação muito permissiva permite vulnerabilidades

**Opções**:
- **Opção A (Restritiva)**: Bloquear qualquer conteúdo suspeito, melhor segurança
- **Opção B (Moderada)**: Sanitizar conteúdo suspeito, manter funcionalidade
- **Opção C (Permissiva)**: Log warnings apenas, máxima compatibilidade

**Recomendação**: Opção B com configuração por canal (strict/lenient modes)

**Pergunta para usuário**: Qual abordagem preferir? Precisamos de configuração por canal ou política global?

### 2. External Libraries vs Custom Implementation
**Problema**: Usar bibliotecas de terceiros ou implementar validação customizada?

**Contexto**:
- **Vantagens de libraries**: Testadas, mantidas, amplamente usadas
- **Desvantagens**: Dependências extras, possíveis conflitos, bundle size
- **Vantagens de custom**: Controle total, sem dependências externas
- **Desvantagens**: Mais código para manter, possíveis bugs de segurança

**Opções para HTML sanitization**:
- **sanitize-html**: Muito popular, bem testada
- **DOMPurify**: Focado em segurança, mais leve
- **Custom implementation**: Baseada em regex atual, mas reforçada

**Opções para URL validation**:
- **validator.js**: Biblioteca abrangente
- **Custom**: Baseada em ContentSanitizer existente

**Recomendação**: Usar sanitize-html para HTML, validator.js para URLs (ambas bem mantidas)

**Pergunta para usuário**: Aceitar dependências externas para segurança? Quais libraries preferir?

### 3. Rate Limiting Thresholds
**Problema**: Quais limites para AI services e APIs?

**Contexto**:
- **AI services (Gemini)**: Custo monetário, rate limits do provider
- **API endpoints**: Prevenção de DoS, abuso
- **Feeds RSS**: Fetching frequente pode sobrecarregar servidores externos

**Limites sugeridos**:
- **AI services**: 10 requisições/minuto por usuário
- **API endpoints**: 100 requisições/minuto por IP
- **RSS fetching**: 1 requisição/5 minutos por feed

**Recomendação**: Configuráveis via environment variables

**Pergunta para usuário**: Aceita os limites sugeridos? Precisa de configuração diferente?

### 4. Error Handling para Blocked Content
**Problema**: Como reportar quando conteúdo é bloqueado por segurança?

**Contexto**:
- Usuários/admin precisam saber por que conteúdo foi rejeitado
- Logging para debugging e compliance
- User experience: mensagens claras vs. erros técnicos

**Opções**:
- **Opção A**: Silent drop (apenas logging)
- **Opção B**: Error response com motivo detalhado
- **Opção C**: Warning flag no conteúdo (e.g., "[SECURITY FILTERED]")

**Recomendação**: Opção B para API, Opção C para conteúdo armazenado

**Pergunta para usuário**: Como deve ser a experiência do usuário/admin quando conteúdo é bloqueado?

### 5. Memory Safety vs Performance
**Problema**: Trade-off entre isolation rigorosa e overhead de performance.

**Contexto**:
- Worker threads já são isolados
- AI jobs podem vazar memória
- Sandboxing adicional tem custo de performance

**Opções**:
- **Opção A**: Memory limits estritos (kill workers > 100MB)
- **Opção B**: Monitoring apenas (log warnings)
- **Opção C**: Periodic cleanup (reiniciar workers a cada N jobs)

**Recomendação**: Opção A + C (limits + periodic cleanup)

**Pergunta para usuário**: Balance preferido entre segurança de memória e performance?

## Impacto nas Decisões

### Se escolher Libraries Externas:
- Aumentar bundle size do pacote
- Manter dependências atualizadas
- Potenciais breaking changes em updates

### Se escolher Configuração por Canal:
- UI admin precisa de configuração de segurança
- Mais complexidade de configuração
- Flexibilidade para diferentes tipos de feeds

### Se escolher Limites Restritivos:
- Menos conteúdo processado
- Mais erros reportados
- Maior segurança

## Perguntas Chave para o Usuário

1. **Abordagem geral**: Restritiva, moderada ou permissiva?
2. **Dependências externas**: Aceita adicionar sanitize-html e validator.js?
3. **Limites de rate**: Configuráveis ou fixos? Quais valores?
4. **Error reporting**: Como usuários devem saber de bloqueios?
5. **Configuração**: Global ou por canal?

## Decisões Tomadas (2026-04-08)

### 1. Balance Security vs Functionality
**Decisão**: Abordagem Permissiva (Opção C)  
**Detalhes**: Apenas log warnings para conteúdo suspeito, máxima compatibilidade com feeds RSS externos.

### 2. External Libraries vs Custom Implementation
**Decisão**: Usar sanitize-html + validator.js  
**Detalhes**: Adicionar ambas dependências externas para segurança comprovada.

### 3. Rate Limiting Thresholds
**Decisão**: Manter limites sugeridos como padrão  
**Detalhes**:
- AI services: 10 requisições/minuto por usuário
- API endpoints: 100 requisições/minuto por IP  
- RSS fetching: 1 requisição/5 minutos por feed

### 4. Error Handling para Blocked Content
**Decisão**: Error response com motivo detalhado  
**Detalhes**: Quando segurança bloquear conteúdo, retornar error response com detalhes do motivo.

### 5. Memory Safety vs Performance
**Decisão**: Implementar abordagem recomendada  
**Detalhes**: Memory limits estritos (kill workers > 100MB) + periodic cleanup (reiniciar workers a cada N jobs)

## Impacto das Decisões

1. **Bundle size aumentará** com sanitize-html e validator.js
2. **Logging aumentará** com abordagem permissiva (apenas warnings)
3. **Error responses mais informativas** para admin users
4. **Configuração simples** - limites fixos inicialmente, pode evoluir para configuráveis

## Próximos Passos

1. ✅ Atualizar spec.md com decisões
2. Criar design.md baseado nas decisões
3. Break into tasks
4. Implementar

---

**Status**: Decisões tomadas, pronto para design
**Prioridade**: Alta - prosseguir com design