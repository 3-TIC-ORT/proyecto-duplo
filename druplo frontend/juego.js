const palos = ["espada","basto","oro","copa"];
const numeros = [1,2,3,4,5,6,7,10,11,12];
const fuerza = {
  "1espada":14,"1basto":13,"7espada":12,"7oro":11,
  "3":10,"2":9,"1":8,"12":7,"11":6,"10":5,"7":4,"6":3,"5":2,"4":1
};

let mazo = [];
let mazoJugador = [];
let mazoCompleto = [];
let manoJugador = [];
let manoBot = [];
let cartasJugadas = [];
let puntosJugador = 0;
let puntosBot = 0;

let offsetPlayer = 0;
let offsetBot = 0;
let primeraEmpatada = false;
let empiezaJugador = true;
let turnoJugador = true;
let trucoNivel = -1;
let quienCantoTruco = null;

let envidoCantado = false;
let envidoNivel = 0;
let envidoJugadorDeclarado = null;
let timeoutEnvido = null;
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

let cartasEspecialesFijas = null;

// JOKERS
let Gigantismo = false;
let Druplo = false;
let jockerDefensa = false;
let jockerRiesgoso = false;

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

  cartasJugadas.push(carta);

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
      const eB = calcularEnvido(manoBot);

      envidoYaJugado = true;

      if (eB > 8) {
          botCantaEnvidoTipo();
          return;
      }
  }
  if (trucoNivel >= 0 && botIntentarCantarTruco()) {
    botCantaTruco();
    return;
}

  const cartaBot = chooseBotCardWhenStarting();
  manoBot.splice(manoBot.indexOf(cartaBot), 1);
  playedBot = cartaBot;
  cartasJugadas.push(cartaBot);

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
  const bluff = Math.random() < 0.18;
  if(bluff) {
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
  cartasJugadas.push(choice);

  log(`Bot jugó ${choice.numero} de ${choice.palo}`);
  mostrarCartasEnMesa("bot", choice);
  resolveBaza();
  renderCartas();
}


