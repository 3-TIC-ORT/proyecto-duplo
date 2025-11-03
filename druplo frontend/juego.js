const palos = ["espada","basto","oro","copa"];
const numeros = [1,2,3,4,5,6,7,10,11,12];
const fuerza = {
  "1espada":14,"1basto":13,"7espada":12,"7oro":11,
  "3":10,"2":9,"1":8,"12":7,"11":6,"10":5,"7":4,"6":3,"5":2,"4":1
};

let mazo = [];
let manoJugador = [];
let manoBot = [];
let puntosJugador = 0;
let puntosBot = 0;

let offsetPlayer = 0;
let offsetBot = 0;

let empiezaJugador = true;
let turnoJugador = true;
let trucoNivel = -1;

let envidoCantado = false;
let esperandoRespuestaEnvido = false;
let tipoEnvidoActual = "envido";

let rondaTerminada = false;
let bazasJugador = 0;
let bazasBot = 0;
let playedPlayer = null;
let playedBot = null;


function valorEnvido(carta){
  return carta && carta.numero >=1 && carta.numero <=7 ? carta.numero : 0;
}


function calcularEnvido(mano) {
  let maxEnvido = 0;
  for (let i = 0; i < mano.length; i++) {
    for (let j = i + 1; j < mano.length; j++) {
      const c1 = mano[i];
      const c2 = mano[j];
      const v1 = (c1.numero >= 10) ? 0 : c1.numero;
      const v2 = (c2.numero >= 10) ? 0 : c2.numero;
      if (c1.palo === c2.palo) {
        maxEnvido = Math.max(maxEnvido, v1 + v2 + 20);
      } else {
        maxEnvido = Math.max(maxEnvido, v1, v2);
      }
    }
  }
  return maxEnvido;
}


function crearMazo(){
  mazo = [];
  for(const p of palos) for(const n of numeros) {
    mazo.push({numero:n,palo:p,fuerza:fuerza[`${n}${p}`] || fuerza[n] || 0});
  }
}


function sacarCarta(){
  const i = Math.floor(Math.random()*mazo.length);
  return mazo.splice(i,1)[0];
}


function repartir(){
  crearMazo();
  manoJugador = [sacarCarta(), sacarCarta(), sacarCarta()];
  manoBot = [sacarCarta(), sacarCarta(), sacarCarta()];
  empiezaJugador = !empiezaJugador;
  turnoJugador = empiezaJugador;
  trucoNivel = -1;
  envidoCantado = false;
  rondaTerminada = false;
  esperandoRespuestaEnvido = false;
  tipoEnvidoActual = "envido";
  playedPlayer = null;
  playedBot = null;
  bazasJugador = 0;
  bazasBot = 0;

  safeDisable("btnTruco", false);
  safeDisable("btnEnvido", false);
  safeDisable("btnRealEnvido", false);
  safeDisable("btnFaltaEnvido", false);
  safeDisable("btnMazo", false);

  renderCartas();
  limpiarMesa();
  log(`Nueva mano. ${empiezaJugador ? "Vos sos mano" : "Bot es mano"}.`);
  if(!empiezaJugador) setTimeout(botPlayFirst, 700);
}


function safeDisable(id, v){
  const el=document.getElementById(id);
  if(el) el.disabled = v;
}


function renderCartas(){
  const tus = document.getElementById("tusCartas");
  tus.innerHTML = "";
  manoJugador.forEach((c,i)=>{
    const d = document.createElement("div");
    d.className = "carta";
    d.textContent = `${c.numero} de ${c.palo}`;
    d.onclick = ()=> playerPlay(i);
    tus.appendChild(d);
  });

  const bot = document.getElementById("cartasBot");
  bot.innerHTML = "";
  manoBot.forEach(()=> {
    const d = document.createElement("div");
    d.className = "carta bot";
    d.textContent = "?";
    bot.appendChild(d);
  });
}


function playerPlay(i){
  if (esperandoRespuestaEnvido) {
    log("Primero respondé el Envido antes de jugar una carta.");
    return;
  }
  if(!turnoJugador || rondaTerminada) return;

  const carta = manoJugador.splice(i,1)[0];
  playedPlayer = carta;
  log(`Jugaste ${carta.numero} de ${carta.palo}`);
  mostrarCartasEnMesa("jugador", carta);

  if(playedBot){
    resolveBaza();
  } else {
    turnoJugador = false;
    setTimeout(()=> botRespondToPlayer(carta), 600);
  }
  renderCartas();
}


