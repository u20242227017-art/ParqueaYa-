(function () {
    const defaultUrl = window.location.port === "3000"
        ? window.location.origin
        : "http://localhost:3000";
    const baseUrl = (window.PARQUEAYA_API_URL || defaultUrl).replace(/\/+$/, "");

    async function request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        headers.set("Accept", "application/json");

        if (options.body !== undefined) {
            headers.set("Content-Type", "application/json");
        }

        const token = sessionStorage.getItem("access_token");
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        let response;
        try {
            response = await fetch(`${baseUrl}${path}`, {
                ...options,
                headers,
            });
        } catch {
            throw new Error(`No se pudo conectar con la API en ${baseUrl}.`);
        }

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const detail = Array.isArray(data?.message)
                ? data.message.join(", ")
                : data?.message || data?.error || `Error HTTP ${response.status}`;
            throw new Error(detail);
        }

        return data;
    }

    window.ParqueaYaApi = {
        baseUrl,
        get: (path) => request(path),
        post: (path, body) => request(path, {
            method: "POST",
            body: JSON.stringify(body),
        }),
        patch: (path, body) => request(path, {
            method: "PATCH",
            body: JSON.stringify(body),
        }),
    };
})();
