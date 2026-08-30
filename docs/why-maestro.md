# Por que Maestro (ainda)

Pacote pequeno para Express: erros de handlers `async` chegam no middleware de erro, com TypeScript e roteamento por classe de erro.

## A dor

No **Express 4**, `throw` / promise rejeitada dentro de um `async` handler **não** chama `next(err)`. A request pode travar ou derrubar o processo.

No **Express 5**, isso é nativo. Wrappers viram opcionais.

## O que o Maestro faz

1. **`maestro(fn)` / `asyncHandler`** — wrap por rota (`Promise.resolve(...).catch(next)`), igual ao `express-async-handler`.
2. **`maestro.patch()` / `import '.../register'`** — patch global só no Express 4 (estilo `express-async-errors`). No Express 5 é no-op de propósito.
3. **`maestro.from(ErrorClass, handler)`** — middleware de erro tipado para erros de domínio; o resto cai no handler genérico.

Zero dependências de runtime.

## Quando usar

- Legado Express 4 que ainda não migrou.
- Time que quer TypeScript + erros de domínio sem reinventar o wrap.
- Querer **uma** lib com wrapper **e** patch opt-in.

## Quando não usar

- App nova em Express 5 sem necessidade de `from` — use o runtime nativo.
- Preferir patch global de um pacote já dominante (`express-async-errors`) e não precisa de TypeScript/`from`.

## Mensagem curta

> Maestro: async errors no Express com TypeScript, `from` para domínio, e patch global opt-in só onde ainda faz sentido (Express 4).