function botPlayFirst() {
  if (rondaTerminada || manoBot.length === 0) return;

  if (!envidoCantado && manoBot.length === 3) {
    botCantaEnvidoTipo();
    return;
  }
  const cartaBot = chooseBotCardWhenStarting();
  manoBot.splice(manoBot.indexOf(cartaBot), 1);
  playedBot = cartaBot;
  log(`Bot jugó ${cartaBot.numero} de ${cartaBot.palo}`);
  mostrarCartasEnMesa("bot", cartaBot);

  turnoJugador = true;
  renderCartas();
}


function chooseBotCardWhenStarting() {
  const alta = manoBot.filter(c => c.fuerza >= 10);
  if (alta.length) return alta[Math.floor(Math.random() * alta.length)];
  return manoBot.reduce((a,b) => a.fuerza < b.fuerza ? a : b);
}


function botRespondToPlayer(cartaJugador) {
  if (rondaTerminada) return;
  let posibles = manoBot.filter(c => c.fuerza > cartaJugador.fuerza);
  let choice;
  const bluff = Math.random() < 0.1;
  if(bluff) {
    log("Bot blufeó y jugó fuerte aun con mano débil");
    choice = manoBot.reduce((a,b) => a.fuerza > b.fuerza ? a : b);
  }
  if(!choice){
    if(posibles.length > 0){
      choice = posibles.reduce((a,b) => a.fuerza < b.fuerza ? a : b);
      if(manoBot.length === 1) choice = posibles.reduce((a,b) => a.fuerza > b.fuerza ? a : b);
    } else {
      choice = Math.random() < 0.85
        ? manoBot.reduce((a,b) => a.fuerza < b.fuerza ? a : b)
        : manoBot.reduce((a,b) => a.fuerza > b.fuerza ? a : b);
    }
  }
  manoBot.splice(manoBot.indexOf(choice),1);
  playedBot = choice;
  log(`Bot jugó ${choice.numero} de ${choice.palo}`);
  mostrarCartasEnMesa("bot", choice);
  resolveBaza();
  renderCartas();
}


function resolveBaza() {
  if (!playedPlayer || !playedBot) return;

  const fp = playedPlayer.fuerza;
  const fb = playedBot.fuerza;
  let ganador = null;

  if (fp > fb) ganador = "player", bazasJugador++;
  else if (fb > fp) ganador = "bot", bazasBot++;
  else ganador = "tie";

  playedPlayer = null;
  playedBot = null;

  if ((bazasJugador + bazasBot === 1) && ganador === "tie") {
    turnoJugador = !empiezaJugador;
    return;
  }
  if (bazasJugador === 2 || bazasBot === 2 || (bazasJugador + bazasBot === 3)) {
    finishHandByBazas();
    return;
  }
  let siguiente = ganador === "player" ? "player" : ganador === "bot" ? "bot" : (empiezaJugador ? "player" : "bot");
  turnoJugador = siguiente === "player";
  if(!turnoJugador) setTimeout(botPlayFirst, 600);
}


function finishHandByBazas(){
  rondaTerminada = true;
  let pts = 1;
  if(trucoNivel === 0) pts = 1;
  else if(trucoNivel === 1) pts = 2;
  else if(trucoNivel === 2) pts = 3;


  if(bazasJugador > bazasBot){
    puntosJugador += pts;
    log(`Ganaste la mano (+${pts})`);
    empiezaJugador = true;
  } else if(bazasBot > bazasJugador){
    puntosBot += pts;
    log(`Bot gana la mano (+${pts})`);
    empiezaJugador = false;
  } else {
    if(empiezaJugador){ puntosJugador += pts; log(`Empate: gana quien es mano (Vos) (+${pts})`); }
    else { puntosBot += pts; log(`Empate: gana quien es mano (Bot) (+${pts})`); }
  }
  actualizarPuntos();
  setTimeout(repartir, 1200);
}


function irseAlMazo() {
  let puntos = 1;
  if (manoJugador.length === 3 && manoBot.length === 3 && !envidoCantado) puntos = 2;
  puntosBot += puntos;
  actualizarPuntos();
  log(`Te fuiste al mazo. Bot gana ${puntos} punto${puntos>1?"s":""}.`);
  setTimeout(repartir,600);
}


