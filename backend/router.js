const express = require("express");
const storage = require("./storage");

const router = express.Router();

const MAX_DIAS = 90;
const CAMPOS = ["nome", "email", "carro_id", "retirada", "devolucao"];

function erro(res, status, mensagem, detalhes) {
    const corpo = { erro: mensagem };
    if (detalhes) corpo.detalhes = detalhes;
    return res.status(status).json(corpo);
}

// Data de hoje no formato AAAA-MM-DD (horário local do servidor)
function hoje() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
}

// Converte "AAAA-MM-DD" em Date (UTC). Retorna null se for inválida (ex.: 2026-02-31)
function lerData(texto) {
    if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
    const d = new Date(texto + "T00:00:00Z");
    if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== texto) return null;
    return d;
}

// O CSV é simples (sem aspas): vírgulas e quebras de linha corromperiam o arquivo,
// e iniciar com = + - @ permitiria "injeção de fórmula" ao abrir no Excel.
function textoSeguro(valor) {
    return !/[,\r\n]/.test(valor) && !/^[=+\-@]/.test(valor);
}

// Valida os dados completos de uma reserva. Retorna { dados, erros }.
function validarReserva(entrada) {
    const erros = {};
    const dados = {};

    // nome
    const nome = typeof entrada.nome === "string" ? entrada.nome.trim() : "";
    if (nome.length < 3 || nome.length > 100) {
        erros.nome = "Informe o nome completo (3 a 100 caracteres).";
    } else if (!textoSeguro(nome)) {
        erros.nome = "O nome contém caracteres não permitidos (vírgula, quebra de linha ou início com = + - @).";
    }
    dados.nome = nome;

    // email
    const email = typeof entrada.email === "string" ? entrada.email.trim().toLowerCase() : "";
    if (email.length > 100 || !/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email)) {
        erros.email = "Informe um e-mail válido.";
    }
    dados.email = email;

    // carro_id (precisa existir no catálogo)
    const idCarro = Number(entrada.carro_id);
    if (!Number.isInteger(idCarro) || idCarro <= 0 || !storage.buscarCarro(idCarro)) {
        erros.carro_id = "Veículo não encontrado no catálogo.";
    }
    dados.carro_id = idCarro;

    // datas
    const retirada = lerData(entrada.retirada);
    const devolucao = lerData(entrada.devolucao);

    if (!retirada) {
        erros.retirada = "Data de retirada inválida (use AAAA-MM-DD).";
    } else if (entrada.retirada < hoje()) {
        erros.retirada = "A data de retirada não pode ser no passado.";
    }

    if (!devolucao) {
        erros.devolucao = "Data de devolução inválida (use AAAA-MM-DD).";
    } else if (retirada && devolucao <= retirada) {
        erros.devolucao = "A devolução deve ser depois da retirada.";
    } else if (retirada && (devolucao - retirada) / 86400000 > MAX_DIAS) {
        erros.devolucao = `O período máximo de locação é de ${MAX_DIAS} dias.`;
    }

    dados.retirada = entrada.retirada;
    dados.devolucao = entrada.devolucao;

    return { dados, erros };
}

// Valida o :id da URL e devolve o número (ou null)
function lerId(valor) {
    return /^\d{1,9}$/.test(valor) ? Number(valor) : null;
}

// Middleware: valida :id, busca a reserva e confere o e-mail (?email=...).
// O código da reserva é sequencial (fácil de adivinhar); o e-mail funciona como
// segundo fator para ninguém ver/alterar reservas de terceiros.
// Se o e-mail não bate, responde 404 igual a "não existe" para não vazar informação.
function carregarReserva(req, res, next) {
    const id = lerId(req.params.id);
    if (id === null) return erro(res, 400, "Código de reserva inválido.");

    const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
    if (!email) return erro(res, 400, "Informe o e-mail da reserva (?email=...).");

    const reserva = storage.buscarReserva(id);
    if (!reserva || reserva.email !== email) return erro(res, 404, "Reserva não encontrada.");

    req.reserva = reserva;
    next();
}

// ---------- Catálogo (somente leitura) ----------

// GET /api/carros?busca=polo&categoria=Conforto
router.get("/carros", (req, res) => {
    const busca = typeof req.query.busca === "string" ? req.query.busca.trim().toLowerCase() : "";
    const categoria = typeof req.query.categoria === "string" ? req.query.categoria.trim().toLowerCase() : "";

    const carros = storage.listarCarros().filter((c) =>
        (!busca || c.modelo.toLowerCase().includes(busca)) &&
        (!categoria || c.categoria.toLowerCase() === categoria)
    );

    res.json(carros);
});

// GET /api/carros/:id
router.get("/carros/:id", (req, res) => {
    const id = lerId(req.params.id);
    if (id === null) return erro(res, 400, "Código de veículo inválido.");

    const carro = storage.buscarCarro(id);
    if (!carro) return erro(res, 404, "Veículo não encontrado.");

    res.json(carro);
});

// ---------- Reservas (CRUD) ----------

// POST /api/reservas — cria a reserva e devolve o código (id)
router.post("/reservas", (req, res) => {
    const { dados, erros } = validarReserva(req.body || {});
    if (Object.keys(erros).length) return erro(res, 400, "Dados inválidos.", erros);

    const nova = storage.salvarReserva(dados);
    res.status(201).location(`/api/reservas/${nova.id}`).json(nova);
});

// GET /api/reservas/:id?email=... — consulta
router.get("/reservas/:id", carregarReserva, (req, res) => {
    res.json(req.reserva);
});

// Edição: PUT exige todos os campos; PATCH aceita apenas os que mudam.
function editar(parcial) {
    return (req, res) => {
        if (req.reserva.status === "cancelada") {
            return erro(res, 409, "Reservas canceladas não podem ser alteradas.");
        }

        const corpo = req.body || {};
        const entrada = {};
        for (const campo of CAMPOS) {
            // só campos permitidos (id e status nunca vêm do cliente)
            entrada[campo] = campo in corpo || !parcial ? corpo[campo] : req.reserva[campo];
        }

        const { dados, erros } = validarReserva(entrada);
        if (Object.keys(erros).length) return erro(res, 400, "Dados inválidos.", erros);

        const atualizada = storage.editarReserva(req.reserva.id, dados);
        if (!atualizada) return erro(res, 404, "Reserva não encontrada.");

        res.json(atualizada);
    };
}

router.put("/reservas/:id", carregarReserva, editar(false));
router.patch("/reservas/:id", carregarReserva, editar(true));

// DELETE /api/reservas/:id?email=... — cancela (mantém o registro com status "cancelada")
router.delete("/reservas/:id", carregarReserva, (req, res) => {
    const cancelada = storage.cancelarReserva(req.reserva.id);
    if (!cancelada) return erro(res, 404, "Reserva não encontrada.");

    res.json(cancelada);
});

module.exports = router;
