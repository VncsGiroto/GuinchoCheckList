# Girofrancis Checklist

Aplicativo mobile (Expo/React Native) para padronizar a vistoria de veiculos em servicos de guincho, com foco em uso offline e rastreabilidade juridica.

## Principais funcionalidades

- Fluxo de checklist com coleta e entrega
- Captura de fotos por angulo (incluindo interior e danos)
- Captura de assinatura com rotacao para landscape
- Registro de GPS e horario por etapa
- Geracao de PDF com dados da prestadora
- Exportacao/importacao de backup em `.zip` (checklists, fotos e configuracoes)
- Persistencia local em SQLite

## Stack

- Expo SDK 54
- React Native + TypeScript (strict)
- `expo-sqlite`
- `expo-camera` + `expo-image-manipulator`
- `expo-location`
- `expo-print`
- `expo-document-picker`
- `expo-sharing`

## Estrutura do projeto

```text
src/
├── components/
├── constants/
├── database/
│   ├── repositories/
│   ├── client.ts
│   └── schema.ts
├── hooks/
├── screens/
├── services/
│   ├── backup/
│   ├── checklist/
│   └── pdf/
├── theme/
└── types/
```

## Requisitos

- Node.js 20+
- Corepack habilitado
- Android Studio (para emulador e builds nativas locais)
- Conta Expo/EAS para build na nuvem

## Execucao local

```bash
corepack pnpm install
corepack pnpm run typecheck
corepack pnpm run test
corepack pnpm run android
```

## Build de APK para teste em campo

Consulte o guia completo:

- [TESTE_CAMPO_APK.md](./TESTE_CAMPO_APK.md)

Resumo:

```bash
eas login
eas build --platform android --profile preview --message "Teste de campo"
```

## Publicacao e seguranca

- Antes de abrir issues publicas com logs, remova dados pessoais (nome, telefone, documento, coordenadas e assinaturas).
- Nao versionar backups de producao (`.zip`, `.db`) no repositorio.
- Para reporte de vulnerabilidade, use o fluxo em [SECURITY.md](./SECURITY.md).

## Contribuicao

Leia [CONTRIBUTING.md](./CONTRIBUTING.md) antes de abrir PR.

## Licenca

MIT - veja [LICENSE](./LICENSE).
