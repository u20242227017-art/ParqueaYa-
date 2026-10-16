
const mapa1 = document.getElementById("mapa1");
const mapa2 = document.getElementById("mapa2");

const boton1 = document.getElementById("botonPiso1");
const boton2 = document.getElementById("botonPiso2");

boton1.addEventListener("click", () =>{
    mapa1.classList.remove("ocultar");
    mapa2.classList.add("ocultar");

    boton1.classList.add("activo");
    boton2.classList.remove("activo");
})
boton2.addEventListener("click", () =>{
    mapa2.classList.remove("ocultar");
    mapa1.classList.add("ocultar");

    boton2.classList.add("activo");
    boton1.classList.remove("activo");
})

console.log(mapa1);
console.log(mapa2);
console.log(boton1);
console.log(boton2);