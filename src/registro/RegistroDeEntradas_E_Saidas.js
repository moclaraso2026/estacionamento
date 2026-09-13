import { TicketEstacionamento } from '../ticket/TicketEstacionamento.js';
import { ClienteAvulso }        from '../clientes/ClienteAvulso.js';
import { Desconto }             from '../utils/Desconto.js';
import { Professor }            from '../clientes/Professor.js';
import { Estudante }            from '../clientes/Estudante.js';
import { Empresa }              from '../clientes/Empresa.js';
import { CAPACIDADE_VAGAS }     from '../utils/Constantes.js';

export class RegistroDeEntradas_E_Saidas {
  #registros;
  #ativos;
  #avulsos;
  #cadastro;

  constructor(cadastroClientes) {
    this.#registros = new Map();
    this.#ativos    = new Map();
    this.#avulsos   = new Map();
    this.#cadastro  = cadastroClientes;
  }

  autorizarEntrada(placa) {
    placa = placa.trim().toUpperCase();
    if (this.#ativos.has(placa))
      return { autorizado: false, motivo: 'Veículo já está no estacionamento.' };
    if (this.#cadastro.estaBloqueado(placa))
      return { autorizado: false, motivo: 'Placa bloqueada.' };
    if (this.#ativos.size >= CAPACIDADE_VAGAS)
      return { autorizado: false, motivo: 'Estacionamento lotado.' };

    const cliente = this.#cadastro.buscarPorPlaca(placa);
    if (cliente instanceof Professor && !cliente.podeEntrar(placa))
      return { autorizado: false, motivo: 'Professor já possui veículo estacionado.' };
    if (cliente instanceof Estudante && !cliente.podeEntrar())
      return { autorizado: false, motivo: 'Estudante com saldo negativo.' };
    if (cliente instanceof Empresa && !cliente.podeEntrar())
      return { autorizado: false, motivo: 'Empresa inadimplente.' };

    return { autorizado: true, motivo: null };
  }

  registrarEntrada(placa, dataHora = new Date()) {
    placa = placa.trim().toUpperCase();
    const auth = this.autorizarEntrada(placa);
    if (!auth.autorizado) throw new Error(auth.motivo);

    const cliente = this.#cadastro.buscarPorPlaca(placa);
    const tipo = cliente instanceof Professor ? 'Professor'
               : cliente instanceof Estudante ? 'Estudante'
               : cliente instanceof Empresa   ? 'Empresa'
               : 'Avulso';

    const ticket = new TicketEstacionamento(placa, tipo, dataHora);
    if (!this.#registros.has(placa)) this.#registros.set(placa, []);
    this.#registros.get(placa).push(ticket);
    this.#ativos.set(placa, ticket);

    if (cliente instanceof Professor) {
      cliente.entrar(placa);
    } else if (tipo === 'Avulso') {
      if (!this.#avulsos.has(placa)) this.#avulsos.set(placa, new ClienteAvulso(placa));
      this.#avulsos.get(placa).registrarUso(dataHora);
      Desconto.registrarEntrada(placa, dataHora);
    }

    return ticket;
  }

  registrarSaida(placa, dataHora = new Date(), recusouPagamento = false) {
    placa = placa.trim().toUpperCase();
    const ticket = this.#ativos.get(placa);
    if (!ticket) throw new Error('Nenhum registro de entrada encontrado para essa placa.');

    const cliente  = this.#cadastro.buscarPorPlaca(placa);
    const cobranca = this.calcularCobranca(ticket, cliente, dataHora);

    ticket.fecharTicket(
      dataHora,
      cobranca.valor,
      cobranca.descontoId,
      cobranca.valorDesconto,
      cobranca.valorPago
    );

    this.#ativos.delete(placa);

    if (cliente instanceof Professor)     cliente.sair();
    else if (cliente instanceof Estudante) cliente.debitarSaldo(cobranca.valorPago);
    else if (cliente instanceof Empresa)   cliente.adicionarDebito(cobranca.valorPago);
    else if (recusouPagamento)             this.#cadastro.bloquearPlaca(placa);

    return ticket;
  }

  calcularCobranca(ticket, cliente, saida) {
    const ticketComSaida = {
      entrada: ticket.entrada,
      saida:   saida instanceof Date ? saida : new Date(saida),
    };

    if (cliente) {
      const valor = cliente.calcularValor(ticketComSaida);
      return { valor, descontoId: 'nenhum', valorDesconto: 0, valorPago: valor };
    }

    const avulso = this.#avulsos.get(ticket.placa) ?? new ClienteAvulso(ticket.placa);
    return avulso.calcularValor(ticketComSaida, Desconto);
  }

  buscarRegistrosPorPlaca(placa) {
    return this.#registros.get(placa.toUpperCase()) ?? [];
  }

  buscarRegistrosPorCliente(cpfOuCnpj, inicio, fim) {
    const cliente = this.#cadastro.buscarCliente(cpfOuCnpj);
    if (!cliente) return [];
    const resultado = [];
    for (const placa of cliente.listarPlacas()) {
      const tickets = this.buscarRegistrosPorPlaca(placa).filter(t => {
        const entrada = new Date(t.entrada);
        return entrada >= new Date(inicio) && entrada <= new Date(fim);
      });
      resultado.push(...tickets);
    }
    return resultado;
  }

  importarTicket({ placa, tipoCliente, entrada, saida, valor, descontoId, valorDesconto, valorPago }) {
    placa = placa.trim().toUpperCase();
    const ticket = new TicketEstacionamento(placa, tipoCliente, entrada);
    if (!this.#registros.has(placa)) this.#registros.set(placa, []);
    if (saida) {
      ticket.fecharTicket(saida, valor, descontoId, valorDesconto, valorPago);
    } else {
      this.#ativos.set(placa, ticket);
    }
    this.#registros.get(placa).push(ticket);
  }

  get todosRegistros() {
    const todos = [];
    for (const tickets of this.#registros.values()) todos.push(...tickets);
    return todos;
  }

  get registrosAtivos() { return [...this.#ativos.values()]; }
  get vagasOcupadas()   { return this.#ativos.size; }
}
