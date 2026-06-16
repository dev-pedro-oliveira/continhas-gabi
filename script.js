/* =========================================================
   CONTINHAS DA GABI — Lógica do app
   ========================================================= */

/* ---------------------------------------------------------
   BLOCO 1: PEGAR ELEMENTOS DA TELA
   --------------------------------------------------------- */
const todasAsTelas     = document.querySelectorAll(".tela");
const opCards          = document.querySelectorAll(".op-card");
const botaoComecar     = document.querySelector(".btn-comecar");
const botoesVoltar     = document.querySelectorAll(".voltar");

const cenaObjetos      = document.getElementById("cena-objetos");
const pergunta         = document.getElementById("pergunta");
const opcoesResposta   = document.getElementById("opcoes-resposta");
const feedback         = document.getElementById("feedback");
const contadorEstrelas = document.getElementById("contador-estrelas");

const barraPreench     = document.getElementById("barra-preenchimento");
const barraRotulo      = document.getElementById("barra-rotulo");

const imgPremio        = document.getElementById("img-premio");
const textoPremio      = document.getElementById("texto-premio");
const btnContinuar     = document.getElementById("btn-continuar-jogando");

const modal            = document.getElementById("modal-parabens");
const btnProxima       = document.getElementById("btn-proxima");
const confeteContainer = document.getElementById("confete");

/* ---------------------------------------------------------
   BLOCO 1.5: RECOMPENSAS
   👉 CONFIRME os nomes dos arquivos na pasta imagens/.
   --------------------------------------------------------- */
const META_ACERTOS = 10;

const recompensas = [
  { texto: "Beijos e abraços!",          img: "imagens/beijos.png" },
  { texto: "Leite com chocolate",        img: "imagens/leite.png" },
  { texto: "10 minutos de desenho",      img: "imagens/desenho.png" },
  { texto: "Diversão com joguinhos",     img: "imagens/joguinhos.png" },
];

/* ---------------------------------------------------------
   BLOCO 2: ESTADO DO JOGO
   --------------------------------------------------------- */
let modoAtual = "somar";
let problemaAtual = null;
let estrelas = 0;
let acertosNaBarra = 0;

const EMOJIS = ["🍎","🍓","⭐","🎈","🐱","🐶","🍪","🌸","🚗","🐟"];

/* ---------------------------------------------------------
   BLOCO 3: SONS (Web Audio API)
   --------------------------------------------------------- */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function tocarNota(freq, inicio, duracao, volume) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const t = ctx.currentTime + inicio;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duracao);
}
function tocarSom(tipo) {
  if (tipo === "selecao") {
    tocarNota(523, 0, 0.15, 0.30);
    tocarNota(784, 0.08, 0.20, 0.30);
  } else if (tipo === "acerto") {
    tocarNota(523,  0,    0.18, 0.30);
    tocarNota(659,  0.12, 0.18, 0.30);
    tocarNota(784,  0.24, 0.18, 0.30);
    tocarNota(1047, 0.36, 0.35, 0.30);
  } else if (tipo === "erro") {
    tocarNota(300, 0,    0.18, 0.25);
    tocarNota(240, 0.14, 0.22, 0.25);
  } else if (tipo === "premio") {
    tocarNota(523,  0,    0.20, 0.30);
    tocarNota(659,  0.15, 0.20, 0.30);
    tocarNota(784,  0.30, 0.20, 0.30);
    tocarNota(1047, 0.45, 0.20, 0.30);
    tocarNota(1319, 0.60, 0.45, 0.30);
  }
}

/* ---------------------------------------------------------
   BLOCO 4: TROCAR DE TELA
   --------------------------------------------------------- */
function mostrarTela(idDaTela) {
  todasAsTelas.forEach(function (t) { t.classList.remove("ativa"); });
  document.getElementById(idDaTela).classList.add("ativa");
}

botaoComecar.addEventListener("click", function () {
  tocarSom("selecao");
  mostrarTela(botaoComecar.dataset.destino);
});

botoesVoltar.forEach(function (b) {
  b.addEventListener("click", function () {
    mostrarTela(b.dataset.destino);
  });
});

/* ---------------------------------------------------------
   BLOCO 5: CLIQUE NOS CARTÕES DE OPERAÇÃO
   --------------------------------------------------------- */
