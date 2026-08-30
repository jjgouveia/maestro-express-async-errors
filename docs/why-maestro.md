# Por que Maestro (ainda)

Eu fiz o Maestro pra um problema chato do Express 4: você escreve `async`, dá `throw` ou a promise rejeita, e o `next(err)` nunca é chamado. A request trava ou o processo cai.

No Express 5 isso já é nativo. Wrapper vira opcional.

## O que ele faz

`maestro(fn)` (e o alias `asyncHandler`) envolve a rota e manda rejeição pro middleware de erro. Mesma ideia do `express-async-handler`.

Se você quer o estilo do `express-async-errors` (um import e pronto), tem `maestro.patch()` ou `import '.../register'`. Isso só mexe no Express 4. No 5 eu deixo no-op de propósito, pra não duplicar `next(err)`.

O diferencial de verdade é o `maestro.from(ErrorClass, handler)`.

A maioria dos wrappers só resolve a metade técnica: o erro chega no middleware. O que sobra é um `app.use((err, req, res, next) => …)` gigante com `if/else` ou `instanceof` empilhado. Status HTTP, mensagem pro cliente e log misturados no mesmo bloco.

Com o `from`, cada erro de domínio vira um middleware pequeno. `UserNotFoundError` responde 404. `PaymentFailedError` responde 402. O genérico no fim só pega o que ninguém mapeou. A rota só precisa `throw` o erro. Quem lê o código vê a regra de negócio no nome da classe, não enterrada num catch-all.

Isso muda o desenho: erro passa a ser contrato entre camadas, não string solta. No TypeScript o `from` estreita o `err` pra classe que você passou (`userId`, `code`, `statusCode` sem cast). Em app nova no Express 5 o wrap async pode sobrar, mas o `from` ainda vale se você quiser esse roteamento sem reinventar.

Exemplo mínimo da tipagem está no [README](../README.md#domain-errors--maestrofrom).

Zero dependência de runtime.

## Quando eu usaria

App ainda no Express 4. Ou um time que quer TypeScript e erros de domínio sem reinventar o wrap. Uma lib com wrapper e patch opt-in no mesmo lugar.

## Quando eu não usaria

App nova no Express 5 e sem necessidade do `from`: fica no runtime nativo. Se o que você quer é só o patch global e o `express-async-errors` já resolve, não tem drama em usar o pacote de milhões de downloads.

## Em uma frase

Maestro leva erro async do Express até o middleware certo, com TypeScript e `from` pra domínio. Patch global só onde ainda faz sentido: Express 4.
