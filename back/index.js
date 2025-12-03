import { subscribeGETEvent, subscribePOSTEvent, realTimeEvent, startServer } from "soquetic";
import fs from 'fs'
import database from "mime-db";

 function InicioSesion(data)
 {
    let usuarios = JSON.parse(fs.readFileSync("usuarios.json", "utf-8"))
    let logueado = false;
     for (var i=0; i<usuarios.length; i++)
     {
         if(data.nombre === usuarios[i].nombre && data.contrasena === usuarios[i].contrasena)
         {
             console.log("los datos coinciden")
             logueado = true
         } else if (data.contrasena != usuarios[i].contrasena && data.nombre === usuarios[i].nombre)
         {
             logueado = false
             console.log("Contraseña incorrecta")
         }
     }
     return logueado
 }
 subscribePOSTEvent("inicioSesion", InicioSesion)

 function Registro(data) 
 {
let usuarios = JSON.parse(fs.readFileSync("usuarios.json", "utf-8"))
let usuario = data
usuarios.push(usuario) 
let usuarioArray = JSON.stringify(usuarioArray, null, 2);
fs.writeFileSync("usuarios.json", usuariosArray);
return usuario;
}

subscribePOSTEvent("Registro", Registro);

function mazoJugador (data){ 
}

function getUsuarios() {
    let usuarios = JSON.parse(fs.readFileSync("usuarios.json", "utf-8"));
    return usuarios;
}
subscribeGETEvent("getUsuarios", getUsuarios);


function elDiablo (data){
    let usuarios = JSON.parse(fs.readFileSync("usuarios.json", "utf-8"))
    for (let i = 0; i < usuarios.length; i++){
        if (data.nombre === usuarios[i].nombre){
            usuarios[i].mazo = usuarios[i].mazo.filter(carta => !carta.startsWith("10"));
        }
    }
    let usuariosArray = JSON.stringify(usuarios, null, 2);
    fs.writeFileSync("usuarios.json", usuariosArray);
    return usuarios; 
}
subscribePOSTEvent("elDiablo", elDiablo);


function laSacerdotisa(data) {
    let usuarios = JSON.parse(fs.readFileSync("usuarios.json", "utf-8"));

    const palos = ["espada", "basto", "oro", "copa"];

    for (let i = 0; i < usuarios.length; i++) {

        if (usuarios[i].usuario === data.usuario) {

            let index = usuarios[i].mazo.indexOf(data.carta);

            if (index !== -1) {
                const numero = data.carta.match(/^\d+/)[0];
                const nuevoPalo = palos[Math.floor(Math.random() * palos.length)];
                const cartaNueva = numero + nuevoPalo;
                usuarios[i].mazo[index] = cartaNueva;
            }

            break;
        }
    }
    fs.writeFileSync("usuarios.json", JSON.stringify(usuarios, null, 2));

    return usuarios;
}
subscribePOSTEvent("laSacerdotisa", laSacerdotisa);


function elEmperador(data) {

    let usuarios = JSON.parse(fs.readFileSync("usuarios.json", "utf-8"));

    for (let i = 0; i < usuarios.length; i++) {

        if (usuarios[i].usuario === data.usuario) {

            let index = usuarios[i].mazo.indexOf(data.carta);

            if (index !== -1) {
                const cartaOriginal = usuarios[i].mazo[index];

                const cartaNueva = "15_" + cartaOriginal;

                usuarios[i].mazo[index] = cartaNueva;
            }
            break;
        }
    }
    fs.writeFileSync("usuarios.json", JSON.stringify(usuarios, null, 2));

    return usuarios;
}
subscribePOSTEvent("elEmperador", elEmperador);


function elLoco(data) {
    let usuarios = JSON.parse(fs.readFileSync("usuarios.json", "utf-8"));

    const palos = ["espada", "basto", "oro", "copa"];
    const numeros = [1,2,3,4,5,6,7,10,11,12];

    for (let i = 0; i < usuarios.length; i++) {

        if (usuarios[i].usuario === data.usuario) {

            let index = usuarios[i].mazo.indexOf(data.carta);

            if (index !== -1) {
                const numero = data.carta.match(/^\d+/)[0];
                const nuevoPalo = palos[Math.floor(Math.random() * palos.length)];
                const cartaNueva = numero + nuevoPalo;
                usuarios[i].mazo[index] = cartaNueva;
            }

            break;
        }
    }
    fs.writeFileSync("usuarios.json", JSON.stringify(usuarios, null, 2));

    return usuarios;
}
subscribePOSTEvent("elLoco", elLoco);


startServer();