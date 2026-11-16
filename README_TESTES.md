# Rota Prime — Como testar a API

## 1. Ligar o servidor

Na pasta do projeto:

```
npm install
npm start
```

Deve aparecer `Rota Prime rodando em http://localhost:3000`. Deixe esse terminal aberto e use **outro terminal** para os testes abaixo.

> Para usar outra porta: `PORT=4000 npm start` (Git Bash/Mac/Linux) ou `$env:PORT=4000; npm start` (PowerShell).

## 2. Rotas

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/carros?busca=&categoria=` | Pesquisa no catálogo |
| GET | `/api/carros/:id` | Mostra um veículo |
| POST | `/api/reservas` | Cria a reserva e devolve o código (`id`) |
| GET | `/api/reservas/:id?email=` | Consulta a reserva |
| PUT | `/api/reservas/:id?email=` | Edita a reserva (todos os campos) |
| PATCH | `/api/reservas/:id?email=` | Edita só os campos enviados |
| DELETE | `/api/reservas/:id?email=` | Cancela (o registro fica com status `cancelada`) |

Campos da reserva: `nome`, `email`, `carro_id`, `retirada`, `devolucao` (datas em `AAAA-MM-DD`).

Consultar, editar e cancelar exigem o **e-mail** da reserva em `?email=`.

## 3. Comandos — Git Bash, Mac ou Linux (curl)

Rode na ordem, um por vez. Se o `id` criado não for 1, troque o número nos comandos seguintes. A data de retirada precisa ser futura.

**Catálogo**
```bash
curl http://localhost:3000/api/carros
```
```bash
curl "http://localhost:3000/api/carros?busca=polo"
```
```bash
curl "http://localhost:3000/api/carros?categoria=Conforto"
```
```bash
curl http://localhost:3000/api/carros/2
```

**Criar reserva**
```bash
curl -X POST http://localhost:3000/api/reservas -H "Content-Type: application/json" -d '{"nome":"Maria Silva","email":"maria@email.com","carro_id":2,"retirada":"2026-12-01","devolucao":"2026-12-05"}'
```

**Consultar**
```bash
curl "http://localhost:3000/api/reservas/1?email=maria@email.com"
```

**Editar parte dos dados (PATCH)**
```bash
curl -X PATCH "http://localhost:3000/api/reservas/1?email=maria@email.com" -H "Content-Type: application/json" -d '{"devolucao":"2026-12-07"}'
```

**Editar tudo (PUT)**
```bash
curl -X PUT "http://localhost:3000/api/reservas/1?email=maria@email.com" -H "Content-Type: application/json" -d '{"nome":"Maria S","email":"maria@email.com","carro_id":3,"retirada":"2026-12-02","devolucao":"2026-12-06"}'
```

**Cancelar**
```bash
curl -X DELETE "http://localhost:3000/api/reservas/1?email=maria@email.com"
```

## 4. Comandos — PowerShell (Windows)

```powershell
Invoke-RestMethod http://localhost:3000/api/carros
```
```powershell
Invoke-RestMethod "http://localhost:3000/api/carros?busca=polo"
```
```powershell
Invoke-RestMethod http://localhost:3000/api/carros/2
```
```powershell
Invoke-RestMethod -Method Post http://localhost:3000/api/reservas -ContentType "application/json" -Body '{"nome":"Maria Silva","email":"maria@email.com","carro_id":2,"retirada":"2026-12-01","devolucao":"2026-12-05"}'
```
```powershell
Invoke-RestMethod "http://localhost:3000/api/reservas/1?email=maria@email.com"
```
```powershell
Invoke-RestMethod -Method Patch "http://localhost:3000/api/reservas/1?email=maria@email.com" -ContentType "application/json" -Body '{"devolucao":"2026-12-07"}'
```
```powershell
Invoke-RestMethod -Method Put "http://localhost:3000/api/reservas/1?email=maria@email.com" -ContentType "application/json" -Body '{"nome":"Maria S","email":"maria@email.com","carro_id":3,"retirada":"2026-12-02","devolucao":"2026-12-06"}'
```
```powershell
Invoke-RestMethod -Method Delete "http://localhost:3000/api/reservas/1?email=maria@email.com"
```

> No PowerShell, respostas de erro (400, 404, 409) aparecem como mensagem vermelha. É normal; o JSON com o motivo vem junto.

## 5. Erros esperados (para testar a validação)

Rode depois de cancelar a reserva (Git Bash/Mac/Linux).

| Teste | Comando | Esperado |
|---|---|---|
| Dados inválidos | `curl -X POST http://localhost:3000/api/reservas -H "Content-Type: application/json" -d '{"nome":"x","email":"abc","carro_id":99}'` | 400 com detalhe por campo |
| JSON quebrado | `curl -X POST http://localhost:3000/api/reservas -H "Content-Type: application/json" -d '{bad'` | 400 `JSON inválido.` |
| E-mail de outra pessoa | `curl "http://localhost:3000/api/reservas/1?email=outro@email.com"` | 404 |
| Sem e-mail | `curl http://localhost:3000/api/reservas/1` | 400 |
| Editar reserva cancelada | `curl -X PATCH "http://localhost:3000/api/reservas/1?email=maria@email.com" -H "Content-Type: application/json" -d '{"nome":"Zed"}'` | 409 |
| Veículo inexistente | `curl http://localhost:3000/api/carros/99` | 404 |
| Rota inexistente | `curl http://localhost:3000/api/xyz` | 404 |

## 6. Conferir o resultado

Abra `backend/reservas.csv`: cada reserva criada, alterada ou cancelada aparece lá.

Para zerar os testes, apague as linhas e deixe apenas o cabeçalho:

```
id,nome,email,carro_id,retirada,devolucao,status
```
