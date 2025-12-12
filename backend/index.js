const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "sistema_visitas",
});

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco:", err);
  } else {
    console.log("Conectado ao banco de dados!");
  }
});

app.get("/empresas", (req, res) => {
  db.query("SELECT * FROM empresa ORDER BY nome", (err, results) => {
    if (err) {
      console.error("Erro ao buscar empresas:", err);
      return res.status(500).json({ message: "Erro ao buscar empresas." });
    }
    res.json(results);
  });
});

app.post("/empresas", (req, res) => {
  const { nome } = req.body;
  if (!nome) {
    return res.status(400).json({ message: 'O compo "nome" e obrigatorio.' });
  }
  db.query("INSERT INTO empresa (nome) VALUES (?)", [nome], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao cadastra empresas." });
    }
    res.status(201).json({ id: result.insertId, nome });
  });
});

app.get("/visitas", (req, res) => {
  const sql = `
  SELECT v.id, v.nome, v.documento, e.nome AS empresa, v.horario_entrada, v.horario_saida, v.destino, v.data_visita, v.status
  FROM visita AS v
  LEFT JOIN empresa AS e ON v.empresa_id = e.id
  WHERE v.data_visita = CURDATE()
  ORDER BY v.horario_entrada DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar visitas:", err);
      return res.status(500).json({ message: "Erro ao buscar visitas." });
    }
    res.json(results);
  });
});

app.post("/visitas", (req, res) => {
  const { nome, documento, empresa_id, horario_entrada, destino } = req.body;
  if (!nome || !documento || !empresa_id || !horario_entrada || !destino) {
    return res.status(400).json({
      mensage: "Preencha todos os campos obrigatorio.",
    });
  }
  const data_visita = new Date().toISOString().slice(0, 10);
  db.query(
    "INSERT INTO visita (nome, documento, empresa_id, horario_entrada, destino, data_visita, status) VALUES (?, ?, ?, ?, ?, ?, 'Presente')",
    [nome, documento, empresa_id, horario_entrada, destino, data_visita],
    (err, result) => {
      if (err) {
        console.error("Erro ao cadastrar visita:", err);
        return res.status(500).json({ message: "Erro ao cadastrar visita." });
      }
      res.status(201).json({
        id: result.insertId,
        nome,
      });
    }
  );
});

app.put("/visitas/:id/saida", (req, res) => {
  const { id } = req.params;
  const { horario_saida } = req.body;
  if (!horario_saida) {
    return res.status(400).json({ message: "Informe o horario de saida."});
  }
  db.query(
    "UPDATE visita SET horario_saida = ?, status = 'Saiu' WHERE id = ?",
    [horario_saida, id],
    (err, result) => {
      if (err) {
        console.error("Erro ao marcar saida:", err);
        return res.status(500).json({ message: "Erro ao marcar saida." });
      }
      res.json({ message: "Saida marcada com sucesso!" });
    }
  );
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
