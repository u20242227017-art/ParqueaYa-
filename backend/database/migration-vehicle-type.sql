ALTER TABLE registro_estacionamiento
    ADD COLUMN tipo_vehiculo ENUM('carro', 'moto') NULL AFTER placa;
