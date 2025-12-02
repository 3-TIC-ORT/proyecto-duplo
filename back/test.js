const fs = require("fs");
const { laSacerdotisa } = require("index.js");

console.log("ANTES:");
console.log(JSON.parse(fs.readFileSync("usuarios.json", "utf-8")));

laSacerdotisa({
    usuario: "444",
    carta: "10espada"
});

console.log("\nDESPUÉS:");
console.log(JSON.parse(fs.readFileSync("usuarios.json", "utf-8")));

//para probar los tarot y falta instalar el node y no se que es el powershell