import { calcularCobro } from './billing';

describe('calcularCobro', () => {
  const entrada = new Date('2026-10-25T23:00:00.000Z');

  it.each([
    [1, 83],
    [5, 417],
    [10, 833],
    [15, 1250],
    [30, 2500],
    [45, 3750],
    [60, 5000],
    [61, 5083],
    [90, 7500],
    [120, 10000],
  ])('charges the correct whole-peso amount for %i minutes', (minutes, amount) => {
    const salida = new Date(entrada.getTime() + minutes * 60_000);
    expect(calcularCobro(entrada, salida, '5000.00', 0).monto).toBe(amount);
  });

  it('rounds every started minute up and rounds the total to the nearest peso', () => {
    const salida = new Date(entrada.getTime() + 60_001);
    expect(calcularCobro(entrada, salida, '5000.00', 0)).toEqual({
      duracionSegundos: 61,
      minutosCobrables: 2,
      monto: 167,
      montoDecimal: '167.00',
    });
  });

  it('uses elapsed timestamps across midnight and hour changes', () => {
    const salida = new Date('2026-10-26T00:30:00.000Z');
    expect(calcularCobro(entrada, salida, '5000.00', 0)).toEqual({
      duracionSegundos: 5400,
      minutosCobrables: 90,
      monto: 7500,
      montoDecimal: '7500.00',
    });
  });

  it('applies grace minutes after rounding up elapsed time', () => {
    const salida = new Date(entrada.getTime() + 60_001);
    expect(calcularCobro(entrada, salida, '5000.00', 2).monto).toBe(0);
  });

  it('charges zero when no time has elapsed', () => {
    expect(calcularCobro(entrada, entrada, '5000.00', 0).monto).toBe(0);
  });
});
