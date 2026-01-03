const express = require("express");
const cors = require("cors");

const avistamentosRoutes = require("./routes/avistamentos");
const missoesRoutes = require("./routes/missoes");
const especiesRoutes = require("./routes/especies");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use("/api/avistamentos", avistamentosRoutes);
app.use("/api/missoes", missoesRoutes);
app.use("/api/especies", especiesRoutes);

// Rota raiz para teste
app.get("/", (req, res) => {
  res.send("✅ API Orcas a correr! Use /api/avistamentos, /api/missoes ou /api/especies");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
