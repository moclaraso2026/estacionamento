import { Cliente } from './Cliente.js';
import { VALORES } from '../utils/Constantes.js';

export class Empresa extends Cliente {
  #debito;
  #inadimplente;

  constructor(cpfOuCnpj, nome) {
    super(cpfOuCnpj, nome);
    this.#debito       = 0;
    this.#inadimplente = false;
  }

  get debito()       { return this.#debito; }
  get inadimplente() { return this.#inadimplente; }

  adicionarDebito(valor) {
    if (valor < 0) throw new Error('Valor de débito não pode ser negativo.');
    this.#debito += valor;
  }

  quitarDebito() {
    this.#debito       = 0;
    this.#inadimplente = false;
  }

  marcarInadimplente() { this.#inadimplente = true; }

  podeEntrar() { return !this.#inadimplente; }

  calcularValor(ticket) {
    const entrada   = new Date(ticket.entrada);
    const saida     = new Date(ticket.saida);
    const meianoite = new Date(entrada);
    meianoite.setHours(24, 0, 0, 0);

    let total = VALORES.DIARIA;
    if (saida >= meianoite) {
      const diasExtras = Math.floor((saida - meianoite) / (1000 * 60 * 60 * 24)) + 1;
      total += diasExtras * VALORES.MULTA_EMPRESA;
    }
    return total;
  }
}
