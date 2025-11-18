const palos = ["espada","basto","oro","copa"];
const numeros = [1,2,3,4,5,6,7,10,11,12];
const fuerza = {
  "1espada":14,"1basto":13,"7espada":12,"7oro":11,
  "3":10,"2":9,"1":8,"12":7,"11":6,"10":5,"7":4,"6":3,"5":2,"4":1
};

let mazo = [];
let mazoCompleto = [];
crearMazoCompleto();
let manoJugador = [];
let manoBot = [];
let cartasJugadas = [];
let posiblesCartasJugador = [];
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


function crearMazoCompleto() {
  mazoCompleto = [];
  for (const p of palos) {
    for (const n of numeros) {
      mazoCompleto.push({
        numero: n,
        palo: p,
        fuerza: fuerza[`${n}${p}`] || fuerza[n] || 0
      });
    }
  }
}


function sacarCarta(){
  const i = Math.floor(Math.random()*mazo.length);
  return mazo.splice(i,1)[0];
}


function cartasIguales(c1, c2) {
  return c1.numero === c2.numero && c1.palo === c2.palo;
}

function estaEn(lista, carta) {
  return lista.some(c => cartasIguales(c, carta));
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
  actualizarPosiblesManos(carta);

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
  if (trucoNivel >= 0 && botShouldTruco()) {
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
  if (!esperandoRespuestaEnvido && !playedBot && botShouldTruco()) {
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


function probJugadorGanaContra(cartaBot) {
  if (!posiblesCartasJugador || posiblesCartasJugador.length === 0) return 0.5;

  let total = 0;
  let gana = 0;

  for (const mano of posiblesCartasJugador) {
    for (const carta of mano) {
      total++;
      if (carta.fuerza > cartaBot.fuerza) {
        gana++;
      }
    }
  }
  return gana / total;
}


function botShouldTruco() {
  // El bot elige su mejor carta
  const mejorCartaBot = manoBot.slice().sort((a, b) => b.fuerza - a.fuerza)[0];

  // Probabilidad de que el jugador tenga algo más fuerte
  const probJugadorFuerte = probJugadorGanaContra(mejorCartaBot);

  console.log("Prob jugador supera mi mejor carta:", probJugadorFuerte);

  // Lógica inteligente:
  //  
  // - Si la probabilidad es MUY baja => cantar Truco
  // - Si es media => Truco solo si el bot es mano
  // - Si es alta => NO cantar Truco
  
  if (probJugadorFuerte < 0.25) {
    return true; // tengo cartas FUERTES y el jugador rara vez gana
  }

  if (probJugadorFuerte < 0.40 && !empiezaJugador) {
    return true; // arranco yo, puedo presionar
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


function actualizarPosiblesManos(cartaTirada) {
  console.log("=== FILTRANDO POSIBLES MANOS ===");
  console.log("Carta tirada:", cartaTirada);
  console.log("Envido declarado:", envidoJugadorDeclarado);
  console.log("Manos posibles ANTES:", posiblesCartasJugador ? posiblesCartasJugador.length : 0);

  if (!posiblesCartasJugador || posiblesCartasJugador.length === 0) {
    console.log("No había manos posibles para filtrar. (posiblesCartasJugador vacío)");
    return;
  }

  posiblesCartasJugador = posiblesCartasJugador.filter(mano => {
    const contieneCarta = mano.some(c =>
      c.numero === cartaTirada.numero && c.palo === cartaTirada.palo
    );
    if (!contieneCarta) return false;

    const envidoMano = calcularEnvido(mano);
    if (envidoJugadorDeclarado == null) {
      return true;
    }
    return envidoMano === envidoJugadorDeclarado;
  });

  console.log("Manos posibles DESPUÉS:", posiblesCartasJugador.length);
  if (posiblesCartasJugador.length > 0) {
    posiblesCartasJugador.forEach((mano, i) => {
      console.log(
        `Mano ${i + 1}: ${mano[0].numero} de ${mano[0].palo}, ` +
        `${mano[1].numero} de ${mano[1].palo}, ${mano[2].numero} de ${mano[2].palo}`
      );
    });
  } else {
    console.warn("NO HAY ENVIDO NO HAY LOG");
  }
}


function posiblesManosConEnvido(puntajeBuscado, cartasBot, cartasJugadas) {
  const mazoFiltrado = mazoCompleto.filter(c =>
    !estaEn(cartasBot, c) &&
    !estaEn(cartasJugadas, c)
  );

  const posibles = [];

  for (let i = 0; i < mazoFiltrado.length; i++) {
    for (let j = i + 1; j < mazoFiltrado.length; j++) {

      const c1 = mazoFiltrado[i];
      const c2 = mazoFiltrado[j];
      const compartenPalo = c1.palo === c2.palo;

      if (!compartenPalo && puntajeBuscado > 20) continue;

      for (let k = j + 1; k < mazoFiltrado.length; k++) {
        const mano = [c1, c2, mazoFiltrado[k]];

        if (calcularEnvido(mano) === puntajeBuscado) {
          posibles.push(mano);
        }
      }
    }
  }
  return posibles;
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

  mostrarAvisoCanto("¡ENVIDO!");

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
posiblesCartasJugador = posiblesManosConEnvido(
  eJ,
  manoBot,
  cartasJugadas
);

console.log("Posibles manos:", posiblesCartasJugador.length);
posiblesCartasJugador.forEach((mano, i) => {
  console.log(
    `Mano ${i + 1}: ${mano[0].numero} de ${mano[0].palo}, ` +
    `${mano[1].numero} de ${mano[1].palo}, ` +
    `${mano[2].numero} de ${mano[2].palo}`
  );
});

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

function mostrarOverlayGanaste() {
  if (puntosJugador >= 15) {
  document.getElementById("overlay-title").textContent = "¡Ganaste!";
  document.getElementById("overlay-text").textContent = "Llegaste a 15 puntos.";
  document.getElementById("overlay-text").textContent = puntosJugador + " a " + puntosBot;
  document.getElementById("overlay").style.display = "flex";
  }
}

function mostrarOverlayPerdiste() {
  if (puntosBot >= 15) {
  document.getElementById("overlay-title").textContent = "Perdiste";
  document.getElementById("overlay-text").textContent = "El bot llegó a 15 puntos.";
  document.getElementById("overlay-text").textContent = puntosJugador + " a " + puntosBot;
  document.getElementById("overlay").style.display = "flex";
  }
}

function cerrarOverlay() {
  document.getElementById("overlay").style.display = "none";
}

mostrarOverlayGanaste()
mostrarOverlayPerdiste()

document.addEventListener("DOMContentLoaded", repartir);

function mostrarAvisoCanto(texto) {
  const div = document.getElementById("avisoCanto"); // o avisoCanto si renombraste
  div.textContent = texto;
  div.style.display = "block";

  setTimeout(() => {
    div.style.display = "none";
  }, 2000);
}