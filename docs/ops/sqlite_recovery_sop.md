# Plano de Ação: Recuperação de Database SQLite Corrompida (SOP)

Este documento descreve o "Standard Operating Procedure" (Procedimento Operacional Padrão) caso você se depare novamente com o erro:
`[QueryFailedError: SQLITE_CORRUPT: database disk image is malformed]` em Produção ou Desenvolvimento.

## 1. Desligue (Derrube) a Aplicação
O SQLite é baseado em arquivo. Enquanto uma aplicação estiver em loop de erro tentando ler ou reconectar ao banco, qualquer ferramenta de reparo irá falhar devido a trava (*lock*).

```bash
# Se for no PM2 de Produção
pm2 stop cmmv-blog-api

# Ou mate a porta ativamente e dê Ctrl+C caso esteja em terminal simples
```

## 2. Vá até a pasta da API
Todos os scripts devem ser executados na raiz do projeto onde os arquivos existem.

```bash
cd apps/api
```

## 3. Realize um Backup de Contenção Imediato
Nunca tente consertar o banco original. Tire uma cópia. Caso o conserto piore a corrupção, teremos de onde buscar as informações originais até outra via.

```bash
# Faz a cópia exata do arquivo quebrado
cp database.sqlite database_corrupt.bkp.sqlite
```

## 4. Recupere com Dump e Repipe (Mágica Ocorre Aqui)
As versões modernas do `sqlite3` na linha de comando oferecem o modo recursivo paramétrico de resgate de dados (`.recover`).
Neste fluxo, leremos o banco original corrompido, e exportaremos todos os blocos saudáveis diretamente para um arquivo `.sql` puro.

```bash
sqlite3 database.sqlite ".recover" > recover_data.sql

# 💡 Para SQLite antigos (Ex, em CentOS velhos), caso você tome erro que .recover
# não existe, use o fallback oficial:
# sqlite3 database.sqlite ".dump" > recover_data.sql
```

Esse processo criará um arquivo gigabits com a estrutura, a tabela e todos os `INSERT` das suas notícias e conteúdos de blog intactos (tudo que o motor local conseguiu salvar e exportar de volta ao formato string/texto).

## 5. Recoloque (Substitua) A Base
Aguarde o passo "4" terminar. Depois disso, apague o arquivo SQLite com defeito fisicamente do servidor, e gere um novinho em folha a partir do script SQL salvo no passo anterior.

```bash
# Apaga o danificado
rm database.sqlite

# Injeta a SQL salva num arquivo vazio, dando vida a nova database
sqlite3 database.sqlite < recover_data.sql
```

## 6. Verificação Final de Saúde
Por boa métrica, confira se não sobrou nenhuma indexação maluca do CMMV pela aplicação.

```bash
sqlite3 database.sqlite "PRAGMA integrity_check;"
```
A mensagem aguardada deverá ser puramente um `ok`.

## 7. Reboot
Suba sua aplicação com os logs ativados para acompanhar as checagens com a base de dados.

```bash
# Se for no PM2 de Produção
pm2 start cmmv-blog-api
```

## ⚠️ Prevenção Base para Produção
- Certifique-se de **desligar o gerador/sync automático de tabelas** no CMMV quando a variável de ambiente for PRD (`NODE_ENV=production`).
- Migrations devem ser executadas com a base fora do alcance da internet local.
- Considere um agendamento do CRON para fazer cópias de backup silenciosas diárias ou a cada M horas. O comando é simples: `cp database.sqlite database-$(date +%F).sqlite`
