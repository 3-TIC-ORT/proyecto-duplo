// Esperar a que el documento esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {

    // Selecciona todas las cartas dentro del contenedor con clase "cards"
    const cartas = document.querySelectorAll('.carta');
  
    // Recorre cada carta y le agrega un evento de clic
    cartas.forEach((carta, index) => {
  
      carta.addEventListener('click', () => {
  
        // Si la carta está bloqueada, se desbloquea
        if (carta.classList.contains('bloqueada')) {
          carta.classList.remove('bloqueada');
  
          // 🔔 (Opcional) Sonido o efecto visual al desbloquear
          // const sonido = new Audio('audio/desbloquear.mp3');
          // sonido.play();
  
          console.log(`Carta ${index + 1} desbloqueada`);
  
        } else {
          // Si querés que se pueda volver a bloquear al hacer clic otra vez,
          // podés descomentar la línea de abajo:
           carta.classList.add('bloqueada');
        }
      });
    });
  
  });
  