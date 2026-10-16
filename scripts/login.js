
const formulario = document.getElementById("form-login");
const mensaje = document.getElementById("mensaje-login");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const contrasena = document.getElementById("contrasena").value;

    mensaje.textContent = "Conectando con el servidor...";

    try {
        const respuesta = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario: usuario,
                contrasena: contrasena
            })
        });

        const datos = await respuesta.json();

        mensaje.textContent = datos.mensaje;

    } catch (error) {
        console.error("Error de conexión:", error);
        mensaje.textContent = "No se pudo conectar con el servidor.";
    }
});
