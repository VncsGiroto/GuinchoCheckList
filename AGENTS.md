# AGENTS.md — GuinchoCheckList

> App Expo offline-first para vistoria de veículos. Leia este arquivo antes de qualquer alteração.

## Stack
- Expo SDK 54, React Native 0.81.5, React 19.1, TypeScript `strict` (`expo/tsconfig.base`)
- `expo-sqlite` (WAL), `expo-camera` + `expo-image-manipulator`, `expo-location`, `expo-print`, `expo-document-picker`, `expo-sharing`, `jszip`
- Node 22.14.0 (fnm via `.nvmrc`/`.node-version`, `engines: >=22.13` em `package.json`), pnpm 9.15.9 via corepack
- `pnpm-workspace.yaml` com `packages: ['.']` + `allowBuilds: esbuild:false`

## Comandos exatos
```bash
fnm use --install-if-missing  # lê .nvmrc (22.14.0)
corepack pnpm install
corepack pnpm run typecheck  # tsc --noEmit
corepack pnpm run test       # vitest run (sem watch)
corepack pnpm run android    # expo start --android (ios/web variam)
corepack pnpm exec vitest run src/services/backup/backupPayload.test.ts  # teste único
eas build --platform android --profile preview --message "Teste de campo" # preview=APK, production=AAB
```
Ordem de validação antes de PR: `typecheck` → `test`. Não existe eslint/prettier neste repo.

## Arquitetura e entrypoints
- `index.ts` → `App.tsx:19` — roteamento manual via `AppView = "home"|"create"|"details"|"settings"` (sem React Navigation).
- `src/database/client.ts:16` inicializa DB (`PRAGMA journal_mode=WAL; foreign_keys=ON; runMigrationsAsync`). Singleton lazy em `getDatabaseAsync`.
- `src/database/schema.ts:6` — `checklists` + `app_settings` (`id='default'` seed). Migrações são `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN` com `try/catch` idempotente.
- `src/database/repositories/` — `checklistRepository.ts` (CRUD + `savePickup`/`saveDelivery` com trava de status `rascunho→em_transito→concluido`) e `settingsRepository.ts`.
- `src/services/backup/` — export/import zip; `src/services/pdf/` — `buildChecklistHtml` + `generateChecklistPdf`; `src/services/checklist/deleteChecklist.ts`.
- `src/types/checklist.ts` e `src/types/settings.ts` são fonte da verdade de tipos; `src/constants/storage.ts` define `girofrancis.db` e `checklist-photos`.
- `app.json:41` lista plugins Expo (`expo-camera`, `expo-location`, `expo-sqlite`, `expo-document-picker`) — adicionar permissão/plugin aqui, não direto no nativo.

## Banco e filesystem — armadilhas
- Import correto é `expo-file-system/legacy` (`src/database/client.ts:4`, `src/services/backup/*.ts:1`) — o path raiz quebra.
- Arquivos do DB resolvidos por `PRAGMA database_list` com fallback para `${FileSystem.documentDirectory}SQLite/girofrancis.db` + `-wal`/`-shm` (`src/database/client.ts:51`).
- `checklistRepository.ts:173` envolve tudo em `executeWithDatabaseRecoveryAsync` — detecta `NativeDatabase.* NullPointerException` (`src/database/databaseError.ts`), faz `resetDatabaseConnectionAsync` + `initializeDatabaseAsync` e tenta novamente. Não remover.
- Coordenadas salvas como `"lat,long"` string (`serializeCoordinatesNullable`), fotos como `JSON.stringify(photoPaths)` no SQLite.

## Backup / Restore
- Export (`src/services/backup/exportBackupZip.ts:9`): zipa `database/girofrancis.db*` (se existir) + fotos deduplicadas em `photos/` + `checklists.json` (paths relativos `photos/<nome>`) + `provider-settings.json` + `manifest.json` (`formatVersion:3`).
- Import (`src/services/backup/importBackupZip.ts:38`): exige `DocumentPicker` zip; valida que toda foto referenciada em `checklists.json` existe em `photos/`; rejeita backup legado só-`.db` (`importBackupZip.ts:87`); remapeia paths para `${documentDirectory}checklist-photos/<nome>`.
- Nunca versionar `*.db`, `*.sqlite`, `*.zip`, `*.apk`, `*.aab` (`.gitignore:44-54`).

## Testes
- Apenas Vitest, sem config dedicada. Arquivos: `src/database/client.test.ts` e `src/services/backup/backupPayload.test.ts`.
- `parseBackupChecklists` / `parseBackupProviderSettings` validam payload com erros em PT-BR (`src/services/backup/backupPayload.ts:60`).

## Build e deploy
- `eas.json:5` — `preview` (APK `internal`), `production` (AAB). APK de campo: `eas login && eas build --platform android --profile preview` (ver `TESTE_CAMPO_APK.md`).
- Pastas nativas `/android` e `/ios` são geradas (`gitignore:42-43`) — não editar direto.
- Sem `.env` neste repo; `extra.eas.projectId` em `app.json:51`.

## Convenções do repositório
- TS strict, evitar `any` (`CONTRIBUTING.md:14`). Preferir updates imutáveis, tratamento de erro em camera/location/fs/db.
- PRs pequenos e focados; rodar `typecheck` + `test`; anexar screenshot/vídeo se UI mudou (`.github/pull_request_template.md:11`).
- Privacidade: remover PII (nome, telefone, documento, coordenadas, assinaturas) de issues/logs (`README.md:77`, `SECURITY.md:21`). Vulnerabilidades não vão em issue pública.
- Commits com prefixo `feat:`, `fix:`, `chore:`, `docs:`, `test:` (`CONTRIBUTING.md:32`).
