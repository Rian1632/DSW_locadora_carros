// Funções compartilhadas: comunicação com a API e utilitários.
const API = "/api";

// Chama a API e devolve o JSON. Em caso de erro, lança um Error com
// .mensagem (texto do servidor) e .detalhes (erros por campo, se houver).
async function chamarApi(caminho, opcoes = {}) {
    let resposta;
    try {
        resposta = await fetch(API + caminho, {
            headers: { "Content-Type": "application/json" },
            ...opcoes
        });
    } catch (e) {
        const err = new Error("Não foi possível falar com o servidor. Verifique se ele está rodando.");
        err.mensagem = err.message;
        throw err;
    }
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
        const err = new Error(corpo.erro || "Erro inesperado.");
        err.mensagem = err.message;
        err.detalhes = corpo.detalhes || null;
        throw err;
    }
    return corpo;
}

// Escapa texto antes de colocar em innerHTML (os dados vêm do CSV)
function esc(texto) {
    return String(texto).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// "2026-12-01" -> "01/12/2026"
function dataBR(iso) {
    const [a, m, d] = String(iso).split("-");
    return `${d}/${m}/${a}`;
}

// 119 -> "R$ 119,00"
function brl(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Hoje (horário local) em AAAA-MM-DD
function hojeISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Nº de diárias entre duas datas ISO (0 se inválido)
function diarias(retirada, devolucao) {
    if (!retirada || !devolucao) return 0;
    const dias = (Date.parse(devolucao + "T00:00:00Z") - Date.parse(retirada + "T00:00:00Z")) / 86400000;
    return dias > 0 ? dias : 0;
}

// Mostra mensagem de erro/sucesso em um elemento .mensagem
function mostrarMensagem(el, texto, tipo) {
    el.textContent = texto;
    el.className = "mensagem " + tipo;
    el.hidden = !texto;
}

// Mostra erros de validação do servidor embaixo de cada campo
function mostrarErrosCampos(form, detalhes) {
    limparErrosCampos(form);
    for (const [campo, texto] of Object.entries(detalhes || {})) {
        const el = form.querySelector(`[data-erro="${campo}"]`);
        if (el) el.textContent = texto;
    }
}
function limparErrosCampos(form) {
    form.querySelectorAll("[data-erro]").forEach((el) => (el.textContent = ""));
}
