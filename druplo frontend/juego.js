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
let primeraEmpatada = false;
let empiezaJugador = true;
let turnoJugador = true;
let trucoNivel = -1;

let envidoCantado = false;
let envidoNivel = 0;
let quienCantoEnvido = null;
let subiendoEnvido = false;
let envidoAcumulado = 0;
let ultimoAporte = 0;
let botYaRespondioEnvido = false;
let envidoYaJugado = false;
let envidoEnCurso = false;
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
  resetEnvido();
  rondaTerminada = false;
  playedPlayer = null;
  playedBot = null;
  bazasJugador = 0;
  bazasBot = 0;

  safeDisable("btnTruco", false);
  safeDisable("btnRetruco",false);
  safeDisable("btnValecuatro",false);
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


function renderCartas() {
  // Renderizar cartas del jugador
  const tus = document.getElementById("tusCartas");
  tus.innerHTML = "";  // Limpiamos el contenedor de las cartas del jugador
  manoJugador.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "carta";
    d.onclick = () => playerPlay(i);  // Cuando se hace clic en una carta, se juega
    tus.appendChild(d);

    // Agregar imagen de la carta del jugador
    const img = document.createElement("img");
    img.src = `../TIMI/${c.numero}_${c.palo}.png`;  // Ruta de la imagen de la carta del jugador
    img.alt = `${c.numero} de ${c.palo}`;  // Texto alternativo
    img.className = "carta-imagen";  // Clase para la imagen
    d.appendChild(img);  // Agregamos la imagen al contenedor de la carta
  });

  // Renderizar cartas del bot
  const bot = document.getElementById("cartasBot");
  bot.innerHTML = "";  // Limpiamos el contenedor de las cartas del bot
  manoBot.forEach(() => {
    const d = document.createElement("div");
    d.className = "carta bot";

    // Crear una imagen del reverso de la carta del bot (antes de que se juegue)
    const img = document.createElement("img");
    img.src = "../TIMI/back.png";  // Ruta de la imagen del reverso de la carta
    img.alt = "Reverso de la carta";  // Texto alternativo
    img.className = "carta-imagen";  // Clase para la imagen
    d.appendChild(img);  // Agregamos la imagen al contenedor de la carta

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

  if (!envidoYaJugado && !envidoCantado && manoBot.length === 3) {
    envidoYaJugado = true;
    botCantaEnvidoTipo();
    return;
  }  
  if (!esperandoRespuestaEnvido && !playedBot && botIntentarCantarTruco()) {
    return;}
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
  if (!esperandoRespuestaEnvido && !playedBot && botIntentarCantarTruco()) {
    return;}
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
  if (bazasJugador + bazasBot === 0 && ganador === "tie") {
    primeraEmpatada = true;
    turnoJugador = !empiezaJugador;
    return;
  }
  if (primeraEmpatada && (bazasJugador + bazasBot === 1)) {
    finishHandByBazas();
    primeraEmpatada = false;
    return;
  }
  if (bazasJugador === 2 || bazasBot === 2 || (bazasJugador + bazasBot === 3)) {
    finishHandByBazas();
    primeraEmpatada = false;
    return;
  }
  let siguiente;

if (ganador === "player") {
  siguiente = "player";
} else if (ganador === "bot") {
  siguiente = "bot";
} else {
siguiente = empiezaJugador ? "player" : "bot";
}

  turnoJugador = siguiente === "player";
  if (!turnoJugador) setTimeout(botPlayFirst, 600);
}


function finishHandByBazas(){
  rondaTerminada = true;
  let pts = 1;
  if(trucoNivel === 0) pts = 1;
  else if(trucoNivel === 1) pts = 2;
  else if(trucoNivel === 2) pts = 3;
  else if (trucoNivel === 3) pts = 4;

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


 function botIntentarCantarTruco() {
  if (trucoNivel >= 0 || rondaTerminada) return false;

  const fuerzaBot = manoBot.reduce((acc, c) => acc + c.fuerza, 0);

  if (fuerzaBot >= 28) {
    trucoNivel = 0;
    log("Bot canta TRUCO");

safeDisable("btnTruco", true);
safeDisable("btnEnvido", true);
safeDisable("btnRealEnvido", true);
safeDisable("btnFaltaEnvido", true);

btnQuiero.style.display = "inline-block";
btnNoQuiero.style.display = "inline-block";

btnQuiero.onclick = () => responderTruco(true);
btnNoQuiero.onclick = () => responderTruco(false);

return true;
  }
  return false;
}


function responderTruco(quiero) {
    btnQuiero.style.display = "none";
    btnNoQuiero.style.display = "none";

    if (quiero) {
        log("quisiste el truco");
        trucoNivel = 1;

        if (!turnoJugador && !playedBot && !rondaTerminada) {
            setTimeout(() => {
                if (!playedBot) botPlayFirst();
            }, 400);
        }

    } else {
        log("No querido. Ganás 1 punto.");
        puntosJugador += 1;
        actualizarPuntos();
        resetRonda();
    }
}



function cantarTruco() {
  if (rondaTerminada || trucoNivel >= 1) return log("Ya está cantado el Truco o superior.");

  trucoNivel = 1;
  log("Cantas TRUCO");

  safeDisable("btnTruco", true);
  safeDisable("btnEnvido", true);
  safeDisable("btnRealEnvido", true);
  safeDisable("btnFaltaEnvido", true);

  decidirRespuestaTruco(2, 1);
}


function cantarRetruco() {
  if (rondaTerminada || trucoNivel !== 1) return log("No podés cantar Retruco ahora.");

  trucoNivel = 2;
  log("Cantas RETRUCO");

  decidirRespuestaTruco(3, 2);
}


function cantarValecuatro() {
  if (rondaTerminada || trucoNivel !== 2) return log("No podés cantar Vale Cuatro ahora.");

  trucoNivel = 3;
  log("Cantas VALE CUATRO");

  decidirRespuestaTruco(4, 3);
}


function decidirRespuestaTruco(puntosSiQuiere, puntosSiNoQuiere) {
  const fuerzaBot = manoBot.reduce((acc, c) => acc + c.fuerza, 0);

  let quiere = false;

  if (fuerzaBot >= 28) quiere = true;
  else if (fuerzaBot >= 22) quiere = Math.random() < 0.7;
  else quiere = Math.random() < 0.15;

  setTimeout(() => {
    if (quiere) {
      log(`Bot quiere ${trucoNivel === 1 ? "Truco" : trucoNivel === 2 ? "Retruco" : "Vale Cuatro"}`);
    } else {
      log(`Bot no quiere ganas 1 punto`);
      puntosJugador += puntosSiNoQuiere;
      actualizarPuntos();
      rondaTerminada = true;
      setTimeout(repartir, 1000);
    }
  }, 500);
}


function cantarEnvido() {
  if (envidoCantado && !esperandoRespuestaEnvido) {
     safeDisable("btnEnvido", true);
    return;
  }
  if (!esperandoRespuestaEnvido && (manoJugador.length < 3 || manoBot.length < 3)) {
    log("Sólo podés cantar Envido antes de jugar la primera carta.");
    return;
  }

  subiendoEnvido = true;
  envidoCantado = true;
  tipoEnvidoActual = "envido";
  log("Cantas Envido");
  quienCantoEnvido = "jugador";

  envidoAcumulado += 2;
  ultimoAporte = 2;

  decidirSiBotQuiere(tipoEnvidoActual);
}

function cantarRealEnvido() {
  if (!esperandoRespuestaEnvido || !envidoCantado) {
  safeDisable("btnRealEnvido", true);
    return;
  }

  subiendoEnvido = true;
  tipoEnvidoActual = "real envido";
  log("Cantas Real Envido");
  quienCantoEnvido = "jugador";

  envidoAcumulado += 3;
  ultimoAporte = 3;

  decidirSiBotQuiere(tipoEnvidoActual);
}

function cantarFaltaEnvido() {
  if (!esperandoRespuestaEnvido || !envidoCantado) {
  safeDisable("btnFaltaEnvido", true);
    return;
  }

  subiendoEnvido = true;
  tipoEnvidoActual = "falta envido";
  log("Cantas Falta Envido");
  quienCantoEnvido = "jugador";

  const falta = 15 - Math.max(puntosJugador, puntosBot);

  envidoAcumulado = falta;
  ultimoAporte = falta;

  decidirSiBotQuiere(tipoEnvidoActual);
}


function decidirSiBotQuiere(tipo) {
  if (botYaRespondioEnvido) return;

  botYaRespondioEnvido = true;
  esperandoRespuestaEnvido = true;

  const eB = calcularEnvido(manoBot);

  setTimeout(() => {

    let quiere = true;

    if (quienCantoEnvido === "jugador" && subiendoEnvido && eB <= 25) {
      quiere = false;
    } 
    else if (quienCantoEnvido === "jugador" && subiendoEnvido && eB >= 29) {
      quiere = true;
    } 
    else {
      quiere = Math.random() < 0.3;
    }

    responderEnvido(quiere);

  }, 600);
}


function botCantaEnvidoTipo() {
  if (manoBot.length < 3) return;

  const eB = calcularEnvido(manoBot);
  envidoCantado = true;
  esperandoRespuestaEnvido = true;

  envidoAcumulado = 2;
  ultimoAporte = 2;
  tipoEnvidoActual = "envido";
  quienCantoEnvido = "bot";

  log("Bot canta Envido");
  mostrarBotonesEnvido();
}


function mostrarBotonesEnvido() {
  document.getElementById("btnQuiero").style.display = "inline-block";
  document.getElementById("btnNoQuiero").style.display = "inline-block";

  safeDisable("btnTruco", true);
  safeDisable("btnRetruco", true);
  safeDisable("btnValecuatro", true);
  safeDisable("btnEnvido", false);
  safeDisable("btnRealEnvido", false);
  safeDisable("btnFaltaEnvido", false);
  safeDisable("btnMazo", true);
}


function ocultarBotonesEnvido(){
  document.getElementById("btnQuiero").style.display = "none";
  document.getElementById("btnNoQuiero").style.display = "none";
  safeDisable("btnTruco", false);
  safeDisable("btnRetruco", false);
  safeDisable("btnValecuatro", false);
  safeDisable("btnEnvido", false);
  safeDisable("btnRealEnvido", false);
  safeDisable("btnFaltaEnvido", false);
  safeDisable("btnMazo", false);
}


function responderEnvido(quiere) {
  ocultarBotonesEnvido();
  esperandoRespuestaEnvido = false;

  const eJ = calcularEnvido(manoJugador);
  const eB = calcularEnvido(manoBot);

  if (!quiere) {

    if (quienCantoEnvido === "jugador") {

      const puntosNoQuerido = subiendoEnvido ? 2 : 1;

      puntosJugador += puntosNoQuerido;
      log(`Bot no quiere. Ganás ${puntosNoQuerido} punto${puntosNoQuerido>1?"s":""}.`);

    } else {
      puntosBot += 1;
      log(`No querés. Bot gana 1 punto.`);
    }

    actualizarPuntos();
    botYaRespondioEnvido = false;
    subiendoEnvido = false;

    if (!turnoJugador) {
      setTimeout(() => continuarDespuesDeEnvido(), 500);
    }
    return;
}

  if (eJ > eB) {
    puntosJugador += envidoAcumulado;
    log(`Ganaste el Envido (+${envidoAcumulado})`);
  } else if (eB > eJ) {
    puntosBot += envidoAcumulado;
    log(`Bot gana el Envido (+${envidoAcumulado})`);
  } else {
    if (empiezaJugador) {
      puntosJugador += envidoAcumulado;
      log(`Empate: sos mano, ganás (+${envidoAcumulado})`);
    } else {
      puntosBot += envidoAcumulado;
      log(`Empate: Bot es mano, gana (+${envidoAcumulado})`);
    }
  }

  log(`Puntaje Envido: Vos ${eJ} - Bot ${eB}`);

  actualizarPuntos();
  botYaRespondioEnvido = false;
  subiendoEnvido = false;

  if (!turnoJugador) {
    setTimeout(() => continuarDespuesDeEnvido(), 500);
  }
}


function resetEnvido() {
  envidoCantado = false;
  envidoNivel = 0;
  subiendoEnvido = false;
  envidoAcumulado = 0;
  ultimoAporte = 0;
  botYaRespondioEnvido = false;
  envidoYaJugado = false;
  envidoEnCurso = false;
  esperandoRespuestaEnvido = false;
  tipoEnvidoActual = "envido";
}


function continuarDespuesDeEnvido() {
  if (!turnoJugador && !rondaTerminada) {
    setTimeout(botPlayFirst, 500);
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


function mostrarCartasEnMesa(origen, carta) {
  const mesaCenter = document.getElementById("mesa-center");
  if (!mesaCenter || !carta) return;

  // Crear un div para la carta
  const nuevaCarta = document.createElement("div");
  nuevaCarta.classList.add("carta-mesa");

  // Crear la imagen de la carta
  const img = document.createElement("img");
  img.src = `../TIMI/${carta.numero}_${carta.palo}.png`;  // Ruta de la imagen
  img.alt = `${carta.numero} de ${carta.palo}`;  // Texto alternativo para accesibilidad
  img.className = "carta-imagen";  // Clase para la imagen

  // Agregar la imagen a la carta
  nuevaCarta.appendChild(img);

  // Si la carta es del bot, ajusta el estilo para el bot
  if (origen === "bot") {
    nuevaCarta.classList.add("carta-bot");
    const offset = offsetBot * 10;
    nuevaCarta.style.setProperty("--offset", `${offset}px`);
    nuevaCarta.style.zIndex = 100 + offsetBot;
    mesaCenter.appendChild(nuevaCarta);
    offsetBot++;
  } else {
    // Si la carta es del jugador, ajusta el estilo para el jugador
    nuevaCarta.classList.add("carta-jugador");
    const offset = offsetPlayer * 10;
    nuevaCarta.style.setProperty("--offset", `${offset}px`);
    nuevaCarta.style.zIndex = 200 + offsetPlayer;
    mesaCenter.appendChild(nuevaCarta);
    offsetPlayer++;
  }
}


function limpiarMesa(){
  const mesaCenter = document.getElementById("mesa-center");
  if(mesaCenter) mesaCenter.innerHTML = "";
    offsetPlayer = 0;
  offsetBot = 0;
}


document.addEventListener("DOMContentLoaded", repartir);