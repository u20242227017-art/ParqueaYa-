const botonPisoUno = document.getElementById("piso1");
const botonPisoDos = document.getElementById("piso2");
const mapa1 = document.getElementById("mapa1");
const mapa2 = document.getElementById("mapa2");
const estadoMapa = document.getElementById("estado-mapa");
const codigoPuesto = document.getElementById("codigo-reserva");
const resultadoConsulta = document.getElementById("resultado-consulta");
const formConsulta = document.getElementById("form-consulta-puesto");
const modalConsulta = document.getElementById("modal-consulta");
const detalleModal = document.getElementById("detalle-modal-consulta");
const botonConsultar = formConsulta.querySelector(".btn-consultar");

let puestosCargados = [];

function cambiarPiso(piso) {
    const mostrarPrimerPiso = piso === 1;
    mapa1.classList.toggle("oculto", !mostrarPrimerPiso);
    mapa2.classList.toggle("oculto", mostrarPrimerPiso);
    botonPisoUno.classList.toggle("activo", mostrarPrimerPiso);
    botonPisoDos.classList.toggle("activo", !mostrarPrimerPiso);
}

function actualizarMapa(puestos) {
    const puestosPorCodigo = new Map(
        puestos.map((puesto) => [String(puesto.codigo).toUpperCase(), puesto]),
    );

    document.querySelectorAll(".espacio").forEach((elemento) => {
        const codigo = elemento.querySelector("strong")?.textContent.trim().toUpperCase();
        const puesto = puestosPorCodigo.get(codigo);
        const estado = elemento.querySelector("span");
        elemento.classList.remove("disponible", "ocupado", "fuera");

        if (!puesto) {
            estado.textContent = "No registrado";
            elemento.classList.add("fuera");
            return;
        }

        const textoEstado = puesto.estado === "libre"
            ? "disponible"
            : puesto.estado === "ocupado"
                ? "ocupado"
                : "fuera de servicio";
        estado.textContent = textoEstado;
        elemento.classList.add(
            puesto.estado === "libre"
                ? "disponible"
                : puesto.estado === "ocupado"
                    ? "ocupado"
                    : "fuera",
        );
        elemento.dataset.codigo = puesto.codigo;
    });

    const disponibles = puestos.filter((puesto) => puesto.estado === "libre").length;
    estadoMapa.textContent = `${disponibles} de ${puestos.length} puestos disponibles.`;
}

async function cargarPuestos() {
    estadoMapa.textContent = "Cargando disponibilidad...";
    document.querySelectorAll(".espacio span").forEach((span) => {
        span.textContent = "cargando...";
    });
    try {
        puestosCargados = await window.ParqueaYaApi.get("/puestos");
        if (!Array.isArray(puestosCargados)) {
            throw new Error("La API devolvió una respuesta de puestos inválida.");
        }
        actualizarMapa(puestosCargados);
    } catch (error) {
        estadoMapa.textContent = `No se pudo cargar la disponibilidad: ${error.message}`;
        document.querySelectorAll(".espacio span").forEach((span) => {
            span.textContent = "sin conexión";
        });
    }
}

function mostrarModalConsulta(title, details, status = "informacion") {
    resultadoConsulta.textContent = "";
    document.getElementById("titulo-modal-consulta").textContent = title;
    detalleModal.replaceChildren();

    for (const [label, value] of details) {
        const item = document.createElement("p");
        const name = document.createElement("strong");
        name.textContent = `${label}: `;
        item.append(name, document.createTextNode(value));
        detalleModal.append(item);
    }

    detalleModal.dataset.estado = status;
    modalConsulta.classList.remove("oculto");
    modalConsulta.setAttribute("aria-hidden", "false");
    document.getElementById("cerrar-modal-consulta").focus();
}

function cerrarModalConsulta() {
    modalConsulta.classList.add("oculto");
    modalConsulta.setAttribute("aria-hidden", "true");
}

