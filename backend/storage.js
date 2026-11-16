// Persistência e catálogo da Rota Prime.
// O servidor (server.js) ficará com o integrante responsável pela API.
const fs = require("fs");
const path = require("path");

const arquivoCarros = path.join(__dirname, "carros.csv");
const arquivoReservas = path.join(__dirname, "reservas.csv");

function listarCarros() {
  const texto = fs.readFileSync(arquivoCarros, "utf8").trim();
  const linhas = texto.split("\n");
  const carros = [];

  for (let i = 1; i < linhas.length; i++) {
    const dados = linhas[i].trim().split(",");
    if (dados.length < 5) continue;

    carros.push({
      id: Number(dados[0]),
      modelo: dados[1],
      categoria: dados[2],
      preco: Number(dados[3]),
      imagem: dados[4]
    });
  }
  return carros;
}

function buscarCarro(id) {
  return listarCarros().find(carro => carro.id === Number(id)) || null;
}

// As funções de cadastro, edição e cancelamento das reservas serão
// adicionadas nesta mesma camada de persistência.
module.exports = { listarCarros, buscarCarro };
