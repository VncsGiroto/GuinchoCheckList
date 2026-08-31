# Build APK e Teste em Campo

## 1) Preparacao (uma vez)

```bash
npm install -g eas-cli
eas login
cd C:\Dev\Codex\girofrancis-checklist
```

## 2) Gerar APK interno

```bash
eas build --platform android --profile preview --message "Teste de campo v1"
```

Quando finalizar, o terminal vai mostrar a URL da build.

## 3) Instalar no celular do testador

1. Envie a URL da build por WhatsApp, email ou Telegram.
2. No Android do testador, abrir a URL.
3. Baixar e instalar o APK.
4. Se bloquear, liberar "instalar apps desconhecidos" para o app usado no download.

## 4) Roteiro rapido de validacao em campo

1. Criar checklist
2. Capturar fotos (incluindo interior)
3. Salvar coleta (com/sem assinatura)
4. Salvar entrega (com/sem assinatura)
5. Gerar PDF e validar dados da prestadora
6. Exportar backup e importar backup

## Mensagem pronta para o testador

```text
Segue o app para teste de campo.

1) Abra este link no seu celular Android: <COLE_AQUI_A_URL_DA_BUILD>
2) Baixe e instale o aplicativo.
3) Se aparecer bloqueio, ative "Instalar apps desconhecidos" para o navegador/WhatsApp.
4) Teste estes passos:
   - criar checklist
   - tirar fotos (inclusive interior)
   - salvar coleta e entrega
   - gerar PDF
   - exportar/importar backup
5) Me envie feedback com:
   - celular/modelo
   - hora aproximada do erro
   - print/video do problema
   - passo a passo que estava fazendo
```
