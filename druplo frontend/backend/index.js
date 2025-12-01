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