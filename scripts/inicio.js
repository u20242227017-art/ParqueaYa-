const tarifaInfo = document.getElementById("tarifaInfo");

window.ParqueaYaApi.get("/tarifas")
    .then((tarifas) => {
        if (!Array.isArray(tarifas) || tarifas.length === 0) {
            tarifaInfo.textContent = "Tarifa no configurada.";
            return;
        }

        const tarifa = tarifas[0];
        const precio = new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
        }).format(Number(tarifa.precioHora));
        tarifaInfo.textContent = `${precio} por hora; ${tarifa.minutosGracia} minutos de gracia.`;
    })
    .catch((error) => {
        tarifaInfo.textContent = `No se pudo cargar la tarifa: ${error.message}`;
    });