opCards.forEach(function (card) {
  card.addEventListener("click", function () {
    tocarSom("selecao");
    modoAtual = card.dataset.op;
    estrelas = 0;
    acertosNaBarra = 0;
    atualizarPlacar();
    atualizarBarra();
    mostrarTela("tela-jogo");
    novaContinha();
  });
});

/* ---------------------------------------------------------
   BLOCO 6: SORTEIO DE NÚMEROS (ferramentas)
   --------------------------------------------------------- */
function aleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sortearEmoji() {
  return EMOJIS[aleatorio(0, EMOJIS.length - 1)];
}

/* ---------------------------------------------------------
   BLOCO 7: GERAR UM PROBLEMA
   --------------------------------------------------------- */
function gerarProblema(op) {
  if (op === "somar") {
    const a = aleatorio(1, 10);
    const b = aleatorio(1, Math.min(10, 20 - a));
    return { op: op, a: a, b: b, resposta: a + b, simbolo: "+" };
  }
  if (op === "subtrair") {
    const a = aleatorio(2, 20);
    const b = aleatorio(1, a - 1);
    return { op: op, a: a, b: b, resposta: a - b, simbolo: "−" };
  }
  if (op === "multiplicar") {
    const a = aleatorio(2, 4);
    const b = aleatorio(2, 5);
    return { op: op, a: a, b: b, resposta: a * b, simbolo: "×" };
  }
  if (op === "dividir") {
    const b = aleatorio(2, 4);
    const c = aleatorio(1, 5);
    const a = b * c;
    return { op: op, a: a, b: b, resposta: c, simbolo: "÷" };
  }
}
function sortearOperacao() {
  const ops = ["somar", "subtrair", "multiplicar", "dividir"];
  return ops[aleatorio(0, ops.length - 1)];
}

/* ---------------------------------------------------------
   BLOCO 8: DESENHAR A CENA CONCRETA
   --------------------------------------------------------- */
function criarGrupo(quantidade, emoji, removidos) {
  const grupo = document.createElement("div");
  grupo.className = "grupo";
  for (let i = 0; i < quantidade; i++) {
    const obj = document.createElement("span");
    obj.className = "objeto";
    if (removidos && i >= quantidade - removidos) {
      obj.classList.add("removido");
    }
    obj.textContent = emoji;
    grupo.appendChild(obj);
  }
  return grupo;
}
function criarOperador(simbolo) {
  const el = document.createElement("span");
  el.className = "operador";
  el.textContent = simbolo;
  return el;
}
function desenharCena(prob) {
  cenaObjetos.innerHTML = "";
  const emoji = sortearEmoji();

  if (prob.op === "somar") {
    cenaObjetos.appendChild(criarGrupo(prob.a, emoji));
    cenaObjetos.appendChild(criarOperador("+"));
    cenaObjetos.appendChild(criarGrupo(prob.b, emoji));
  } else if (prob.op === "subtrair") {
    cenaObjetos.appendChild(criarGrupo(prob.a, emoji, prob.b));
  } else if (prob.op === "multiplicar") {
    for (let g = 0; g < prob.a; g++) {
      cenaObjetos.appendChild(criarGrupo(prob.b, emoji));
    }
  } else if (prob.op === "dividir") {
    for (let g = 0; g < prob.b; g++) {
      cenaObjetos.appendChild(criarGrupo(prob.resposta, emoji));
    }
  }
}

/* ---------------------------------------------------------
   BLOCO 9: BOTÕES DE RESPOSTA
   --------------------------------------------------------- */
function embaralhar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = aleatorio(0, i);
    const tmp = lista[i];
    lista[i] = lista[j];
    lista[j] = tmp;
  }
  return lista;
}
function gerarOpcoes(correta) {
  const opcoes = [correta];
  while (opcoes.length < 3) {
    const candidato = correta + aleatorio(-3, 3);
    if (candidato >= 0 && !opcoes.includes(candidato)) {
      opcoes.push(candidato);
    }
  }
  return embaralhar(opcoes);
}
function renderOpcoes(prob) {
  opcoesResposta.innerHTML = "";
  const opcoes = gerarOpcoes(prob.resposta);
  opcoes.forEach(function (valor) {
    const btn = document.createElement("button");
    btn.className = "btn-resposta";
    btn.textContent = valor;
    btn.addEventListener("click", function () {
      responder(valor, btn);
    });
    opcoesResposta.appendChild(btn);
  });
}

