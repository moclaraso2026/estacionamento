import { VALORES } from '../utils/Constantes.js';

export class ClienteAvulso {
  #placa;
  #historico;

  constructor(placa) {
    if (!placa || !placa.trim()) throw new Error('Placa inválida.');
    this.#placa     = placa.trim().toUpperCase();
    this.#historico = [];
  }

  get placa()     { return this.#placa; }
  get historico() { return [...this.#historico]; }

  registrarUso(dataEntrada) {
    this.#historico.push(new Date(dataEntrada));
  }

  calcularValorBruto(ticket) {
    const entrada   = new Date(ticket.entrada);
    const saida     = new Date(ticket.saida);
    const meianoite = new Date(entrada);
    meianoite.setHours(24, 0, 0, 0);

    if (saida >= meianoite) {
      const diasExtras = Math.floor((saida - meianoite) / (1000 * 60 * 60 * 24)) + 1;
      return VALORES.DIARIA * (1 + diasExtras);
    }

    const horas = (saida - entrada) / (1000 * 60 * 60);
    return horas > VALORES.HORAS_DIARIA
      ? VALORES.DIARIA
      : Math.ceil(horas) * VALORES.VALOR_HORA;
  }

  calcularValor(ticket, Desconto) {
    const valor = this.calcularValorBruto(ticket);
    return Desconto.aplicar(this, valor, ticket.entrada);
  }
}
