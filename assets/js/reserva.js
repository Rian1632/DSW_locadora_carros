// Página de reserva: escolher veículo, preencher dados e criar a reserva (POST).
const form = document.getElementById("form-reserva");
const selCarro = document.getElementById("carro_id");
const msg = document.getElementById("msg-form");
const resumo = document.getElementById("resumo");
const caixaOk = document.getElementById("confirmacao");
let carros = [];

async function iniciar() {
    const hoje = hojeISO();
    form.retirada.min = hoje;
    form.devolucao.min = hoje;
    try {
        carros = await chamarApi("/carros");
    } catch (e) {
        mostrarMensagem(msg, e.mensagem, "erro");
        return;
    }
    selCarro.innerHTML = '<option value="">Selecione um veículo</option>' +
        carros.map((c) => `<option value="${esc(c.id)}">${esc(c.modelo)} — ${esc(c.categoria)} (${brl(c.preco)}/dia)</option>`).join("");
    const pre = new URLSearchParams(location.search).get("carro");
    if (pre && carros.some((c) => c.id === pre)) selCarro.value = pre;
    atualizarResumo();
}

// Estimativa de valor (apenas informativa; o backend não guarda preço)
function atualizarResumo() {
    const c = carros.find((x) => x.id === selCarro.value);
    const dias = diarias(form.retirada.value, form.devolucao.value);
    if (c && dias) {
        resumo.textContent = `${c.modelo}: ${dias} diária(s) × ${brl(c.preco)} = ${brl(dias * c.preco)} (estimativa)`;
    } else {
        resumo.textContent = "Escolha o veículo e as datas para ver a estimativa.";
    }
    // devolução precisa ser depois da retirada
    if (form.retirada.value) {
        const d = new Date(form.retirada.value + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() + 1);
        form.devolucao.min = d.toISOString().slice(0, 10);
    }
}
[selCarro, form.retirada, form.devolucao].forEach((el) => el.addEventListener("change", atualizarResumo));

form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    limparErrosCampos(form);
    mostrarMensagem(msg, "", "");
    const botao = form.querySelector("button[type=submit]");
    botao.disabled = true;
    try {
        const r = await chamarApi("/reservas", {
            method: "POST",
            body: JSON.stringify({
                nome: form.nome.value,
                email: form.email.value,
                carro_id: selCarro.value,
                retirada: form.retirada.value,
                devolucao: form.devolucao.value
            })
        });
        const c = carros.find((x) => x.id === String(r.carro_id));
        try { sessionStorage.setItem("rp_email", r.email); } catch (e) {}
        form.hidden = true;
        caixaOk.hidden = false;
        caixaOk.innerHTML = `<h2>Reserva confirmada!</h2>
<p>Guarde o seu código de reserva:</p>
<p class="codigo">${esc(r.id)}</p>
<p>${esc(c ? c.modelo : "Veículo")} • retirada em ${dataBR(r.retirada)} • devolução em ${dataBR(r.devolucao)}</p>
<p class="aviso">Com o código e o e-mail <strong>${esc(r.email)}</strong> você consulta, altera ou cancela a reserva.</p>
<a class="botao" href="minha-reserva.html?id=${encodeURIComponent(r.id)}">Ver minha reserva</a>
<a class="botao" href="reserva.html">Fazer outra reserva</a>`;
        caixaOk.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
        mostrarMensagem(msg, e.mensagem, "erro");
        mostrarErrosCampos(form, e.detalhes);
    } finally {
        botao.disabled = false;
    }
});

iniciar();