function formatMoney(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDuration(minutes) {
    if (minutes < 1) {
        return "Menos de 1 minuto";
    }

    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const remainingMinutes = minutes % 60;
    const parts = [];
    if (days) {
        parts.push(`${days} ${days === 1 ? "día" : "días"}`);
    }
    if (hours) {
        parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
    }
    if (remainingMinutes) {
        parts.push(`${remainingMinutes} ${remainingMinutes === 1 ? "minuto" : "minutos"}`);
    }
    return parts.join(" ");
}

function calcularCobroActual(horaEntrada, tarifa) {
    const entrada = new Date(horaEntrada).getTime();
    if (Number.isNaN(entrada)) {
        throw new Error("No se pudo determinar la hora de ingreso del vehículo.");
    }
    if (!tarifa) {
        throw new Error("No hay una tarifa configurada para calcular el cobro.");
    }

    const minutosTranscurridos = Math.max(
        0,
        Math.ceil((Date.now() - entrada) / 60000),
    );
    const minutosCobrables = Math.max(
        0,
        minutosTranscurridos - Number(tarifa.minutosGracia),
    );
    const horasCobradas = Math.ceil(minutosCobrables / 60);
    return {
        minutosTranscurridos,
        monto: Math.round(
            horasCobradas * Number(tarifa.precioHora) * 100,
        ) / 100,
    };
}

async function consultarPuesto() {
    const codigo = codigoPuesto.value.trim().toUpperCase();
    if (!codigo) {
        codigoPuesto.focus();
        return;
    }

    resultadoConsulta.textContent = "Consultando puesto...";
    botonConsultar.disabled = true;
    try {
        const [puestos, registros, tarifas] = await Promise.all([
            window.ParqueaYaApi.get("/puestos"),
            window.ParqueaYaApi.get("/registros"),
            window.ParqueaYaApi.get("/tarifas"),
        ]);
        if (!Array.isArray(puestos) || !Array.isArray(registros) || !Array.isArray(tarifas)) {
            throw new Error("La API devolvió datos inválidos para la consulta.");
        }
        puestosCargados = puestos;
        actualizarMapa(puestos);

        const puesto = puestos.find(
            (elemento) => String(elemento.codigo).toUpperCase() === codigo,
        );
        if (!puesto) {
            mostrarModalConsulta("Puesto no encontrado", [
                ["Código consultado", codigo],
                ["Resultado", "No existe un puesto con ese código."],
            ], "error");
            return;
        }

        if (puesto.estado === "libre") {
            mostrarModalConsulta(`Puesto ${puesto.codigo}`, [
                ["Estado", "Disponible"],
                ["Piso", String(puesto.piso)],
            ], "disponible");
            return;
        }

        if (puesto.estado !== "ocupado") {
            mostrarModalConsulta(`Puesto ${puesto.codigo}`, [
                ["Estado", "Fuera de servicio"],
                ["Piso", String(puesto.piso)],
            ], "fuera");
            return;
        }

        const registroActivo = registros
            .filter((registro) =>
                !registro.horaSalida
                && String(registro.puestoId ?? registro.puesto?.id) === String(puesto.id),
            )
            .sort((left, right) =>
                new Date(right.horaEntrada).getTime() - new Date(left.horaEntrada).getTime(),
            )[0];

        if (!registroActivo) {
            mostrarModalConsulta(`Puesto ${puesto.codigo}`, [
                ["Estado", "Ocupado"],
                ["Información", "No se encontró un registro activo para este puesto."],
            ], "error");
            return;
        }

        const tarifa = tarifas[0];
        const cobro = calcularCobroActual(registroActivo.horaEntrada, tarifa);
        mostrarModalConsulta(`Puesto ${puesto.codigo}`, [
            ["Estado", "Ocupado"],
            ["Placa", registroActivo.placa],
            ["Tiempo estacionado", formatDuration(cobro.minutosTranscurridos)],
            ["Cobro estimado a la fecha", formatMoney(cobro.monto)],
        ], "ocupado");
    } catch (error) {
        const detail = error instanceof Error
            ? error.message
            : "No se pudo consultar el puesto.";
        resultadoConsulta.textContent = detail;
        mostrarModalConsulta("No se pudo completar la consulta", [
            ["Detalle", detail],
        ], "error");
    } finally {
        botonConsultar.disabled = false;
    }
}

botonPisoUno.addEventListener("click", () => cambiarPiso(1));
botonPisoDos.addEventListener("click", () => cambiarPiso(2));
formConsulta.addEventListener("submit", (event) => {
    event.preventDefault();
    void consultarPuesto();
});
document.querySelectorAll(".espacio").forEach((elemento) => {
    elemento.addEventListener("click", () => {
        const codigo = elemento.dataset.codigo;
        if (codigo) {
            codigoPuesto.value = codigo;
            void consultarPuesto();
        }
    });
});
document.getElementById("cerrar-modal-consulta").addEventListener("click", cerrarModalConsulta);
document.getElementById("aceptar-modal-consulta").addEventListener("click", cerrarModalConsulta);
modalConsulta.addEventListener("click", (event) => {
    if (event.target === modalConsulta) {
        cerrarModalConsulta();
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalConsulta.classList.contains("oculto")) {
        cerrarModalConsulta();
    }
});

cambiarPiso(1);
void cargarPuestos();
