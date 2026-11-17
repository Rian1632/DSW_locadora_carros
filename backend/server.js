const express = require("express");
const path = require("path");
const router = require("./router");

const app = express();
const PORT = process.env.PORT || 3000;
const RAIZ = path.join(__dirname, "..");

app.disable("x-powered-by");

// Cabeçalhos básicos de segurança
app.use((req, res, next) => {
    res.set({
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer"
    });
    next();
});

// Corpo JSON com tamanho limitado
app.use(express.json({ limit: "10kb" }));

// API
app.use("/api", router);
app.use("/api", (req, res) => {
    res.status(404).json({ erro: "Rota não encontrada." });
});

// Site (frontend). Só estas pastas são públicas: o backend (CSV, código)
// e a pasta .git nunca são servidos.
app.use("/assets", express.static(path.join(RAIZ, "assets")));
app.use("/pages", express.static(path.join(RAIZ, "pages")));
app.use("/imagens", express.static(path.join(__dirname, "imagens")));
app.get(["/", "/index.html"], (req, res) => res.sendFile(path.join(RAIZ, "index.html")));

// Erros (JSON malformado, corpo grande demais, falhas inesperadas)
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ erro: "JSON inválido." });
    }
    if (err.type === "entity.too.large") {
        return res.status(413).json({ erro: "Corpo da requisição muito grande." });
    }
    console.error(err);
    res.status(500).json({ erro: "Erro interno do servidor." });
});

app.listen(PORT, () => {
    console.log(`Rota Prime rodando em http://localhost:${PORT}`);
});