function cantarTruco(){
  if(trucoNivel >= 0 || rondaTerminada) return log("Truco ya cantado");
  trucoNivel = 1;
  log("Cantas Truco");
  safeDisable("btnTruco", true);
  const sum = manoBot.reduce((s,c)=>s+c.fuerza,0);
  const quiere = sum >= 24 ? Math.random() < 0.95 : Math.random() < 0.6;
  if(quiere) log("Bot quiere Truco");
  else {
    log("Bot no quiere Truco");
    puntosJugador += 1;
    actualizarPuntos();
    rondaTerminada = true;
    setTimeout(repartir,1000);
  }
}


function cantarEnvido(){
  if (envidoCantado || manoJugador.length < 3) return log("No se puede cantar Envido después de la primera carta.");
  envidoCantado = true;
  safeDisable("btnEnvido", true);
  safeDisable("btnRealEnvido", true);
  safeDisable("btnFaltaEnvido", true);

  const eJ = calcularEnvido(manoJugador);
  const eB = calcularEnvido(manoBot);
  const quiere = eB >= 26 ? true : (eB <= 19 ? false : Math.random() < 0.6);

  if(quiere){
    log(`Bot quiere Envido. Vos: ${eJ} - Bot: ${eB}`);
    if(eJ > eB){ puntosJugador += 2; log("Ganaste el Envido (+2)"); }
    else if(eB > eJ){ puntosBot += 2; log("Bot gana el Envido (+2)"); }
    else { 
      if(empiezaJugador){ puntosJugador += 2; log("Empate en Envido: gana quien es mano (Vos) (+2)"); } 
      else { puntosBot += 2; log("Empate en Envido: gana quien es mano (Bot) (+2)"); } 
    }
  } else {
    log("Bot no quiere Envido");
    puntosJugador += 1;
  }
  actualizarPuntos();
}


function cantarRealEnvido(){
  if (envidoCantado || manoJugador.length < 3) return log("No se puede cantar Real Envido después de la primera carta.");
  envidoCantado = true;
  safeDisable("btnEnvido", true);
  safeDisable("btnRealEnvido", true);
  safeDisable("btnFaltaEnvido", true);

  const eJ = calcularEnvido(manoJugador);
  const eB = calcularEnvido(manoBot);
  const quiere = eB >= 27 ? true : (eB <= 20 ? false : Math.random() < 0.6);

  if(quiere){
    log(`Bot quiere Real Envido. Vos: ${eJ} - Bot: ${eB}`);
    if(eJ > eB){ puntosJugador += 3; log("Ganaste Real Envido (+3)"); }
    else if(eB > eJ){ puntosBot += 3; log("Bot gana Real Envido (+3)"); }
    else { 
      if(empiezaJugador){ puntosJugador += 3; log("Empate en Real Envido: gana quien es mano (Vos) (+3)"); } 
      else { puntosBot += 3; log("Empate en Real Envido: gana quien es mano (Bot) (+3)"); } 
    }
  } else {
    log("Bot no quiere Real Envido");
    puntosJugador += 1;
  }
  actualizarPuntos();
}


function cantarFaltaEnvido(){
  if (envidoCantado || manoJugador.length < 3) return log("No se puede cantar Falta Envido después de la primera carta.");
  envidoCantado = true;
  safeDisable("btnEnvido", true);
  safeDisable("btnRealEnvido", true);
  safeDisable("btnFaltaEnvido", true);

  const eJ = calcularEnvido(manoJugador);
  const eB = calcularEnvido(manoBot);
  const falta = 15 - Math.max(puntosJugador, puntosBot);
  const quiere = eB >= 28 ? true : Math.random() < 0.5;

  if(quiere){
    log(`Bot quiere Falta Envido. Vos: ${eJ} - Bot: ${eB}`);
    if(eJ > eB){ puntosJugador += falta; log(`Ganaste Falta Envido (+${falta})`); }
    else if(eB > eJ){ puntosBot += falta; log(`Bot gana Falta Envido (+${falta})`); }
    else { 
      if(empiezaJugador){ puntosJugador += falta; log(`Empate Falta Envido: gana quien es mano (Vos) (+${falta})`); } 
      else { puntosBot += falta; log(`Empate Falta Envido: gana quien es mano (Bot) (+${falta})`); } 
    }
  } else {
    log("Bot no quiere Falta Envido");
    puntosJugador += 1;
  }
  actualizarPuntos();
}


