ALTER TABLE instituciones_educativas
ADD COLUMN numero_ie VARCHAR(20) NULL AFTER codigo_modular;

UPDATE instituciones_educativas
SET numero_ie = '88227',
    nombre_ie = 'PEDRO PABLO ATUSPARIA'
WHERE id = 4;

UPDATE instituciones_educativas
SET numero_ie = '01',
    nombre_ie = 'CHIMBOTE'
WHERE id = 6;
