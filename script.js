


function dataHojeFormatada() {
  const dias = ["Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"];
  const meses = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const hoje = new Date();
  const diaSemana = dias[hoje.getDay()];
  const dia = hoje.getDate().toString().padStart(2, "0");
  const mes = meses[hoje.getMonth()];
  const ano = hoje.getFullYear();

  return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
}


document.getElementById("data-hoje").textContent =
  "Registros Do Dia " + dataHojeFormatada();

let registros = [];

async function buscarRegistros() {
  const res = await fetch("http://localhost:3001/visitas");
  registros = await res.json();
  rederizarRegistros(document.getElementById("busca").value);
}

buscarRegistros();

function atualizarResumo() {
  document.getElementById("total").textContent = registros.length;
  document.getElementById("presentes").textContent = registros.filter((r) =>
    r.status ? r.status.toLowerCase() !== "saiu" : !r.horario_saida
  ).length;
  document.getElementById("saiu").textContent = registros.filter((r) =>
    r.status ? r.status.toLowerCase() === "saiu" : !!r.horario_saida
  ).length;
  document.getElementById("total-registros").textContent = registros.length;
}

function rederizarRegistros(filtro = "") {
  const lista = document.getElementById("lista-registros");
  lista.innerHTML = "";
  let filtrados = registros;

  if (filtro) {
    const f = filtro.toLowerCase();
    filtrados = registros.filter(
      (r) =>
        r.nome.toLowerCase().includes(f) ||
        r.documento.toLowerCase().includes(f) ||
        r.destino.toLowerCase().includes(f)
    );
  }
  const filtroStatus = document.getElementById("filtro-status");

  if (filtroStatus) {
    const valor = filtroStatus.value;
    if (valor === "presente") {
      filtrados = filtrados.filter((r) => !r.horario_saida && r.status !== "Saiu");
    } else if (valor === "saiu") {
      filtrados = filtrados.filter((r) => r.horario_saida || r.status === "Saiu");
    }
  }

  filtrados.forEach((reg, idx) => {
    const card = document.createElement("div");
    card.className = "registro-card";

    card.innerHTML = `
    <div class="nome">${reg.nome}</div>
    <div class="id"># ${reg.documento}</div>
    <div class="info">Empresa: <b>${reg.empresa || "-"}</b></div>
    <div class="info entrada-saida">
        Entrada: <b>${reg.horario_entrada || reg.entrada}</b>
        <span class="saida">Saida: <b>${
          reg.horario_saida || reg.saida || "--:--"
        }</b></span>
      </div>
      <div class="info">Destino:<br> <b>${reg.destino}</b></div>
      <div class="acoes">
        <span class="status">${
          reg.status || (reg.saida ? "Saiu" : "Presente")
        }</span>
        ${
          !reg.saida && (!reg.status || reg.status === "Presente")
            ? `<button class="btn-saida" onclick="marcarSaida(${idx})">Marcar Saida</button>`
            : ""
        }
      </div>
      `;
    lista.appendChild(card);
    atualizarResumo();
  });
}

const form = document.getElementById("form-registro");
const campoDocumento = document.getElementById("documento");

campoDocumento.addEventListener("input", function () {
  let valor = campoDocumento.value.replace(/\D/g, "");

  if (valor.length <= 7) {
    valor = valor.replace(/(\d)(\d{3})(\d{0,3})/, function (_, a, b, c) {
      return c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a;
    });
  } else {
    valor = valor.slice(0, 11);
    valor = valor.replace(
      /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
      function (_, a, b, c, d) {
        return d ? `${a}.${b}.${c}-${d}` : `${a}.${b}.${c}`;
      }
    );
  }
  campoDocumento.value = valor;
});

