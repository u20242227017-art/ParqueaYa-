const botonPisoUno = document.getElementById("piso1");
const botonPisoDos = document.getElementById("piso2");
const mapa1 = document.getElementById("mapa1");
const mapa2 = document.getElementById("mapa2");

botonPisoUno.addEventListener("click", () => {
    mapa1.classList.remove("oculto");
    mapa2.classList.add("oculto");
    botonPisoUno.classList.add("activo");
    botonPisoDos.classList.remove("activo");
});
botonPisoDos.addEventListener("click", () => {
    mapa2.classList.remove("oculto");
    mapa1.classList.add("oculto");
    botonPisoDos.classList.add("activo");
    botonPisoUno.classList.remove("activo");
});