function botIntentarCantarTruco() {
  if (trucoNivel >= 0 || rondaTerminada) return false;

  const fuerzaBot = manoBot.reduce((acc, carta) => acc + carta.fuerza, 0);

  if (fuerzaBot >= 23) {
    if (timeoutEnvido) {
      clearTimeout(timeoutEnvido);
      timeoutEnvido = null;
    }

    trucoNivel = 1;
    quienCantoTruco = "bot";

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
if (bazasJugador === 1 && bazasBot === 1 && ganador === "tie") {
    if (empiezaJugador) {
        bazasJugador++; 
    } else {
        bazasBot++;
    }
    finishHandByBazas();
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
  verificarFinDelJuego();
  setTimeout(repartir, 1200);
}


function irseAlMazo() {
  let puntos = 1;
  if (manoJugador.length === 3 && manoBot.length === 3 && !envidoCantado) puntos = 2;
  puntosBot += puntos;
  actualizarPuntos();
  log(`Te fuiste al mazo. Bot gana ${puntos} punto${puntos>1?"s":""}.`);
  verificarFinDelJuego();
  setTimeout(repartir,600);
}



function responderTruco(quiero) {
  if (typeof btnQuiero !== "undefined") btnQuiero.style.display = "none";
  if (typeof btnNoQuiero !== "undefined") btnNoQuiero.style.display = "none";

  if (!quiero) {
    log("No querido. bot gana 1 punto.");
    puntosBot += 1;
    actualizarPuntos();
    setTimeout(repartir, 1000);
    quienCantoTruco = null;
    return;
  }

  log("quisiste el truco");
  trucoNivel = 1;

  safeDisable("btnTruco", true);
  safeDisable("btnEnvido", true);
  safeDisable("btnRealEnvido", true);
  safeDisable("btnFaltaEnvido", true);

  if (quienCantoTruco === "bot") {
    setTimeout(() => {
      if (!playedBot && !rondaTerminada) {
        botPlayFirst();
      }
    }, 200);
  }
  quienCantoTruco = null;
}



function cantarTruco() {
  if (rondaTerminada || trucoNivel >= 1) return log("Ya está cantado el Truco o superior.");

  trucoNivel = 1;
  quienCantoTruco = "jugador";
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

  if (fuerzaBot >= 25) quiere = true;
  else if (fuerzaBot >= 20) quiere = Math.random() < 0.7;
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
if (!esperandoRespuestaEnvido && manoJugador.length < 2.1) {
    log("Sólo podés cantar Envido antes de jugar tu primera carta.");
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
  if (envidoCantado && !esperandoRespuestaEnvido) {
     safeDisable("btnRealEnvido", true);
    return;
  }
  if (!esperandoRespuestaEnvido && manoJugador.length < 2.1) {
    log("Sólo podés cantar Envido antes de jugar tu primera carta.");
    return;
}
  envidoCantado = true;
  subiendoEnvido = true;
  tipoEnvidoActual = "real envido";
  log("Cantas Real Envido");
  quienCantoEnvido = "jugador";

  envidoAcumulado += 3;
  ultimoAporte = 3;

  decidirSiBotQuiere(tipoEnvidoActual);
}


function cantarFaltaEnvido() {
  if (envidoCantado && !esperandoRespuestaEnvido) {
     safeDisable("btnFaltaEnvido", true);
    return;
  }
if (!esperandoRespuestaEnvido && manoJugador.length < 2.1) {
    log("Sólo podés cantar Envido antes de jugar tu primera carta.");
    return;
}
  envidoCantado = true;
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
  if (eB < 8) return;

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
  envidoJugadorDeclarado = eJ;

  if (!quiere) {

  if (quienCantoEnvido === "jugador") {
    const puntos = envidoAcumulado > 3.1 && envidoAcumulado <= 5 ? 2 : 1;
    puntosJugador += puntos;
    log(`Bot no quiere. Ganás ${puntos} punto${puntos > 1 ? "s" : ""}.`);
  } 
  
  else if (quienCantoEnvido === "bot") {
    const puntos = envidoAcumulado > 3.1 && envidoAcumulado <= 5 ? 2 : 1;
    puntosBot += puntos;
    log(`No quisiste. Bot gana ${puntos} punto${puntos > 1 ? "s" : ""}.`);
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
  envidoJugadorDeclarado = null;
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

  const nuevaCarta = document.createElement("div");
  nuevaCarta.classList.add("carta-mesa");

  const img = document.createElement("img");
  img.src = `../TIMI/${carta.numero}_${carta.palo}.png`;
  img.alt = `${carta.numero} de ${carta.palo}`;
  img.className = "carta-imagen";

  nuevaCarta.appendChild(img);

  if (origen === "bot") {
    nuevaCarta.classList.add("carta-bot");
    const offset = offsetBot * 10;
    nuevaCarta.style.setProperty("--offset", `${offset}px`);
    nuevaCarta.style.zIndex = 100 + offsetBot;
    mesaCenter.appendChild(nuevaCarta);
    offsetBot++;
  } else {
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


function verificarFinDelJuego() {
  if (puntosJugador >= 15) {
    mostrarOverlayGanaste();
  } else if (puntosBot >= 15) {
    mostrarOverlayPerdiste();
  }
}

function generarTarotsAleatorios() {
  const tarotsSeleccionados = [];
  const numeros = new Set();

  while (numeros.size < 5) {
    numeros.add(Math.floor(Math.random() * 9) + 1);
  }
  
  return Array.from(numeros);
}

function generarCartasEspecialesFijas() {
  if (cartasEspecialesFijas !== null) return cartasEspecialesFijas; 

  const todas = [];
  for (const palo of palos) {
    for (const numero of numeros) {
      todas.push({ numero, palo });
    }
  }

  // Mezclar
  for (let i = todas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [todas[i], todas[j]] = [todas[j], todas[i]];
  }

  // Elegir 8
  cartasEspecialesFijas = todas.slice(0, 8);
  return cartasEspecialesFijas;
}

function mostrarCartasTarot() {
  const container = document.getElementById("cartas-tarot");
  container.innerHTML = ""; // Limpiar contenedor
  
  const tarotsNumeros = generarTarotsAleatorios();
  
  tarotsNumeros.forEach(numero => {
    const img = document.createElement("img");
    img.src = `../TIMI/tarot_${numero}.png`;
    img.alt = `Tarot ${numero}`;
    img.className = "carta-tarot";
    img.onclick = () => {
      const max = Math.max(...tarotsNumeros);
      if (numero === max) {
        mostrarMenuCartasEspeciales();
      } else {
        mostrarMenuCartasNormales();
      }
    };
    container.appendChild(img);
  });
}

function mostrarMenuCartasNormales() {
  const menuCartas = document.getElementById("menu-cartas-normales");
  if (!menuCartas) {
    const container = document.body;
    const menu = document.createElement("div");
    menu.id = "menu-cartas-normales";
    menu.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: black;
    padding: 20px; border-radius: 30px;
    z-index: 1000; max-height: 80vh; overflow-y: auto;
  `;
    const titulo = document.createElement("h2");
    titulo.textContent = "Todas las Cartas";
    titulo.style.color = "white";
    menu.appendChild(titulo);
    
    const gridCartas = document.createElement("div");
    gridCartas.style.cssText = "display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;";
    
    for (const palo of palos) {
      for (const numero of numeros) {
        const cartaDiv = document.createElement("div");
        cartaDiv.style.cssText = "cursor: pointer; border-radius: 5px;";
        
        const img = document.createElement("img");
        img.src = `../TIMI/${numero}_${palo}.png`;
        img.alt = `${numero} de ${palo}`;
        img.style.cssText = "width: 100%; height: auto; border-radius: 5px;";
        
        cartaDiv.appendChild(img);
        cartaDiv.onclick = () => {
          menu.remove();
          cerrarOverlay();
        };
        gridCartas.appendChild(cartaDiv);
      }
    }
    
    menu.appendChild(gridCartas);
    
    const cerrarBtn = document.createElement("button");
    cerrarBtn.textContent = "Cerrar";
    cerrarBtn.style.cssText = "margin-top: 20px; padding: 10px 20px; background-color: black; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;";
    cerrarBtn.onclick = () => menu.remove();
    menu.appendChild(cerrarBtn);
    
    container.appendChild(menu);
  }
}

function mostrarMenuCartasEspeciales() {
  const menuExistente = document.getElementById("menu-cartas-especiales");
  if (menuExistente) return; // NO rehacer si ya está hecho

  const container = document.body;
  
  const menu = document.createElement("div");
  menu.id = "menu-cartas-especiales";
  menu.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: black;
    padding: 20px; border-radius: 30px;
    z-index: 1000; max-height: 80vh; overflow-y: auto;
  `;
  const titulo = document.createElement("h2");
  titulo.textContent = "Cartas Especiales";
  titulo.style.color = "white";
  menu.appendChild(titulo);

  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  `;

  const cartas = generarCartasEspecialesFijas();

  cartas.forEach(c => {
    const div = document.createElement("div");
    div.style.cssText = "cursor: pointer; border-radius: 5px;";

    const img = document.createElement("img");
    img.src = `../TIMI/${c.numero}_${c.palo}.png`;
    img.style.cssText = "width: 100%; height: auto; border-radius: 5px;";
    
    div.appendChild(img);

    div.onclick = () => {
      menu.remove();
      cerrarOverlay();
    };

    grid.appendChild(div);
  });

  menu.appendChild(grid);

  const cerrarBtn = document.createElement("button");
  cerrarBtn.textContent = "Cerrar";
  cerrarBtn.style.cssText = `
    margin-top: 20px;
    padding: 10px 20px;
    color: white;
    background-color: black;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
  `;
  cerrarBtn.onclick = () => menu.remove();

  menu.appendChild(cerrarBtn);
  container.appendChild(menu);
}

function mostrarOverlayGanaste() {
  mostrarCartasTarot();
  document.getElementById("ganaste").style.display = "block";
}

function mostrarOverlayPerdiste() {
  document.getElementById("perdiste").style.display = "block";
}

function cerrarOverlay() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("perdiste").style.display = "none";
  document.getElementById("ganaste").style.display = "none";
  puntosJugador = 0;
  puntosBot = 0;
  actualizarPuntos();
  repartir();
}


function mostrarAvisoCanto(texto) {
  const div = document.getElementById("avisoCanto"); // o avisoCanto si renombraste
  div.textContent = texto;
  div.style.display = "block";

  setTimeout(() => {
    div.style.display = "none";
  }, 2000);
}


function GigantismoTrue(puntos, tipoEnvido) {
  if (!Gigantismo) return puntos;
  return puntos + 1;
}


function DruploTrue(ganoElJugador) {
  if (!Druplo) return;

  if (ganoElJugador) 
    puntosJugador += 1;
}


function jockerDefensaTrue(puntosOriginales, tipoCanto) {
  if (!jockerDefensa) return puntosOriginales;

  if (tipoCanto === "envido" || tipoCanto === "truco") {
    return puntosOriginales;
  }

  const puntosReducidos = puntosOriginales - 1;

  return Math.max(0, puntosReducidos);
}
 

function jockerRiesgosoTrue(puntosJugadorEnvido, jugadorGano, puntosNormales) {
  if (!jockerRiesgoso) return puntosNormales;

  if (jugadorGano && puntosJugadorEnvido <= 25) {
    return puntosNormales + 2;
  }

  return puntosNormales;
}


document.addEventListener("DOMContentLoaded", repartir);