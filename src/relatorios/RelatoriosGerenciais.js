import { Professor } from '../clientes/Professor.js';
import { Estudante } from '../clientes/Estudante.js';
import { Empresa }   from '../clientes/Empresa.js';

export class RelatoriosGerenciais {
  #cadastro;
  #registro;

  constructor(cadastroClientes, registroEntradas) {
    this.#cadastro = cadastroClientes;
    this.#registro = registroEntradas;
  }

  relatorio(cpfOuCnpj) {
    const cliente = this.#cadastro.buscarCliente(cpfOuCnpj);
    if (!cliente) throw new Error('Cliente não encontrado.');

    const ativos = this.#registro.registrosAtivos
      .filter(t => cliente.temPlaca(t.placa))
      .map(t => t.placa);

    const info = {
      nome:           cliente.nome,
      cpfOuCnpj:      cliente.cpfOuCnpj,
      tipo:           cliente.constructor.name,
      placas:         cliente.listarPlacas(),
      veiculosAtivos: ativos,
    };

    if (cliente instanceof Estudante) info.saldo  = cliente.saldo;
    if (cliente instanceof Empresa)   info.debito = cliente.debito;
    return info;
  }

  arrecadacao(inicio, fim, categoria = null) {
    const ini  = new Date(inicio);
    const fim_ = new Date(fim);
    fim_.setHours(23, 59, 59, 999);

    const tickets = this.#registro.todosRegistros.filter(t => {
      if (t.aberto) return false;
      const entrada = new Date(t.entrada);
      if (entrada < ini || entrada > fim_) return false;
      if (categoria && t.tipoCliente !== categoria) return false;
      return true;
    });

    const total = tickets.reduce((acc, t) => acc + (t.valorPago ?? 0), 0);
    const porCategoria = {};
    for (const t of tickets) {
      porCategoria[t.tipoCliente] = (porCategoria[t.tipoCliente] ?? 0) + (t.valorPago ?? 0);
    }
    return { total, quantidade: tickets.length, porCategoria };
  }

  registrosCadastrado(cpfOuCnpj, inicio, fim) {
    const cliente = this.#cadastro.buscarCliente(cpfOuCnpj);
    if (!cliente) throw new Error('Cliente não encontrado.');

    const ini  = new Date(inicio);
    const fim_ = new Date(fim);
    fim_.setHours(23, 59, 59, 999);

    const tickets = [];
    for (const placa of cliente.listarPlacas()) {
      const porPlaca = this.#registro.buscarRegistrosPorPlaca(placa).filter(t => {
        const entrada = new Date(t.entrada);
        return entrada >= ini && entrada <= fim_;
      });
      tickets.push(...porPlaca);
    }
    tickets.sort((a, b) => new Date(a.entrada) - new Date(b.entrada));
    return { cliente: cliente.nome, cpfOuCnpj, tickets };
  }

  registrosAvulso(placa, inicio, fim) {
    const ini  = new Date(inicio);
    const fim_ = new Date(fim);
    fim_.setHours(23, 59, 59, 999);

    const tickets = this.#registro.buscarRegistrosPorPlaca(placa).filter(t => {
      if (t.tipoCliente !== 'Avulso') return false;
      const entrada = new Date(t.entrada);
      return entrada >= ini && entrada <= fim_;
    });
    tickets.sort((a, b) => new Date(a.entrada) - new Date(b.entrada));
    return { placa: placa.toUpperCase(), tickets };
  }

  inadimplentes() {
    const avulsosBloqueados = this.#cadastro.listarBloqueados().map(placa => ({
      tipo: 'Avulso', placa,
    }));
    const empresasInadimplentes = this.#cadastro.listarClientes()
      .filter(c => c instanceof Empresa && c.inadimplente)
      .map(c => ({ tipo: 'Empresa', nome: c.nome, cnpj: c.cpfOuCnpj, debito: c.debito }));
    const estudantesBloqueados = this.#cadastro.listarClientes()
      .filter(c => c instanceof Estudante && c.saldo < 0)
      .map(c => ({ tipo: 'Estudante', nome: c.nome, cpf: c.cpfOuCnpj, saldo: c.saldo }));
    return { avulsosBloqueados, empresasInadimplentes, estudantesBloqueados };
  }

  top10Frequentes(ano) {
    const ini = new Date(`${ano}-01-01T00:00:00`);
    const fim = new Date(`${ano}-12-31T23:59:59`);
    const contagem = new Map();

    for (const t of this.#registro.todosRegistros) {
      const entrada = new Date(t.entrada);
      if (entrada < ini || entrada > fim) continue;
      const placa = t.placa;
      if (!contagem.has(placa)) {
        const cliente = this.#cadastro.buscarPorPlaca(placa);
        contagem.set(placa, { placa, usos: 0, nome: cliente?.nome ?? 'Avulso' });
      }
      contagem.get(placa).usos++;
    }

    return [...contagem.values()]
      .sort((a, b) => b.usos - a.usos)
      .slice(0, 10);
  }
}
