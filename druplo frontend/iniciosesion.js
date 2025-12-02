const form = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const contraseña = document.getElementById("contraseña").value.trim();
  
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const encontrado = usuarios.find(u => u.usuario === usuario && u.contrasena === contraseña);

  if (encontrado) {
    mensaje.style.color = "green";
    mensaje.textContent = "Inicio de sesión exitoso";
  
    localStorage.setItem("usuarioActivo", JSON.stringify(encontrado));
    setTimeout(() => {
      window.location.href = "inicio.html"; 
    }, 1000);

  } else {
    mensaje.style.color = "red";
    mensaje.textContent = "Usuario o contraseña incorrectos";
  }
});