form.onsubmit = async function (event) {
  event.preventDefault();
  const nome = form.nome.value.trim();
  const documento = form.documento.value.trim();
  const empresa = form.empresa.value.trim();
  const entrada = form.entrada.value;
  const destino = form.destino.value.trim();
  if (!nome || !documento || !empresa || !entrada || !destino) {
    alert("Por favor, preenchar todos os campos obrigatorios!");
    return;
  }

  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  const rgRegex = /^\d\.\d{3}\.\d{3}$/;
  if (!(cpfRegex.test(documento) || rgRegex.test(documento))) {
    alert(
      "Documento invalido! Informe um CPF no formato 000.000.000-00 ou RG no formato 0.000.000"
    );
    return;
  }
  const [h, m] = entrada.split(":").map(Number);
  const agora = new Date();
  const horaAtual = agora.getHours();
  const minAtual = agora.getMinutes();
  if (h > horaAtual || (h === horaAtual && m > minAtual)) {
    alert(
      "Não e permitido cadastrar um horario de entrada maior que o horario atual"
    );
    return;
  }
  let empresa_id = null;
  try {
    const resEmp = await fetch("http://localhost:3001/empresas", {
      method: "GET",
    });
    const empresas = await resEmp.json();
    const emp = empresas.find(
      (e) => e.nome.toLowerCase() === empresa.toLowerCase()
    );
    if (emp) {
      empresa_id = emp.id;
    } else {
      const resNovoEmp = await fetch("http://localhost:3001/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: empresa }),
      });
      const novaEmp = await resNovoEmp.json();
      empresa_id = novaEmp.id;
    }
  } catch (err) {
    alert("Erro ao buscar/cadastrar empresa!");
    return;
  }
  await fetch("http://localhost:3001/visitas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome,
      documento,
      empresa_id,
      horario_entrada: entrada,
      destino,
    }),
  });
  form.reset();
  buscarRegistros();
};

window.marcarSaida = async function (idx) {
  const reg = registros[idx];
  const horaSaida = prompt(
    "Digite o horario de saida (hh:mm):",
    new Date().toTimeString().slice(0, 5)
  );
  if (horaSaida && /^\d{2}:\d{2}$/.test(horaSaida)) {
    const [h, m] = horaSaida.split(":").map(Number);
    const agora = new Date();
    const horaAtual = agora.getHours();
    const minAtual = agora.getMinutes();
    if (h > horaAtual || (h === horaAtual && m > minAtual)) {
      alert(
        "Não e permitido marcar um horario de saida maior que o horario atual!"
      );
      return;
    }
    await fetch(`http://localhost:3001/visitas/${reg.id}/saida`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horario_saida: horaSaida }),
    });
    buscarRegistros();
  } else if (horaSaida) {
    alert("Horario invalido! use o formato hh:mm.");
  }
};

const busca = document.getElementById("busca");
busca.oninput = function () {
  rederizarRegistros(busca.value);
};

const filtroStatus = document.getElementById("filtro-status");
if (filtroStatus) {
  filtroStatus.onchange = function () {
    rederizarRegistros(document.getElementById("busca").value);
  };
}
const perguntas = [
    {
        pergunta: "HTML",
        resposta: "HTML (HyperText Markup Language) e a linguagem de marcacao padrao para criar paginas web. Ela define a estrutura do conteudo, como titulos, paragrafos, imagens, links e formularios. O HTML usa tags para organizar os elementos, por exemplo: <h1> para titulos, <p> para paragrafos e <img> para imagens. E a base de qualquer site e trabalha junto com CSS e JavaScript.",
    },
    {
        pergunta: "CSS",
        resposta: "CSS (Cascading Style Sheets) e a linguagem usada para estilizar paginas HTML. Com ela, voce controla cores, fontes, espacamentos, tamanhos e posicionamento dos elementos. O CSS separa o conteudo (HTML) da apresentacao visual, tornando o codigo mais organizado. Exemplo: para mudar a cor de um texto, usamos 'color: red;'. Tambem permite criar layouts responsivos que se adaptam a diferentes telas.",
    },
    {
        pergunta: "JavaScript",
        resposta: "JavaScript e a linguagem de programacao que torna as paginas web interativas. Enquanto HTML estrutura e CSS estiliza, o JavaScript adiciona comportamento dinamico: validacao de formularios, animacoes, requisicoes ao servidor e muito mais. Ele roda diretamente no navegador e pode manipular elementos da pagina em tempo real. E essencial para criar aplicacoes web modernas e interativas.",
    },
];
const listaPerguntas = document.querySelector("dl");

function mostrarPerguntasFrequentes() {
    perguntas.forEach(({ pergunta, resposta}) => {
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");

        dt.textContent = pergunta;
        dd.textContent = resposta;

        listaPerguntas.appendChild(dt);
        listaPerguntas.appendChild(dd);
    });
}
mostrarPerguntasFrequentes();

const dt = document.querySelectorAll("dt");
function accrddion(item) {
    item.nextElementSibling.classList.toggle("ativo");
}

dt.forEach((item) => {
    item.addEventListener("click", () => {
        accrddion(item)
    });
});

