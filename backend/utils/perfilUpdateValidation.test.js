const test = require('node:test');
const assert = require('node:assert/strict');
const { validateDirectorProfileUpdate } = require('./perfilUpdateValidation');

test('acepta un payload válido para director', () => {
  const result = validateDirectorProfileUpdate({
    dni: '12345678',
    celular: '987654321',
    email: 'director@ugel.edu.pe',
    ruc: '20123456789'
  });

  assert.deepEqual(result, {
    dni: '12345678',
    celular: '987654321',
    email: 'director@ugel.edu.pe',
    ruc: '20123456789'
  });
});

test('rechaza un DNI con longitud inválida', () => {
  assert.throws(() => validateDirectorProfileUpdate({ dni: '12345' }), /DNI/);
});

test('rechaza un celular con longitud inválida', () => {
  assert.throws(() => validateDirectorProfileUpdate({ celular: '123' }), /celular/i);
});

test('rechaza un correo inválido', () => {
  assert.throws(() => validateDirectorProfileUpdate({ email: 'correo' }), /correo/i);
});

test('rechaza un RUC con longitud inválida', () => {
  assert.throws(() => validateDirectorProfileUpdate({ ruc: '123' }), /RUC/i);
});

test('acepta RUC vacio como dato opcional', () => {
  const result = validateDirectorProfileUpdate({
    dni: '12345678',
    celular: '987654321',
    email: 'director@ugel.edu.pe',
    ruc: ''
  });

  assert.equal(result.ruc, null);
});
