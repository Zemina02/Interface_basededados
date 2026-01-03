const express = require("express");
const router = express.Router();
// IMPORT CORRETO
const { sql, getPool } = require("../db");

/* GET / - Todos os Avistamentos */
router.get("/", async (req, res) => {
  try {
    const db = await getPool(); // <- CORRIGIDO
    const result = await db.request().query(`
      SELECT 
        [ID Avistamento] AS id,
        Data AS data,
        Hora AS hora,
        Localização AS localizacao,
        Descrição AS descricao,
        [Número de Orcas] AS numeroOrcas,
        [MissãoID Missão] AS missaoId
      FROM [Avistamento De Orcas]
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST / - Criar Avistamento com Testemunhas e Espécies */
router.post("/", async (req, res) => {
  const { avistamento, testemunhas, especies } = req.body;
  const db = await getPool();
  const transaction = new sql.Transaction(db);

  try {
    await transaction.begin();

    const av = await new sql.Request(transaction)
      .input("data", avistamento.data)
      .input("hora", avistamento.hora)
      .input("localizacao", avistamento.localizacao)
      .input("descricao", avistamento.descricao)
      .input("num", avistamento.numeroOrcas)
      .input("missao", avistamento.missaoId)
      .query(`
        INSERT INTO [Avistamento De Orcas]
        (Data, Hora, Localização, Descrição, [Número de Orcas], [MissãoID Missão])
        OUTPUT INSERTED.[ID Avistamento]
        VALUES (@data, @hora, @localizacao, @descricao, @num, @missao)
      `);

    const avistamentoId = av.recordset[0]["ID Avistamento"];

    for (const t of testemunhas) {
      const test = await new sql.Request(transaction)
        .input("nome", t.nome)
        .input("dataNasc", t.dataNascimento)
        .input("cp", t.codigoPostal)
        .query(`
          INSERT INTO Testemunhas
          (Nome, [Data de Nascimento], [Codigo PostalCodigo Postal])
          OUTPUT INSERTED.[ID Envolvidos]
          VALUES (@nome, @dataNasc, @cp)
        `);

      const testemunhaId = test.recordset[0]["ID Envolvidos"];

      await new sql.Request(transaction)
        .input("avId", avistamentoId)
        .input("tId", testemunhaId)
        .query(`
          INSERT INTO [Conjunto de Testemunhas]
          VALUES (@avId, @tId)
        `);
    }

    for (const e of especies) {
      await new sql.Request(transaction)
        .input("avId", avistamentoId)
        .input("espId", e)
        .query(`
          INSERT INTO [Espécies Observada]
          VALUES (@avId, @espId)
        `);
    }

    await transaction.commit();
    res.status(201).json({ message: "Avistamento criado com sucesso" });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
});

/* GET /relatorio - Query Elaborada */
router.get("/relatorio", async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT 
        A.[ID Avistamento] AS id,
        A.Data AS data,
        A.Localização AS localizacao,
        R.Nome AS responsavel,
        COUNT(E.[EspécieID Orca]) AS totalEspecies
      FROM [Avistamento De Orcas] A
      JOIN Missão M ON A.[MissãoID Missão] = M.[ID Missão]
      JOIN Responsável R ON M.ResponsávelID_Responsavel = R.ID_Responsavel
      LEFT JOIN [Espécies Observada] E 
        ON A.[ID Avistamento] = E.[Avistamento De OrcasID Avistamento]
      GROUP BY 
        A.[ID Avistamento], A.Data, A.Localização, R.Nome
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /relatorio-missao/:id - Stored Procedure */
router.get("/relatorio-missao/:id", async (req, res) => {
  try {
    const db = await getPool();
    const result = await db
      .request()
      .input("MissaoID", req.params.id)
      .execute("sp_RelatorioMissao");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// routes/avistamentos.js
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const db = await getPool();
  const transaction = new sql.Transaction(db);

  try {
    await transaction.begin();

    // Apaga relações primeiro (Espécies e Testemunhas)
    await new sql.Request(transaction)
      .input("avId", id)
      .query(`DELETE FROM [Espécies Observada] WHERE [Avistamento De OrcasID Avistamento] = @avId`);

    await new sql.Request(transaction)
      .input("avId", id)
      .query(`DELETE FROM [Conjunto de Testemunhas] WHERE [Avistamento De OrcasID Avistamento] = @avId`);

    // Depois apaga o avistamento
    await new sql.Request(transaction)
      .input("id", id)
      .query(`DELETE FROM [Avistamento De Orcas] WHERE [ID Avistamento] = @id`);

    await transaction.commit();
    res.status(200).json({ message: "Avistamento removido com sucesso" });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
