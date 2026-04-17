# Girofrancis Checklist

Aplicativo mobile para padronizar vistoria de veiculos em coleta e entrega de guincho, com foco em uso offline e seguranca juridica.

## Stack Inicial

- Expo SDK 54 + React Native + TypeScript estrito
- SQLite local (`expo-sqlite`)
- Camera e compressao de imagens (`expo-camera`, `expo-image-manipulator`)
- GPS (`expo-location`)
- PDF via HTML (`expo-print`)
- Compartilhamento de arquivos (`expo-sharing`)

## Estrutura Inicial

```text
src/
├── components/
├── database/
│   ├── repositories/
│   ├── client.ts
│   └── schema.ts
├── hooks/
├── screens/
├── services/
│   └── pdf/
├── theme/
└── types/
```

## Regras Ja Aplicadas

- TypeScript estrito habilitado
- Modelo de status: `rascunho -> em_transito -> concluido`
- Bloqueio de edicao na etapa de coleta apos assinatura/status `em_transito`
- Captura de dados de auditoria (GPS + horario) prevista no repositorio
- Compressao de fotos para largura maxima `1200px` e qualidade `80%`

## Rodando Localmente

1. Instale dependencias:
   - `corepack pnpm install`
2. Inicie o app:
   - `corepack pnpm run android`
3. Validacao de tipos:
   - `corepack pnpm run typecheck`

## Proxima Etapa Recomendada

1. Telas de fluxo de checklist (coleta, fotos, assinatura, entrega)
2. Grid de fotos por angulo e danos
3. Exportacao ZIP (`.db` + pasta de fotos)
4. Geracao de PDF com layout final da marca Girofrancis
5. Testes de repositorio e regras de imutabilidade

