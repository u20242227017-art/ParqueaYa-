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

function durationMinutes(entrada, salida = new Date()) {
    const elapsed = new Date(salida).getTime() - new Date(entrada).getTime();
    return Number.isFinite(elapsed) ? Math.max(0, Math.ceil(elapsed / 60000)) : null;
}

function formatDuration(minutes) {
    if (minutes === null) {
        return "--";
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (!hours) {
        return `${remainingMinutes} min`;
    }
    if (!remainingMinutes) {
        return `${hours} h`;
    }
    return `${hours} h ${remainingMinutes} min`;
}

function getPaymentForRecord(registroId) {
    return adminData.pagos.find(
        (pago) => String(pago.registroId) === String(registroId),
    );
}

function printReceipt(pago) {
    if (pago.estado !== "pagado" || !pago.registro) {
        statusMessage.textContent = "Solo se pueden imprimir pagos confirmados.";
        return;
    }
    const receipt = window.open("about:blank", "_blank", "width=420,height=640");
    if (!receipt) {
        statusMessage.textContent = "El navegador bloqueó la ventana del recibo.";
        return;
    }

    const registro = pago.registro;
    const content = [
        ["Placa", registro.placa],
        ["Puesto", registro.puesto?.codigo || "--"],
        ["Entrada", formatDate(registro.horaEntrada)],
        ["Salida", formatDate(registro.horaSalida)],
        ["Duración", formatDuration(durationMinutes(registro.horaEntrada, registro.horaSalida))],
        ["Método de pago", pago.metodo || "--"],
        ["Total", `${formatMoney(pago.monto)} COP`],
    ];
    receipt.document.open();
    receipt.document.write(`<!doctype html>
        <html lang="es">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>ParqueaYa - Comprobante</title>
            <style>
                * { box-sizing: border-box; }
                body { margin: 0; padding: 24px; color: #172b22; font: 14px Arial, sans-serif; }
                header { padding-bottom: 16px; border-bottom: 2px solid #1b5e3b; text-align: center; }
                h1 { margin: 0 0 5px; color: #1b5e3b; font-size: 24px; }
                header p { margin: 0; color: #52635a; font-size: 12px; }
                dl { margin: 18px 0; }
                dl div { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e1e9e4; }
                dt { color: #52635a; }
                dd { margin: 0; font-weight: 700; text-align: right; }
                .total { margin-top: 8px; color: #1b5e3b; font-size: 17px; }
                footer { padding-top: 12px; color: #718078; font-size: 11px; text-align: center; }
                @media print { body { padding: 8mm; } }
            </style>
        </head>
        <body>
            <header><h1>ParqueaYa</h1><p>Sistema de Administración de Parqueaderos</p></header>
            <dl id="detalle"></dl>
            <footer>Comprobante de pago</footer>
        </body>
        </html>`);
    const details = receipt.document.getElementById("detalle");
    content.forEach(([label, value], index) => {
        const row = receipt.document.createElement("div");
        if (index === content.length - 1) {
            row.className = "total";
        }
        const term = receipt.document.createElement("dt");
        term.textContent = label;
        const description = receipt.document.createElement("dd");
        description.textContent = String(value ?? "--");
        row.append(term, description);
        details.append(row);
    });
    receipt.document.close();
    window.setTimeout(() => {
        receipt.focus();
        receipt.print();
    }, 100);
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
        button.style.gridColumn = String(Number(puesto.columna));
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
            const minutes = durationMinutes(registro.horaEntrada, registro.horaSalida || new Date());
            const payment = getPaymentForRecord(registro.id);
            row.append(
                createCell(registro.placa),
                createCell(registro.tipoVehiculo || "--"),
                createCell(registro.puesto?.codigo || String(registro.puestoId)),
                createCell(formatDate(registro.horaEntrada)),
                createCell(formatDate(registro.horaSalida)),
                createCell(formatDuration(minutes)),
                createCell(payment?.estado === "pagado" ? formatMoney(payment.monto) : "--"),
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
                    void openExitModal(registro);
                }));
                row.append(actionCell);
            } else {
                const actionCell = document.createElement("td");
                if (payment?.estado === "pagado") {
                    actionCell.append(createActionButton("Imprimir recibo", () => {
                        printReceipt(payment);
                    }));
                }
                row.append(actionCell);
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
                pago.registro?.horaEntrada
                    ? formatDuration(durationMinutes(pago.registro.horaEntrada, pago.registro.horaSalida))
                    : "--",
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
            if (state === "pagado") {
                actionCell.append(createActionButton("Imprimir recibo", () => {
                    printReceipt(pago);
                }));
            } else {
                actionCell.textContent = "--";
            }
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

let registroPendienteSalida = null;

async function openExitModal(registro) {
    const modal = document.getElementById("modal-salida");
    const message = document.getElementById("mensaje-salida");
    const confirmButton = document.getElementById("confirmar-salida");
    registroPendienteSalida = registro;
    modal.classList.remove("oculto");
    modal.setAttribute("aria-hidden", "false");
    message.textContent = "Calculando el cobro...";
    confirmButton.disabled = true;
    try {
        const quote = await api.get(`/registros/${encodeURIComponent(registro.id)}/cobro`);
        document.getElementById("salida-placa").textContent = quote.placa;
        document.getElementById("salida-puesto").textContent = quote.puesto;
        document.getElementById("salida-entrada").textContent = formatDate(quote.horaEntrada);
        document.getElementById("salida-hora").textContent = formatDate(quote.horaSalida);
        document.getElementById("salida-duracion").textContent = formatDuration(
            Math.ceil(Number(quote.duracionSegundos) / 60),
        );
        document.getElementById("salida-tarifa").textContent = `${formatMoney(quote.tarifaPrecioHora)} / hora`;
        document.getElementById("salida-total").textContent = `${formatMoney(quote.monto)} COP`;
        modal.dataset.montoConfirmado = String(quote.monto);
        confirmButton.disabled = false;
        message.textContent = "";
    } catch (error) {
        message.textContent = `No se pudo calcular el cobro: ${error.message}`;
    }
}

function closeExitModal() {
    const modal = document.getElementById("modal-salida");
    modal.classList.add("oculto");
    modal.setAttribute("aria-hidden", "true");
    document.getElementById("confirmar-salida").disabled = false;
    registroPendienteSalida = null;
}

async function confirmExit() {
    if (!registroPendienteSalida) {
        return;
    }
    const confirmButton = document.getElementById("confirmar-salida");
    const message = document.getElementById("mensaje-salida");
    confirmButton.disabled = true;
    message.textContent = "Registrando pago y salida...";
    try {
        const administrador = JSON.parse(sessionStorage.getItem("administrador") || "{}");
        if (!administrador.id) {
            throw new Error("No se pudo identificar al administrador de la sesión.");
        }
        const registro = registroPendienteSalida;
        const result = await api.patch(`/registros/${encodeURIComponent(registro.id)}`, {
            horaSalida: new Date().toISOString(),
            metodo: document.getElementById("metodo-pago-salida").value,
            administradorId: String(administrador.id),
            montoConfirmado: Number(document.getElementById("modal-salida").dataset.montoConfirmado),
        });
        const payment = result.pago || getPaymentForRecord(registro.id);
        statusMessage.textContent = `Salida registrada. Cobro confirmado: ${formatMoney(payment?.monto ?? result.cobro?.monto)}.`;
        closeExitModal();
        try {
            await refreshDashboard();
        } catch (refreshError) {
            statusMessage.textContent = `Cobro registrado, pero no se pudieron actualizar los datos: ${refreshError.message}`;
        }
    } catch (error) {
        message.textContent = error.message.includes("total cambió")
            ? "La tarifa cambió mientras confirmabas. Actualiza el resumen y confirma nuevamente."
            : `No se pudo registrar el pago y la salida: ${error.message}`;
        confirmButton.disabled = false;
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
    document.getElementById("botonPiso1").classList.add("activo");
    document.getElementById("botonPiso2").classList.remove("activo");
});
document.getElementById("botonPiso2").addEventListener("click", () => {
    document.getElementById("mapa2").classList.remove("ocultar");
    document.getElementById("mapa1").classList.add("ocultar");
    document.getElementById("botonPiso2").classList.add("activo");
    document.getElementById("botonPiso1").classList.remove("activo");
});
document.getElementById("botonPiso1").classList.add("activo");
document.getElementById("btn-registrar-vehiculo").addEventListener("click", () => {
    registrationDialog.classList.remove("oculto");
});
document.getElementById("cancelar-modal").addEventListener("click", () => {
    registrationDialog.classList.add("oculto");
    registroMessage.textContent = "";
});
document.getElementById("cancelar-salida").addEventListener("click", closeExitModal);
document.getElementById("confirmar-salida").addEventListener("click", () => {
    void confirmExit();
});
document.getElementById("cerrar-sesion").addEventListener("click", () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("administrador");
    window.location.assign("loginAdmin.html");
});

