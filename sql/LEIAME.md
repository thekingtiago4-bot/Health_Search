# SQLs do Health Search — ordem e para que serve cada um

Todos podem ser rodados de novo sem apagar dados.

| Ordem | Arquivo | Para que serve |
|---|---|---|
| 1 | supabase-v6.3.1-operacao.sql | Tabela de bipagens (Operação/NexBip) |
| 2 | supabase-v6.3.8-banco-romaneios.sql | Banco de romaneios |
| 3 | supabase-TUDO-6.7-a-7.4.sql | Sincronização, segurança, auditoria, 2 etapas, romaneio editável e chamados (junta 6.7.0, 6.9.0, 7.0.0, 7.1.0, 7.2.0 e 7.4.0) |
| 4 | supabase-v8.3.0.sql | Rotas / perfis |
| 5 | supabase-v8.4.0-versoes.sql | Versões permanentes (💾 Salvar) |
| 6 | supabase-v8.5.0.sql | 90 dias online / limpeza |
| 7 | supabase-v8.6.0.sql | Bloqueio de usuário apaga cópia |
| 8 | supabase-v8.9.7-corrigir-dia-bipes.sql | Correção única do dia dos bipes |
| 9 | supabase-v9.1.1-auditoria-leve.sql | Auditoria leve (economiza disco) |
| — | restaurar-regioes-09-11.sql | Uso único: restaurou as regiões em 09/11/2026 |
| — | VERIFICAR-tudo.sql | Só confere se está tudo certo (não altera nada) |

Os arquivos 6.7.0, 6.9.0, 7.0.0, 7.1.0, 7.2.0 e 7.4.0 separados já estão dentro do TUDO (nº 3).
