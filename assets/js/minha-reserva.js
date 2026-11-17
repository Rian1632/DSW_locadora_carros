// Minha reserva: consultar (GET), editar (PUT) e cancelar (DELETE).
const formBusca = document.getElementById("form-consulta");
const msg = document.getElementById("msg-consulta");
const painel = document.getElementById("painel");
const detalhes = document.getElementById("detalhes");
const formEdit = document.getElementById("form-edicao");
const msgEdit = document.getElementById("msg-edicao");
let carros = [];
let atual = null; // reserva exibida

function qs() { return `?email=${encodeURIComponent(atual.email)}`; }

function mostrar(r) {
    atual = r;
    const c = carros.find((x) => x.id === String(r.carro_id));
    const cancelada = r.status === "cancelada";
    const dias = diarias(r.retirada, r.devolucao);
    detalhes.innerHTML = `<h2>Reserva nº ${esc(r.id)} <span class="selo ${cancelada ? "cancelada" : "ativa"}">${cancelada ? "Cancelada" : "Ativa"}</span></h2>
<dl class="lista-dados">
<dt>Nome</dt><dd>${esc(r.nome)}</dd>
<dt>E-mail</dt><dd>${esc(r.email)}</dd>
<dt>Veículo</dt><dd>${esc(c ? c.modelo : "Veículo " + r.carro_id)}</dd>
<dt>Retirada</dt><dd>${dataBR(r.retirada)}</dd>
<dt>Devolução</dt><dd>${dataBR(r.devolucao)}</dd>
${c && dias ? `<dt>Estimativa</dt><dd>${dias} diária(s) = ${brl(dias * c.preco)}</dd>` : ""}
</dl>
${cancelada ? '<p class="aviso">Esta reserva foi cancelada e não pode mais ser alterada.</p>'
    : '<button class="botao" id="btn-editar" type="button">Alterar reserva</button><button class="botao perigo" id="btn-cancelar" type="button">Cancelar reserva</button>'}`;
    painel.hidden = false;
    formEdit.hidden = true;
    mostrarMensagem(msgEdit, "", "");
    if (!cancelada) {
        document.getElementById("btn-editar").onclick = abrirEdicao;
        document.getElementById("btn-cancelar").onclick = cancelar;
    }
}

function abrirEdicao() {
    formEdit.hidden = false;
    limparErrosCampos(formEdit);
    formEdit.nome.value = atual.nome;
    formEdit.email.value = atual.email;
    formEdit.carro_id.value = atual.carro_id;
    formEdit.retirada.value = atual.retirada;
    formEdit.devolucao.value = atual.devolucao;
    formEdit.scrollIntoView({ behavior: "smooth" });
}

async function consultar(id, email) {
    mostrarMensagem(msg, "", "");
    try {
        // guarda o e-mail digitado para os próximos pedidos
        const r = await chamarApi(`/reservas/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}`);
        try { sessionStorage.setItem("rp_email", r.email); } catch (e) {}
        mostrar(r);
    } catch (e) {
        painel.hidden = true;
        mostrarMensagem(msg, e.mensagem, "erro");
    }
}

formBusca.addEventListener("submit", (ev) => {
    ev.preventDefault();
    consultar(formBusca.codigo.value.trim(), formBusca.email.value.trim());
});

formEdit.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    limparErrosCampos(formEdit);
    mostrarMensagem(msgEdit, "", "");
    try {
        // O e-mail de acesso é o da reserva atual (?email=); o campo e-mail do formulário é o novo valor.
        const r = await chamarApi(`/reservas/${atual.id}${qs()}`, {
            method: "PUT",
            body: JSON.stringify({
                nome: formEdit.nome.value,
                email: formEdit.email.value,
                carro_id: formEdit.carro_id.value,
                retirada: formEdit.retirada.value,
                devolucao: formEdit.devolucao.value
            })
        });
        try { sessionStorage.setItem("rp_email", r.email); } catch (e) {}
        mostrar(r);
        mostrarMensagem(msg, "Reserva atualizada com sucesso.", "ok");
    } catch (e) {
        mostrarMensagem(msgEdit, e.mensagem, "erro");
        mostrarErrosCampos(formEdit, e.detalhes);
    }
});

document.getElementById("cancelar-edicao").addEventListener("click", () => { formEdit.hidden = true; });

async function cancelar() {
    if (!confirm("Tem certeza que deseja cancelar esta reserva?")) return;
    try {
        const r = await chamarApi(`/reservas/${atual.id}${qs()}`, { method: "DELETE" });
        mostrar(r);
        mostrarMensagem(msg, "Reserva cancelada. O registro fica guardado no histórico.", "ok");
    } catch (e) {
        mostrarMensagem(msg, e.mensagem, "erro");
    }
}

async function iniciar() {
    formEdit.retirada.min = hojeISO();
    formEdit.devolucao.min = hojeISO();
    try {
        carros = await chamarApi("/carros");
        formEdit.carro_id.innerHTML = carros.map((c) => `<option value="${esc(c.id)}">${esc(c.modelo)} — ${brl(c.preco)}/dia</option>`).join("");
    } catch (e) {
        mostrarMensagem(msg, e.mensagem, "erro");
    }
    const id = new URLSearchParams(location.search).get("id");
    let email = "";
    try { email = sessionStorage.getItem("rp_email") || ""; } catch (e) {}
    if (id) formBusca.codigo.value = id;
    if (email) formBusca.email.value = email;
    if (id && email) consultar(id, email);
}
iniciar();
