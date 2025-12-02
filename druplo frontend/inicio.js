
document.addEventListener("DOMContentLoaded", () => {

   
    const cartas = document.querySelectorAll('.carta');
  
   
    cartas.forEach((carta, index) => {
  
      carta.addEventListener('click', () => {
  
       
        if (carta.classList.contains('bloqueada')) {
          carta.classList.remove('bloqueada');
          console.log(`Carta ${index + 1} desbloqueada`);
        } else {
           carta.classList.add('bloqueada');
        }
      });
    });
  
  }); 
  