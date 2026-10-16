const botonPisoUno = document.getElementById("piso1");
const botonPisoDos = document.getElementById("piso2");
const mapa1 = document.getElementById("mapa1");
const mapa2 = document.getElementById("mapa2");

botonPisoUno.addEventListener("click", () => {
    mapa1.classList.remove("ocultar");
    mapa2.classList.add("ocultar");
    botonPisoDos.classList.remove("activo");
    botonPisoUno.classList.add("activo");
});
botonPisoDos.addEventListener("click", () => {
    mapa2.classList.remove("ocultar");
    mapa1.classList.add("ocultar");
    botonPisoUno.classList.remove("activo");
    botonPisoDos.classList.add("activo");
});

//objeto en js