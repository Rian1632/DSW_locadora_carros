// Catálogo: busca por modelo e filtro por categoria, direto da API.
const grade = document.getElementById("grade-carros");
const campoBusca = document.getElementById("busca");
const filtros = document.getElementById("filtros");
const status = document.getElementById("status-catalogo");
let categoria = "";
let timer;

function cartao(c) {
    return `<article class="cartao">
  <img src="${esc(c.imagem)}" alt="${esc(c.modelo)}">
  <h3>${esc(c.modelo)}</h3><p>${esc(c.categoria)}</p>
  <p class="preco">${brl(c.preco)} / diária</p>
  <a class="botao" href="reserva.html?carro=${encodeURIComponent(c.id)}">Reservar</a>
</article>`;
}

async function carregar() {
    const params = new URLSearchParams();
    if (campoBusca.value.trim()) params.set("busca", campoBusca.value.trim());
    if (categoria) params.set("categoria", categoria);
    try {
        const carros = await chamarApi("/carros?" + params);
        grade.innerHTML = carros.map(cartao).join("");
        status.textContent = carros.length
            ? `${carros.length} veículo(s) encontrado(s).`
            : "Nenhum veículo encontrado para essa busca.";
        status.className = "aviso";
    } catch (e) {
        grade.innerHTML = "";
        status.textContent = e.mensagem;
        status.className = "mensagem erro";
    }
}

// Monta os botões de categoria a partir do próprio catálogo
async function montarFiltros() {
    try {
        const todos = await chamarApi("/carros");
        const nomes = [...new Set(todos.map((c) => c.categoria))];
        filtros.innerHTML = ["Todos", ...nomes]
            .map((n) => `<button type="button" class="chip${n === "Todos" ? " ativo" : ""}" data-cat="${n === "Todos" ? "" : esc(n)}">${esc(n)}</button>`)
            .join("");
    } catch (e) { /* o erro aparece em carregar() */ }
}

filtros.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-cat]");
    if (!b) return;
    categoria = b.dataset.cat;
    filtros.querySelectorAll(".chip").forEach((x) => x.classList.toggle("ativo", x === b));
    carregar();
});
campoBusca.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(carregar, 250);
});
document.getElementById("form-busca").addEventListener("submit", (ev) => { ev.preventDefault(); carregar(); });

montarFiltros();
carregar();
