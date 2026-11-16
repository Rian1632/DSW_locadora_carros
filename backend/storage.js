
const fs = require("fs");
const path = require("path");

const carrosCSV = path.join(__dirname, "carros.csv");
const reservasCSV = path.join(__dirname, "reservas.csv");

// LER UM ARQUIVO CSV
function lerCSV(arquivo) {
    const texto = fs.readFileSync(arquivo, "utf8").trim();
    const linhas = texto.split("\n");
    const colunas = linhas[0].trim().split(",");
    const lista = [];

    for (let i = 1; i < linhas.length; i++) {
        const valores = linhas[i].trim().split(",");
        const item = {};

        for (let j = 0; j < colunas.length; j++) {
            item[colunas[j]] = valores[j];
        }

        lista.push(item);
    }

    return lista;
}

// LISTAR CARROS
function listarCarros() {
    return lerCSV(carrosCSV);
}

// BUSCAR CARRO
function buscarCarro(id) {
    const carros = listarCarros();

    for (const carro of carros) {
        if (Number(carro.id) === Number(id)) {
            return carro;
        }
    }

    return null;
}

// LISTAR RESERVAS
function listarReservas() {
    return lerCSV(reservasCSV);
}

// BUSCAR RESERVA
function buscarReserva(id) {
    const reservas = listarReservas();

    for (const reserva of reservas) {
        if (Number(reserva.id) === Number(id)) {
            return reserva;
        }
    }

    return null;
}

// GRAVAR RESERVAS
function gravarReservas(reservas) {
    let texto = "id,nome,email,carro_id,retirada,devolucao,status\n";

    for (const r of reservas) {
        texto += [
            r.id, r.nome, r.email, r.carro_id,
            r.retirada, r.devolucao, r.status
        ].join(",") + "\n";
    }

    fs.writeFileSync(reservasCSV, texto, "utf8");
}

// CADASTRAR RESERVA
function salvarReserva(dados) {
    const reservas = listarReservas();
    let id = 1;

    for (const reserva of reservas) {
        if (Number(reserva.id) >= id) {
            id = Number(reserva.id) + 1;
        }
    }

    const nova = {
        id: id,
        nome: dados.nome,
        email: dados.email,
        carro_id: dados.carro_id,
        retirada: dados.retirada,
        devolucao: dados.devolucao,
        status: "ativa"
    };

    reservas.push(nova);
    gravarReservas(reservas);
    return nova;
}

// EDITAR RESERVA
function editarReserva(id, dados) {
    const reservas = listarReservas();

    for (const reserva of reservas) {
        if (Number(reserva.id) === Number(id)) {
            if (reserva.status === "cancelada") return null;

            reserva.nome = dados.nome;
            reserva.email = dados.email;
            reserva.carro_id = dados.carro_id;
            reserva.retirada = dados.retirada;
            reserva.devolucao = dados.devolucao;

            gravarReservas(reservas);
            return reserva;
        }
    }

    return null;
}

function cancelarReserva(id) {
    const reservas = listarReservas();

    for (const reserva of reservas) {
        if (Number(reserva.id) === Number(id)) {
            reserva.status = "cancelada";
            gravarReservas(reservas);
            return reserva;
        }
    }

    return null;
}


module.exports = {
    listarCarros,
    buscarCarro,
    listarReservas,
    buscarReserva,
    salvarReserva,
    editarReserva,
    cancelarReserva
};