/* ---------------------------------------------------------
   BLOCO 10: VERIFICAR A RESPOSTA
   --------------------------------------------------------- */
function responder(valor, botao) {
  if (valor === problemaAtual.resposta) {
    estrelas++;
    acertosNaBarra++;
    atualizarPlacar();
    atualizarBarra();
    feedback.textContent = "Acertou! 🎉";
    feedback.style.color = "var(--cor-sucesso)";

    if (acertosNaBarra >= META_ACERTOS) {
      premiar();
    } else {
      tocarSom("acerto");
      soltarConfete();
      modal.classList.add("ativo");
    }
  } else {
    feedback.textContent = "Quase! Tenta de novo 😊";
    feedback.style.color = "var(--cor-primaria)";
    tocarSom("erro");
    botao.disabled = true;
    botao.style.opacity = "0.4";
  }
}

/* ---------------------------------------------------------
   BLOCO 10.5: ATUALIZAR A BARRA DE PROGRESSO
   O preenchimento é uma "cortina" que cobre o degradê de cima.
   Sua altura é a parte AINDA NÃO conquistada. Por isso usamos
   (meta - acertos): com 0 acertos a cortina cobre 100% (barra
   vazia); a cada acerto ela encolhe, descobrindo as cores de
   baixo para cima.
   --------------------------------------------------------- */
function atualizarBarra() {
  const restante = ((META_ACERTOS - acertosNaBarra) / META_ACERTOS) * 100;
  barraPreench.style.height = restante + "%";
  barraRotulo.textContent = acertosNaBarra + "/" + META_ACERTOS;
}

/* ---------------------------------------------------------
   BLOCO 10.6: PREMIAR
   --------------------------------------------------------- */
function premiar() {
  const premio = recompensas[aleatorio(0, recompensas.length - 1)];
  textoPremio.textContent = premio.texto;
  imgPremio.src = premio.img;

  tocarSom("premio");
  soltarConfete();
  mostrarTela("tela-premiacao");
}

btnContinuar.addEventListener("click", function () {
  acertosNaBarra = 0;
  atualizarBarra();
  confeteContainer.innerHTML = "";
  mostrarTela("tela-jogo");
  novaContinha();
});

/* ---------------------------------------------------------
   BLOCO 11: NOVA CONTINHA
   --------------------------------------------------------- */
function novaContinha() {
  feedback.textContent = "";
  let op = modoAtual;
  if (op === "misturado") op = sortearOperacao();
  problemaAtual = gerarProblema(op);
  desenharCena(problemaAtual);
  pergunta.textContent =
    problemaAtual.a + " " + problemaAtual.simbolo + " " + problemaAtual.b + " = ?";
  renderOpcoes(problemaAtual);
}

btnProxima.addEventListener("click", function () {
  modal.classList.remove("ativo");
  confeteContainer.innerHTML = "";
  novaContinha();
});

/* ---------------------------------------------------------
   BLOCO 12: PLACAR
   --------------------------------------------------------- */
function atualizarPlacar() {
  contadorEstrelas.textContent = estrelas;
}

/* ---------------------------------------------------------
   BLOCO 13: CONFETE
   --------------------------------------------------------- */
function soltarConfete() {
  const cores = ["#ff8fab", "#8ecae6", "#95d5b2", "#ff7b00", "#ffd166"];
  const quantidade = 50;
  for (let i = 0; i < quantidade; i++) {
    const pedaco = document.createElement("div");
    pedaco.className = "confete-pedaco";
    pedaco.style.left = (Math.random() * 100) + "%";
    pedaco.style.backgroundColor = cores[aleatorio(0, cores.length - 1)];
    pedaco.style.animationDelay = (Math.random() * 0.4) + "s";
    pedaco.style.animationDuration = (Math.random() * 2 + 2) + "s";
    confeteContainer.appendChild(pedaco);
  }
  setTimeout(function () { confeteContainer.innerHTML = ""; }, 4500);
}