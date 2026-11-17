# Rota Prime — Reservas online (Etapa 2)

Site de locadora de carros com reservas online: **HTML/CSS + JavaScript** no frontend, **Node.js/Express** no backend e **CSV** para guardar os dados.

## Como rodar

```
npm install
npm start
```

Abra **http://localhost:3000** (o site precisa ser aberto por esse endereço, não pelo arquivo `index.html` direto, para conseguir falar com a API).

## Páginas

| Página | O que faz |
|---|---|
| `index.html` | Início, com veículos em destaque que levam direto à reserva |
| `pages/catalogo.html` | Catálogo vindo da API, com pesquisa por modelo e filtro por categoria |
| `pages/reserva.html` | Formulário de reserva (POST). Mostra estimativa de valor e, ao confirmar, o **código da reserva** |
| `pages/minha-reserva.html` | Consulta por código + e-mail (GET), alteração (PUT) e cancelamento (DELETE) |
| `pages/servicos.html`, `pages/sobre.html` | Informativas |

## Pastas

- `assets/css/style.css`: estilos de todas as páginas
- `assets/js/api.js`: funções compartilhadas (chamadas à API, formatação, erros)
- `assets/js/catalogo.js`, `reserva.js`, `minha-reserva.js`: lógica de cada página
- `backend/`: servidor, rotas, leitura/gravação dos CSV (`carros.csv`, `reservas.csv`)

## Observações

- A validação é feita no servidor; os erros por campo aparecem embaixo de cada campo do formulário.
- Cancelar não apaga: a reserva fica no CSV com status `cancelada` e não pode mais ser alterada.
- Para testar a API pelo terminal, veja `README_TESTES.md`.
