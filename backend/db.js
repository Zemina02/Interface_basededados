const sql = require("mssql");

const config = {
  user: "orca_app",
  password: "OrcaApp123!",
  server: "localhost", // ou "LAPTOP-DUKTUMVC"
  database: "OrcasAvistadas",
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

let pool;

async function getPool() {
  if (pool) return pool; // retorna pool existente
  try {
    pool = await sql.connect(config);
    console.log("✅ Conectado ao SQL Server");
    return pool;
  } catch (err) {
    console.error("❌ Erro na conexão:", err);
    throw err;
  }
}

module.exports = { sql, getPool }; // <- exporta getPool
