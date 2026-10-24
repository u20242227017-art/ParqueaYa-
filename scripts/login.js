
const formulario = document.getElementById("form-login");
const mensaje = document.getElementById("mensaje-login");
const botonIngreso = formulario.querySelector('[type="submit"]');

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const contrasena = document.getElementById("contrasena").value;

    mensaje.textContent = "Conectando con el servidor...";
    botonIngreso.disabled = true;

    try {
        const datos = await window.ParqueaYaApi.post("/auth/login", {
            usuario,
            password: contrasena,
        });
        sessionStorage.setItem("access_token", datos.access_token);
        sessionStorage.setItem("administrador", JSON.stringify(datos.administrador));
        mensaje.textContent = "";
        console.log("BIENVENIDO");
        window.location.assign("administracionEspacio.html");

    } catch (error) {
        mensaje.textContent = error instanceof Error
            ? error.message
            : "No se pudo conectar con el servidor.";
        botonIngreso.disabled = false;
    }
});
