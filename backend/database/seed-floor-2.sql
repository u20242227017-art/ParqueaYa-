START TRANSACTION;

INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'D1', 2, 1, 1, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'D1');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'D2', 2, 1, 2, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'D2');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'D3', 2, 1, 3, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'D3');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'D4', 2, 1, 4, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'D4');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'D5', 2, 1, 5, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'D5');

INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'E1', 2, 2, 1, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'E1');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'E2', 2, 2, 2, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'E2');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'E3', 2, 2, 3, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'E3');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'E4', 2, 2, 4, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'E4');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'E5', 2, 2, 5, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'E5');

INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'F1', 2, 3, 1, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'F1');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'F2', 2, 3, 2, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'F2');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'F3', 2, 3, 3, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'F3');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'F4', 2, 3, 4, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'F4');
INSERT INTO puesto (codigo, piso, fila, columna, estado)
SELECT 'F5', 2, 3, 5, 'libre'
WHERE NOT EXISTS (SELECT 1 FROM puesto WHERE codigo = 'F5');

COMMIT;
