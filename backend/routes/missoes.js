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
  const { missao, tipoMissao, responsavel, condicaoMeteorologica, base } =
    req.body;
  const db = await getPool();
  const transaction = new sql.Transaction(db);

  try {
    console.log("BODY:", JSON.stringify(req.body, null, 2)); // Debugging line

    await transaction.begin();

    const tipo = await new sql.Request(transaction)
      .input("tipo", tipoMissao.tipo)
      .input("desc", tipoMissao.descricao).query(`
        INSERT INTO [Tipo de Missão] (Tipo, Descrição)
        OUTPUT INSERTED.[ID Tipo de Missão]
        VALUES (@tipo, @desc)
      `);

    const responsavelRes = await new sql.Request(transaction).input(
      "nome",
      responsavel.nome
    ).query(`
        INSERT INTO Responsável (Nome)
        OUTPUT INSERTED.ID_Responsavel
        VALUES (@nome)
      `);

    const cond = await new sql.Request(transaction)
      .input("prec", condicaoMeteorologica.precipitacao)
      .input("vento", condicaoMeteorologica.vento)
      .input("temp", condicaoMeteorologica.temperatura)
      .input("vis", condicaoMeteorologica.visibilidade).query(`
        INSERT INTO [Condição Meteorologica]
        (Precipitação, Vento, Temperatura, Visibilidade)
        OUTPUT INSERTED.[ID Cond. Meteorológica]
        VALUES (@prec, @vento, @temp, @vis)
      `);

    const baseRes = await new sql.Request(transaction).input(
      "cp",
      base.codigoPostal
    ).query(`
        INSERT INTO BaseDeOperacoes ([Codigo PostalCodigo Postal])
        OUTPUT INSERTED.IDBase
        VALUES (@cp)
      `);

    const missaoRes = await new sql.Request(transaction)
      .input("data", missao.data)
      .input("hora", missao.hora)
      .input("dur", missao.duracao)
      .input("tipoId", tipo.recordset[0]["ID Tipo de Missão"])
      .input("respId", responsavelRes.recordset[0].ID_Responsavel)
      .input("condId", cond.recordset[0]["ID Cond. Meteorológica"])
      .input("baseId", baseRes.recordset[0].IDBase).query(`
        INSERT INTO Missão
        (Data, Hora, Duração,
         [Tipo de MissãoID Tipo de Missão],
         ResponsávelID_Responsavel,
         [Condição MeteorologicaID Cond. Meteorológica],
         BaseDeOperacoesIDBase)
        OUTPUT INSERTED.[ID Missão]
        VALUES (@data, @hora, @dur, @tipoId, @respId, @condId, @baseId)
      `);

    if (
      !missao ||
      !tipoMissao ||
      !responsavel ||
      !condicaoMeteorologica ||
      !base
    ) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    await transaction.commit();
    res.status(201).json(missaoRes.recordset[0]);
    7;
  } catch (err) {
    console.error("❌ ERRO AO CRIAR MISSÃO:");
    console.error(err);
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; // <- exporta corretamente
