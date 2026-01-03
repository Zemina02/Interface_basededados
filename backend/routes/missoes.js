const express = require("express");
const router = express.Router(); // <- não esquecer!
const { sql, getPool } = require("../db");

/* GET / - Todas as missões */
router.get("/", async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT 
        [ID Missão] AS id,
        Data AS data,
        Hora AS hora,
        Duração AS duracao,
        [Tipo de MissãoID Tipo de Missão] AS tipoMissaoId,
        ResponsávelID_Responsavel AS responsavelId,
        [Condição MeteorologicaID Cond. Meteorológica] AS condicaoMeteorologicaId,
        BaseDeOperacoesIDBase AS baseId
      FROM Missão
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* POST / - Criar Missão */
router.post("/", async (req, res) => {
  const { data, hora, duracao, tipoMissaoId, responsavelId, condicaoMeteorologicaId, baseId } = req.body;
  try {
    const db = await getPool();
    const result = await db.request()
      .input("data", data)
      .input("hora", hora)
      .input("duracao", duracao)
      .input("tipo", tipoMissaoId)
      .input("resp", responsavelId)
      .input("cond", condicaoMeteorologicaId)
      .input("base", baseId)
      .query(`
        INSERT INTO Missão
        (Data, Hora, Duração, [Tipo de MissãoID Tipo de Missão], ResponsávelID_Responsavel, [Condição MeteorologicaID Cond. Meteorológica], BaseDeOperacoesIDBase)
        OUTPUT INSERTED.[ID Missão]
        VALUES (@data, @hora, @duracao, @tipo, @resp, @cond, @base)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; // <- exporta corretamente