function botCantaEnvidoTipo() {
  if (manoBot.length < 3) return;
  if (envidoCantado) return;

  const eB = calcularEnvido(manoBot);
  let tipo = "envido";
  if (eB >= 29 && Math.random() < 0.5) tipo = "real";
  if (eB >= 32 && Math.random() < 0.7) tipo = "falta";

  envidoCantado = true;
  esperandoRespuestaEnvido = true;
  tipoEnvidoActual = tipo;

  log(`Bot canta ${tipo === "envido" ? "Envido" : tipo === "real" ? "Real Envido" : "Falta Envido"}`);
  mostrarBotonesEnvido(tipo);
}


function mostrarBotonesEnvido(tipo){
  document.getElementById("btnQuiero").style.display = "inline-block";
  document.getElementById("btnNoQuiero").style.display = "inline-block";
  safeDisable("btnTruco", true);
  if(tipo === "envido"){
    safeDisable("btnEnvido", false);
    safeDisable("btnRealEnvido", false);
    safeDisable("btnFaltaEnvido", false);
  } else if(tipo === "real"){
    safeDisable("btnRealEnvido", false);
    safeDisable("btnFaltaEnvido", false);
  } else if(tipo === "falta"){
    safeDisable("btnFaltaEnvido", false);
  }
}

function ocultarBotonesEnvido(){
  document.getElementById("btnQuiero").style.display = "none";
  document.getElementById("btnNoQuiero").style.display = "none";
  safeDisable("btnTruco", false);
  safeDisable("btnEnvido", false);
  safeDisable("btnRealEnvido", false);
  safeDisable("btnFaltaEnvido", false);
  safeDisable("btnMazo", false);
}


function responderEnvido(respuesta) {
  ocultarBotonesEnvido();
  esperandoRespuestaEnvido = false;

  const eJ = calcularEnvido(manoJugador);
  const eB = calcularEnvido(manoBot);

  let puntos = tipoEnvidoActual === "envido" ? 2 :
  tipoEnvidoActual === "real" ? 3 : 15;

  if (respuesta === true) {
    if (eJ > eB) {
      puntosJugador += puntos;
      log(`Ganaste ${tipoEnvidoActual} (+${puntos})`);
    } else if (eB > eJ) {
      puntosBot += puntos;
      log(`Bot gana ${tipoEnvidoActual} (+${puntos})`);
    } else {
      if (empiezaJugador) {
        puntosJugador += puntos;
        log(`Empate ${tipoEnvidoActual}: gana quien es mano (Vos) (+${puntos})`);
      } else {
        puntosBot += puntos;
        log(`Empate ${tipoEnvidoActual}: gana quien es mano (Bot) (+${puntos})`);
      }
    }
    log(`Puntaje Envido: Vos ${eJ} - Bot ${eB}`);
  } else {
    puntosBot += 1;
    log(`No quisiste ${tipoEnvidoActual}. Bot gana 1 punto.`);
  }

  actualizarPuntos();
  if (!turnoJugador && manoBot.length > 0) {
    setTimeout(botPlayFirst, 400);
  }
}


function actualizarPuntos(){
  document.getElementById("puntosJugador").textContent = puntosJugador;
  document.getElementById("puntosBot").textContent = puntosBot;
}


function log(txt){
  const d = document.getElementById("log");
  if(!d) return;
  d.innerHTML += `<div>${txt}</div>`;
  d.scrollTop = d.scrollHeight;
}


function mostrarCartasEnMesa(origen, carta){
  const mesaCenter = document.getElementById("mesa-center");
  if(!mesaCenter || !carta) return;

  const nuevaCarta = document.createElement("div");
  nuevaCarta.classList.add("carta-mesa");
  nuevaCarta.textContent = `${carta.numero} de ${carta.palo}`;

  if(origen==="bot"){
    nuevaCarta.classList.add("carta-bot");
    nuevaCarta.style.setProperty("--offset", `${offsetBot*10}px`);
    nuevaCarta.style.zIndex = 100+offsetBot;
    offsetBot++;
  } else {
    nuevaCarta.classList.add("carta-jugador");
    nuevaCarta.style.setProperty("--offset", `${offsetPlayer*10}px`);
    nuevaCarta.style.zIndex = 200+offsetPlayer;
    offsetPlayer++;
  }
  mesaCenter.appendChild(nuevaCarta);
}


function limpiarMesa(){
  const mesaCenter = document.getElementById("mesa-center");
  if(mesaCenter) mesaCenter.innerHTML = "";
  offsetPlayer = 0;
  offsetBot = 0;
}


document.addEventListener("DOMContentLoaded", repartir);