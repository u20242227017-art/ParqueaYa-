const statusMessage = document.getElementById("estado-admin");
const registroForm = document.getElementById("form-vehiculo");
const registrationDialog = document.querySelector(".contenedorRegistroVehivulo");
const puestoSelect = document.getElementById("puesto-registro");
const registroMessage = document.getElementById("mensaje-registro");
const adminName = document.getElementById("nombreUsuario");
const api = window.ParqueaYaApi;

const adminData = {
    puestos: [],
    registros: [],
    pagos: [],
    tarifas: [],
    cajas: [],
};

document.getElementById("mapa1").replaceChildren();
document.getElementById("mapa2").replaceChildren();
document.getElementById("tabla-registros").replaceChildren();
document.getElementById("tabla-pagos").replaceChildren();

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}

function formatDate(value) {
    if (!value) {
        return "--";
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "--"
        : date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

function formatMoney(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

function createActionButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
}

function renderMap() {
    const maps = [
        document.getElementById("mapa1"),
        document.getElementById("mapa2"),
    ];
    maps.forEach((map) => {
        map.replaceChildren();
    });

    const orderedPuestos = adminData.puestos.slice().sort(
        (left, right) => Number(left.piso) - Number(right.piso)
            || Number(left.fila) - Number(right.fila)
            || Number(left.columna) - Number(right.columna),
    );
    for (const puesto of orderedPuestos) {
        const floorIndex = Number(puesto.piso) - 1;
        if (!maps[floorIndex]) {
            continue;
        }
        let row = maps[floorIndex].querySelector(
            `[data-fila="${Number(puesto.fila)}"]`,
        );
        if (!row) {
            row = document.createElement("div");
            row.className = "fila";
            row.dataset.fila = String(puesto.fila);
            maps[floorIndex].append(row);
        }

        const state = puesto.estado === "libre"
            ? "disponible"
            : puesto.estado === "ocupado"
                ? "ocupado"
                : "fuera";
        const button = document.createElement("button");
        button.type = "button";
        button.className = `puesto ${state}`;
        const code = document.createElement("span");
        code.className = "codigo";
        code.textContent = puesto.codigo;
        const label = document.createElement("span");
        label.className = "estado";
        label.textContent = puesto.estado.replace("_", " ");
        button.append(code, label);
        if (puesto.estado === "libre") {
            button.addEventListener("click", () => {
                puestoSelect.value = String(puesto.id);
                registrationDialog.classList.remove("oculto");
                document.getElementById("placa").focus();
            });
        } else {
            button.disabled = true;
        }
        row.append(button);
    }
}

function renderPuestoOptions() {
    puestoSelect.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecciona un puesto libre";
    puestoSelect.append(placeholder);

    adminData.puestos
        .filter((puesto) => puesto.estado === "libre")
        .forEach((puesto) => {
            const option = document.createElement("option");
            option.value = String(puesto.id);
            option.textContent = `${puesto.codigo} - piso ${puesto.piso}`;
            puestoSelect.append(option);
        });
}

function renderRecords() {
    const table = document.getElementById("tabla-registros");
    table.replaceChildren();
    adminData.registros
        .slice()
        .sort((left, right) => new Date(right.horaEntrada) - new Date(left.horaEntrada))
        .forEach((registro) => {
            const row = document.createElement("tr");
            const active = !registro.horaSalida;
            const duration = registro.duracionMinutos === null
                || registro.duracionMinutos === undefined
                ? "--"
                : `${registro.duracionMinutos} min`;
            row.append(
                createCell(registro.placa),
                createCell(registro.puesto?.codigo || String(registro.puestoId)),
                createCell(formatDate(registro.horaEntrada)),
                createCell(formatDate(registro.horaSalida)),
                createCell(duration),
            );

            const stateCell = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = `badge ${active ? "activo" : "finalizado"}`;
            badge.textContent = active ? "activo" : "finalizado";
            stateCell.append(badge);
            row.append(stateCell);

            if (active) {
                const actionCell = document.createElement("td");
                actionCell.append(createActionButton("Registrar salida", () => {
                    void closeRegistration(registro);
                }));
                row.append(actionCell);
            } else {
                row.append(document.createElement("td"));
            }
            table.append(row);
        });
}

function renderPayments() {
    const table = document.getElementById("tabla-pagos");
    table.replaceChildren();
    adminData.pagos.forEach((pago) => {
        const row = document.createElement("tr");
        const state = pago.estado;
        row.append(
            createCell(pago.registro?.placa || pago.registroId),
            createCell(pago.registro?.puesto?.codigo || "--"),
            createCell(
                pago.registro?.duracionMinutos == null
                    ? "--"
                    : `${pago.registro.duracionMinutos} min`,
            ),
            createCell(formatMoney(pago.monto)),
        );

        const stateCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `badge ${state}`;
        badge.textContent = state;
        stateCell.append(badge);
        row.append(stateCell);

        const actionCell = document.createElement("td");
        if (state === "pendiente") {
            actionCell.append(createActionButton("Cobrar", () => {
                void collectPayment(pago);
            }));
        } else {
            actionCell.textContent = state === "pagado" ? "Pagado" : "--";
        }
        row.append(actionCell);
        table.append(row);
    });
}

function renderSummary() {
    const free = adminData.puestos.filter((puesto) => puesto.estado === "libre").length;
    const occupied = adminData.puestos.filter((puesto) => puesto.estado === "ocupado").length;
    document.getElementById("espaciosDisponibles").textContent = String(free);
    document.getElementById("espaciosOcupados").textContent = String(occupied);

    const today = new Date().toDateString();
    const income = adminData.pagos
        .filter((pago) => pago.estado === "pagado"
            && new Date(pago.fechaPago).toDateString() === today)
        .reduce((total, pago) => total + Number(pago.monto), 0);
    document.getElementById("IngresoDiario").textContent = formatMoney(income);

    const openShifts = adminData.cajas.filter((caja) => !caja.cierre).length;
    statusMessage.textContent = `Datos actualizados. Turnos de caja abiertos: ${openShifts}.`;
}

async function refreshDashboard() {
    statusMessage.textContent = "Cargando datos del servidor...";
    const [puestos, registros, pagos, tarifas, cajas] = await Promise.all([
        api.get("/puestos"),
        api.get("/registros"),
        api.get("/pagos"),
        api.get("/tarifas"),
        api.get("/caja"),
    ]);
    Object.assign(adminData, { puestos, registros, pagos, tarifas, cajas });
    renderMap();
    renderPuestoOptions();
    renderRecords();
    renderPayments();
    renderSummary();
}

function calcularMonto(registro) {
    const tarifa = adminData.tarifas[0];
    if (!tarifa) {
        throw new Error("No hay una tarifa configurada para calcular el cobro.");
    }
    const minutos = Math.max(
        0,
        Math.ceil((Date.now() - new Date(registro.horaEntrada).getTime()) / 60000)
            - Number(tarifa.minutosGracia),
    );
    const horasCobradas = Math.ceil(minutos / 60);
    return Math.round(horasCobradas * Number(tarifa.precioHora) * 100) / 100;
}

async function closeRegistration(registro) {
    if (!window.confirm(`¿Registrar salida para ${registro.placa}?`)) {
        return;
    }
    try {
        const pagoExistente = adminData.pagos.find(
            (pago) => String(pago.registroId) === String(registro.id),
        );
        if (!pagoExistente) {
            await api.post("/pagos", {
                registroId: String(registro.id),
                monto: calcularMonto(registro),
                metodo: "efectivo",
                estado: "pendiente",
            });
        }
        await api.patch(`/registros/${encodeURIComponent(registro.id)}`, {
            horaSalida: new Date().toISOString(),
        });
        statusMessage.textContent = `Salida registrada para ${registro.placa}. Cobro pendiente disponible en pagos.`;
        await refreshDashboard();
    } catch (error) {
        statusMessage.textContent = `No se pudo registrar la salida: ${error.message}`;
    }
}

async function collectPayment(pago) {
    const metodo = window.prompt(
        "Método de pago: efectivo, tarjeta, transferencia u otro",
        pago.metodo || "efectivo",
    );
    if (metodo === null) {
        return;
    }
    const metodosPermitidos = ["efectivo", "tarjeta", "transferencia", "otro"];
    if (!metodosPermitidos.includes(metodo.trim().toLowerCase())) {
        statusMessage.textContent = "Método inválido. Usa efectivo, tarjeta, transferencia u otro.";
        return;
    }

    try {
        await api.patch(`/pagos/${encodeURIComponent(pago.id)}`, {
            estado: "pagado",
            metodo: metodo.trim().toLowerCase(),
        });
        statusMessage.textContent = `Pago ${pago.id} registrado correctamente.`;
        await refreshDashboard();
    } catch (error) {
        statusMessage.textContent = `No se pudo registrar el pago: ${error.message}`;
    }
}

document.getElementById("botonPiso1").addEventListener("click", () => {
    document.getElementById("mapa1").classList.remove("ocultar");
    document.getElementById("mapa2").classList.add("ocultar");
});
document.getElementById("botonPiso2").addEventListener("click", () => {
    document.getElementById("mapa2").classList.remove("ocultar");
    document.getElementById("mapa1").classList.add("ocultar");
});
document.getElementById("btn-registrar-vehiculo").addEventListener("click", () => {
    registrationDialog.classList.remove("oculto");
});
document.getElementById("cancelar-modal").addEventListener("click", () => {
    registrationDialog.classList.add("oculto");
    registroMessage.textContent = "";
});
document.getElementById("cerrar-sesion").addEventListener("click", () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("administrador");
    window.location.assign("loginAdmin.html");
});

registroForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    registroMessage.textContent = "Registrando vehículo...";
    const submitButton = registroForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
        await api.post("/registros", {
            placa: document.getElementById("placa").value.trim().toUpperCase(),
            puestoId: Number(puestoSelect.value),
        });
        registroForm.reset();
        registrationDialog.classList.add("oculto");
        registroMessage.textContent = "";
        statusMessage.textContent = "Ingreso registrado correctamente.";
        await refreshDashboard();
    } catch (error) {
        registroMessage.textContent = `No se pudo registrar el vehículo: ${error.message}`;
    } finally {
        submitButton.disabled = false;
    }
});

const token = sessionStorage.getItem("access_token");
if (!token) {
    window.location.replace("loginAdmin.html");
} else {
    try {
        const administrador = JSON.parse(sessionStorage.getItem("administrador") || "{}");
        adminName.textContent = administrador.usuario || "Administrador";
    } catch {
        adminName.textContent = "Administrador";
    }
    void refreshDashboard().catch((error) => {
        statusMessage.textContent = `No se pudieron cargar los datos del panel: ${error.message}`;
    });
}
