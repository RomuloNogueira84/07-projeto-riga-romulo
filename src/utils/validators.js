// Função para validar CPF
function isValidCPF(cpf) {
  if (typeof cpf !== 'string') return false;
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

  const cpfDigits = cpf.split('').map(el => +el);

  const T = (digits) => {
    let c = digits.reduce((soma, el, i) => soma + el * (digits.length + 1 - i), 0);
    let rest = ((c * 10) % 11) % 10;
    return rest;
  };

  return T(cpfDigits.slice(0, 9)) === cpfDigits[9] && T(cpfDigits.slice(0, 10)) === cpfDigits[10];
}

module.exports = { isValidCPF };