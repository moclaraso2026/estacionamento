import { Cliente } from './Cliente.js';
import { VALORES } from '../utils/Constantes.js';

export class Estudante extends Cliente {
  #saldo;
  static MAX_PLACAS = 1;

  constructor(cpfOuCnpj, nome) {
    super(cpfOuCnpj, nome);
    this.#saldo = 0;
  }

  get saldo() { return this.#saldo; }

  adicionarPlaca(placa) {
    if (this.listarPlacas().length >= Estudante.MAX_PLACAS) {
      throw new Error('Estudante pode cadastrar apenas 1 veículo.');
    }
    super.adicionarPlaca(placa);
  }

  carregarSaldo(valor) {
    if (valor <= 0) throw new Error('Valor de recarga deve ser positivo.');
    this.#saldo += valor;
  }

  debitarSaldo(valor) { this.#saldo -= valor; }

  podeEntrar() { return this.#saldo >= 0; }

  calcularValor(ticket) {
    const entrada   = new Date(ticket.entrada);
    const saida     = new Date(ticket.saida);
    const meianoite = new Date(entrada);
    meianoite.setHours(24, 0, 0, 0);
    return saida >= meianoite ? VALORES.INGRESSO * 2 : VALORES.INGRESSO;
  }
}
