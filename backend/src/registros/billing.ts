export interface BillingCalculation {
  duracionSegundos: number;
  minutosCobrables: number;
  monto: number;
  montoDecimal: string;
}

export function calcularCobro(
  horaEntrada: Date | string,
  horaSalida: Date | string,
  precioHora: string | number,
  minutosGracia: number,
): BillingCalculation {
  const entrada = new Date(horaEntrada).getTime();
  const salida = new Date(horaSalida).getTime();
  if (!Number.isFinite(entrada) || !Number.isFinite(salida)) {
    throw new Error('Las fechas de entrada y salida deben ser válidas.');
  }
  if (!Number.isInteger(minutosGracia) || minutosGracia < 0) {
    throw new Error('Los minutos de gracia deben ser un entero no negativo.');
  }

  const price = String(precioHora);
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(price);
  if (!match) {
    throw new Error('El precio por hora debe tener como máximo dos decimales.');
  }

  const priceInCents =
    BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0') || '0');
  const duracionSegundos = Math.max(0, Math.ceil((salida - entrada) / 1000));
  const minutosTranscurridos = Math.ceil(duracionSegundos / 60);
  const minutosCobrables = Math.max(0, minutosTranscurridos - minutosGracia);
  const monto =
    (priceInCents * BigInt(minutosCobrables) + 3000n) / 6000n;

  return {
    duracionSegundos,
    minutosCobrables,
    monto: Number(monto),
    montoDecimal: `${monto.toString()}.00`,
  };
}
