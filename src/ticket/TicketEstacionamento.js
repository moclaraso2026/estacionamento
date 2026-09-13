export class TicketEstacionamento {
  #placa;
  #tipoCliente;
  #entrada;
  #saida;
  #valor;
  #desconto;
  #valorPago;

  constructor(placa, tipoCliente, entrada) {
    if (!placa || !placa.trim()) throw new Error('Placa inválida no ticket.');
    this.#placa       = placa.trim().toUpperCase();
    this.#tipoCliente = tipoCliente;
    this.#entrada     = entrada instanceof Date ? entrada : new Date(entrada);
    this.#saida       = null;
    this.#valor       = null;
    this.#desconto    = null;
    this.#valorPago   = null;
  }

  get placa()       { return this.#placa; }
  get tipoCliente() { return this.#tipoCliente; }
  get entrada()     { return this.#entrada; }
  get saida()       { return this.#saida; }
  get valor()       { return this.#valor; }
  get desconto()    { return this.#desconto; }
  get valorPago()   { return this.#valorPago; }
  get aberto()      { return this.#saida === null; }

  calcularTempo() {
    if (!this.#saida) return null;
    return (this.#saida - this.#entrada) / (1000 * 60 * 60);
  }

  fecharTicket(saida, valor, descontoId, valorDesconto, valorPago) {
    if (!this.aberto) throw new Error('Ticket já está fechado.');
    this.#saida     = saida instanceof Date ? saida : new Date(saida);
    this.#valor     = valor;
    this.#desconto  = { id: descontoId, valorDesconto };
    this.#valorPago = valorPago;
  }

  toString() {
    if (this.aberto) {
      return `[Ticket ABERTO] Placa: ${this.#placa} | Entrada: ${this.#entrada.toLocaleString()}`;
    }
    return [
      `[Ticket FECHADO] Placa: ${this.#placa}`,
      `Tipo: ${this.#tipoCliente}`,
      `Entrada: ${this.#entrada.toLocaleString()}`,
      `Saída: ${this.#saida.toLocaleString()}`,
      `Tempo: ${this.calcularTempo().toFixed(2)}h`,
      `Valor pago: R$ ${this.#valorPago?.toFixed(2)}`,
    ].join(' | ');
  }
}
