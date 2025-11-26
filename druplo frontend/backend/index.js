import { subscribeGETEvent, subscribePOSTEvent, realTimeEvent, startServer } from "soquetic";
import fs from 'fs'
import database from "mime-db";
 let usuarios = JSON.parse(fs.readFileSync("usuarios.json", "utf-8"))
 let logueado = 0
 function InicioSesion()
 {
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