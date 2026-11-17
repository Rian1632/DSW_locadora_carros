# Rota Prime — Reservas online (Etapa 2)

Site de locadora de carros com reservas online: **HTML/CSS + JavaScript** no frontend, **Node.js/Express** no backend e **CSV** para guardar os dados. O cliente escolhe o veículo, reserva pela internet e, depois, consulta, altera ou cancela a reserva usando o código recebido.

## Como rodar

Requisito: [Node.js](https://nodejs.org) 18 ou superior.

```
npm install
npm start
```

Abra **http://localhost:3000**. O site precisa ser aberto por esse endereço, e não pelo arquivo `index.html` direto, para conseguir falar com a API. Para parar o servidor, use `Ctrl + C`.

## Como usar

1. Em **Veículos**, pesquise pelo modelo ou filtre por categoria e clique em **Reservar**.
2. Preencha nome, e-mail e datas e confirme. A tela mostra o **código da reserva**: anote.
3. Em **Minha reserva**, informe o código e o e-mail para consultar, **alterar** ou **cancelar**.

## Páginas

| Página | O que faz |
|---|---|
| `index.html` | Início, com veículos em destaque que levam direto à reserva |
| `pages/catalogo.html` | Catálogo vindo da API, com pesquisa por modelo e filtro por categoria |
| `pages/reserva.html` | Formulário de reserva (POST). Mostra estimativa de valor e, ao confirmar, o **código da reserva** |
| `pages/minha-reserva.html` | Consulta por código + e-mail (GET), alteração (PUT) e cancelamento (DELETE) |
| `pages/servicos.html`, `pages/sobre.html` | Informativas |

## Estrutura do projeto

```
index.html, pages/          páginas do site
assets/css/style.css        estilos de todas as páginas
assets/js/api.js            funções compartilhadas (chamadas à API, formatação, erros)
assets/js/catalogo.js       lógica do catálogo
assets/js/reserva.js        lógica da página de reserva
assets/js/minha-reserva.js  lógica de consulta, alteração e cancelamento
backend/server.js           servidor Express (entrega o site e a API)
backend/router.js           rotas da API e validações
backend/storage.js          leitura e gravação dos CSV
backend/carros.csv          catálogo de veículos
backend/reservas.csv        reservas (continuam salvas ao reiniciar o servidor)
backend/imagens/            fotos dos veículos
README_TESTES.md            testes da API pelo terminal (curl / PowerShell)
```

## Como as partes se conectam

```
Navegador (HTML + JS)  --fetch()-->  API Express (router.js)  -->  storage.js  -->  CSV
        ^                                    |
        +-------------- JSON ----------------+
```

O JavaScript do navegador nunca lê o CSV: ele só conversa com a API em JSON. Quem valida os dados e grava no arquivo é o servidor.

## API

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/carros?busca=&categoria=` | Pesquisa no catálogo |
| GET | `/api/carros/:id` | Mostra um veículo |
| POST | `/api/reservas` | Cria a reserva e devolve o código (`id`) |
| GET | `/api/reservas/:id?email=` | Consulta a reserva |
| PUT | `/api/reservas/:id?email=` | Altera todos os campos |
| PATCH | `/api/reservas/:id?email=` | Altera só os campos enviados |
| DELETE | `/api/reservas/:id?email=` | Cancela (o registro fica com status `cancelada`) |

Consultar, alterar e cancelar exigem o e-mail da reserva. Exemplos de comandos em `README_TESTES.md`.

## Dados (CSV)

- `carros.csv`: `id, modelo, categoria, preco, imagem`.
- `reservas.csv`: `id, nome, email, carro_id, retirada, devolucao, status`. O `status` é `ativa` ou `cancelada`.
- O valor da diária fica no catálogo. A estimativa da reserva é calculada na tela e **não é gravada**.

Para **zerar as reservas** (por exemplo, antes da apresentação), deixe `backend/reservas.csv` só com o cabeçalho. A próxima reserva volta a ter o código 1.

```
id,nome,email,carro_id,retirada,devolucao,status
```

## Regras de validação

Feitas no servidor; os erros aparecem embaixo de cada campo do formulário.

- Nome de 3 a 100 caracteres, sem vírgula nem quebra de linha e sem começar com `=`, `+`, `-` ou `@` (protege o CSV).
- E-mail em formato válido (guardado em minúsculas).
- Veículo existente no catálogo.
- Retirada não pode ser no passado; devolução depois da retirada; locação de no máximo 90 dias.
- Reserva cancelada não pode mais ser alterada.

## Roteiro de testes pela interface

Com o servidor ligado. Use datas futuras nos testes.

| # | O que fazer | Resultado esperado |
|---|---|---|
| 1 | Abrir **Veículos** | Lista com os 10 veículos |
| 2 | Pesquisar `polo` | Só o Volkswagen Polo |
| 3 | Pesquisar `zzz` | "Nenhum veículo encontrado para essa busca." |
| 4 | Clicar em **Conforto** e depois em **Todos** | 3 veículos e depois 10 |
| 5 | Clicar em **Reservar** em um veículo | Abre a reserva com o veículo já escolhido |
| 6 | Confirmar o formulário vazio | Erro embaixo de cada campo, nada é gravado |
| 7 | Retirada no passado, devolução antes da retirada ou período maior que 90 dias | Erro no campo correspondente |
| 8 | Preencher tudo corretamente e confirmar | "Reserva confirmada!" com o código; nova linha em `reservas.csv` |
| 9 | Clicar em **Ver minha reserva** | Abre os dados da reserva já consultados |
| 10 | Em **Minha reserva**, consultar com código e e-mail corretos | Mostra os dados da reserva |
| 11 | Consultar com e-mail errado | "Reserva não encontrada." |
| 12 | **Alterar reserva**, mudar a devolução e salvar | "Reserva atualizada com sucesso."; `reservas.csv` alterado |
| 13 | **Cancelar reserva** e confirmar | Selo "Cancelada", sem botões; status `cancelada` no CSV |
| 14 | Parar o servidor (`Ctrl + C`), ligar de novo (`npm start`) e consultar a mesma reserva | Os dados continuam lá (persistência) |
| 15 | Com a página aberta, parar o servidor e fazer uma pesquisa no catálogo | "Não foi possível falar com o servidor." |

## Limitações conhecidas

- **Não há controle de disponibilidade:** o mesmo carro pode ser reservado várias vezes nas mesmas datas. Gestão de frota está fora do escopo do projeto.
- **Reservas já iniciadas não podem ser alteradas:** a regra "retirada não pode ser no passado" vale também na edição.
- **O código da reserva é sequencial.** O e-mail funciona como segunda confirmação, mas não é um login. Serve para o trabalho, não para um sistema real.
- **CSV não é banco de dados:** serve para um servidor único, sem acessos simultâneos intensos.
- As datas de exemplo em `README_TESTES.md` e a reserva de exemplo em `reservas.csv` são de 2026-12; depois delas, troque por datas futuras.

## Problemas comuns

| Problema | O que fazer |
|---|---|
| A página abre, mas mostra "Não foi possível falar com o servidor" | O servidor não está ligado, ou o site foi aberto pelo arquivo. Rode `npm start` e use http://localhost:3000 |
| `npm` não é reconhecido | Instale o Node.js e abra um terminal novo |
| Porta 3000 ocupada | Use outra porta: `PORT=4000 npm start` (Git Bash/Mac/Linux) ou `$env:PORT=4000; npm start` (PowerShell) |
| O erro de data não some | A retirada precisa ser hoje ou depois; a devolução, depois da retirada |