const plateInput = document.getElementById("placa");
const vehicleTypeSelect = document.getElementById("tipo-vehiculo");

function validateVehiclePlate() {
    const plate = plateInput.value.trim().toUpperCase();
    plateInput.value = plate;

    if (plate.length !== 6) {
        plateInput.setCustomValidity("La placa debe tener exactamente 6 caracteres.");
        return false;
    }

    const platePattern = vehicleTypeSelect.value === "carro"
        ? /^[A-Z]{3}\d{3}$/
        : vehicleTypeSelect.value === "moto"
            ? /^[A-Z]{3}\d{2}[A-Z]$/
            : null;

    if (!platePattern) {
        plateInput.setCustomValidity("Selecciona si el vehículo es carro o moto.");
        return false;
    }

    if (!platePattern.test(plate)) {
        plateInput.setCustomValidity(
            vehicleTypeSelect.value === "carro"
                ? "Para carro, la placa debe tener 3 letras seguidas de 3 números (ABC123)."
                : "Para moto, la placa debe tener 3 letras, 2 números y una letra (ABC12D).",
        );
        return false;
    }

    plateInput.setCustomValidity("");
    return true;
}

plateInput.addEventListener("input", validateVehiclePlate);
vehicleTypeSelect.addEventListener("change", validateVehiclePlate);
plateInput.addEventListener("blur", validateVehiclePlate);

registroForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    validateVehiclePlate();
    if (!registroForm.reportValidity()) {
        return;
    }
    registroMessage.textContent = "Registrando vehículo...";
    const submitButton = registroForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
        await api.post("/registros", {
            placa: plateInput.value,
            tipoVehiculo: vehicleTypeSelect.value,
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
