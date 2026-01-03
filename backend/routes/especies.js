const express = require("express");
const router = express.Router();
// IMPORT CORRETO
const { sql, getPool } = require("../db");

/* GET / - Todas as espécies */
router.get("/", async (req, res) => {
  try {
    const db = await getPool(); // <- CORRIGIDO
    const result = await db.request().query(`
      SELECT 
        [ID Orca] AS id,
        [Nome Comum] AS nomeComum,
        [Nome Ciêntifico] AS nomeCientifico,
        [Descrição do Comportamento] AS descricaoComportamento,
        [Nivel de Ameaça] AS nivelAmeaca
      FROM Espécie
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
