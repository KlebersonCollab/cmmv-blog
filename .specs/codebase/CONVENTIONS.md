# Convenções de Código

## Padrões de Nomenclatura

### 1. Arquivos e Diretórios
- **Pacotes**: Nome em kebab-case (`rss-aggregation`, `yt-aggregation`)
- **Contracts**: Sufixo `.contract.ts` (`feed-channels.contract.ts`)
- **Services**: Sufixo `.service.ts` (`channels.service.ts`, `raw.service.ts`)
- **Controllers**: Sufixo `.controller.ts` (`channels.controller.ts`)
- **Modules**: Sufixo `.module.ts` (`rss-aggregation.module.ts`)
- **Admin**: Diretório `admin/` com `router.ts`, `client.ts`

### 2. Classes e Tipos
- **Contracts**: Sufixo `Contract` (`FeedChannelsContract`)
- **Modules**: Sufixo `Module` (`RSSAggregationModule`)
- **Services**: Sufixo `Service` (`ChannelsService`)
- **Controllers**: Sufixo `Controller` (`ChannelsController`)

### 3. Variáveis e Métodos
- **Camel case**: `processFeeds`, `getAIRaw`
- **Métodos assíncronos**: Uso de `async/await` padrão
- **Métodos privados**: Prefixo com underscore inconsistente (às vezes usado)

## Padrões de Estrutura

### 1. Contracts com Decorators
```typescript
@Contract({
    namespace: 'RSSAggregation',
    controllerName: 'FeedChannels',
    controllerCustomPath: 'feed/channels',
    // ...
})
export class FeedChannelsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string;
}
```

### 2. Services Pattern
- Injeção de dependências via constructor
- Métodos públicos para operações de negócio
- Tratamento de erros com try/catch
- Logging com `console.log`/`console.error`

### 3. API Client Pattern (Admin)
```typescript
export const useFeedClient = () => {
    const api = useApi();
    
    const channels = {
        get: (filters: Record<string, string>) => { /* ... */ },
        insert: (data: any) => api.authRequest(/* ... */),
        // ...
    };
    
    return { channels, raw, parser };
};
```

## Padrões de Código TypeScript

### 1. Tipagem
- **Explicit types**: Uso consistente de tipos TypeScript
- **Any usage**: `any` usado em alguns lugares (ex: `data: any`)
- **Optional chaining**: Uso moderado de `?.`
- **Non-null assertion**: `!` usado em propriedades de contracts

### 2. Imports
- **Relative imports**: `./parser/parser.service`
- **Package imports**: `@cmmv/core`, `@cmmv/blog`
- **Wildcard exports**: `export * from "./admin"`

### 3. Error Handling
```typescript
try {
    // operação
} catch (error) {
    console.error('Erro detalhado:', error);
    throw error; // ou return null/empty
}
```

## Padrões de Organização

### 1. Estrutura de Pacotes
```
rss-aggregation/
├── api/                    # API backend
│   ├── channels/          # Serviço de canais
│   ├── raw/               # Serviço de processamento raw
│   ├── parser/            # Serviço de parsing
│   └── rss-aggregation.module.ts
├── contracts/             # Entidades/data contracts
├── admin/                 # Frontend admin integration
└── index.ts              # Entry point
```

### 2. Service Structure
- **Large services**: Services com 500-1000+ linhas
- **Métodos agrupados**: Métodos relacionados agrupados
- **Helpers internos**: Funções auxiliares dentro do service

### 3. Module Structure
```typescript
@Module({
    controllers: [ChannelsController, RawController, ParserController],
    providers: [ChannelsService, RawService, ParserService, ContentSanitizer],
    exports: [ChannelsService, RawService, ParserService],
})
export class RSSAggregationModule {}
```

## Padrões de Documentação

### 1. Comentários
- **Minimal documentation**: Poucos comentários no código
- **TODO comments**: Alguns `// TODO:` encontrados
- **Error context**: Mensagens de erro descritivas

### 2. Logging
- **Console logging**: `console.log`, `console.error`, `console.warn`
- **Debug info**: Logging detalhado para debugging
- **Performance timing**: `console.time`/`console.timeEnd` em alguns lugares

## Convenções de Segurança

### 1. Input Validation
- **URL validation**: Validação de URLs em content-sanitizer
- **Regex safety**: Workers isolam execução de regex
- **Timeout handling**: Timeouts em operações de rede

### 2. Error Propagation
- **Throw vs return**: Mistura de ambos os padrões
- **Error wrapping**: Algumas vezes, erros são wrappados
- **Fallback values**: Valores padrão em caso de erro

## Desvios de Padrão

### 1. Inconsistências
- **Private method naming**: Alguns usam `_prefix`, outros não
- **Error handling**: Padrões mistos de tratamento de erros
- **Type safety**: Uso de `any` em alguns lugares, tipos específicos em outros

### 2. Complexidade
- **Large methods**: Métodos com 50+ linhas
- **Nested conditionals**: Múltiplos níveis de if/else
- **Complex logic**: Lógica de parsing e AI embutida em services

## Boas Práticas Identificadas

1. **Separation of concerns**: Services separados por responsabilidade
2. **Async/await pattern**: Uso consistente de async/await
3. **Type safety**: TypeScript usado extensivamente
4. **Modular structure**: Estrutura modular clara
5. **Error logging**: Logging detalhado de erros

## Áreas para Padronização

1. **Error handling**: Definir padrão consistente (throw vs return)
2. **Private methods**: Definir convenção para métodos privados
3. **Interface types**: Reduzir uso de `any` com interfaces específicas
4. **Method length**: Refatorar métodos muito longos
5. **Test structure**: Adicionar estrutura de testes