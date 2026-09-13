import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Professor } from '../clientes/Professor.js';
import { Estudante } from '../clientes/Estudante.js';
import { Empresa }   from '../clientes/Empresa.js';

const ARQUIVO_CLIENTES  = './data/clientes.csv';
const ARQUIVO_REGISTROS = './data/registros.csv';

export class PersistenciaCSV {

  static carregarClientes(cadastro) {
    if (!existsSync(ARQUIVO_CLIENTES)) return;
    const linhas = readFileSync(ARQUIVO_CLIENTES, 'utf-8')
      .split('\n').filter(l => l.trim() && !l.startsWith('tipo'));

    for (const linha of linhas) {
      try {
        const [tipo, cpfOuCnpj, nome, placasStr, saldo, debito, inadimplente] = linha.split(';');
        let cliente;
        if (tipo === 'Professor') {
          cliente = new Professor(cpfOuCnpj, nome);
        } else if (tipo === 'Estudante') {
          cliente = new Estudante(cpfOuCnpj, nome);
          if (saldo) cliente.carregarSaldo(parseFloat(saldo));
        } else if (tipo === 'Empresa') {
          cliente = new Empresa(cpfOuCnpj, nome);
          if (debito && parseFloat(debito) > 0) cliente.adicionarDebito(parseFloat(debito));
          if (inadimplente?.trim() === 'true') cliente.marcarInadimplente();
        } else continue;

        for (const placa of (placasStr ?? '').split(',').filter(Boolean)) {
          cliente.adicionarPlaca(placa.trim());
        }
        cadastro.cadastrar(cliente);
      } catch (_) { /* ignora linha inválida */ }
    }
  }

  static salvarClientes(cadastro) {
    const linhas = ['tipo;cpfOuCnpj;nome;placas;saldo;debito;inadimplente'];
    for (const c of cadastro.listarClientes()) {
      const placas = c.listarPlacas().join(',');
      const saldo  = c instanceof Estudante ? c.saldo  : '';
      const debito = c instanceof Empresa   ? c.debito : '';
      const inad   = c instanceof Empresa   ? c.inadimplente : '';
      linhas.push(`${c.constructor.name};${c.cpfOuCnpj};${c.nome};${placas};${saldo};${debito};${inad}`);
    }
    writeFileSync(ARQUIVO_CLIENTES, linhas.join('\n'), 'utf-8');
  }

  static carregarRegistros(registro) {
    if (!existsSync(ARQUIVO_REGISTROS)) return;
    const linhas = readFileSync(ARQUIVO_REGISTROS, 'utf-8')
      .split('\n').filter(l => l.trim() && !l.startsWith('placa'));

    for (const linha of linhas) {
      try {
        const [placa, tipoCliente, entrada, saida, valor, descontoId, valorDesconto, valorPago] = linha.split(';');
        registro.importarTicket({
          placa,
          tipoCliente,
          entrada:       new Date(entrada),
          saida:         saida ? new Date(saida) : null,
          valor:         valor ? parseFloat(valor) : null,
          descontoId:    descontoId || 'nenhum',
          valorDesconto: valorDesconto ? parseFloat(valorDesconto) : 0,
          valorPago:     valorPago ? parseFloat(valorPago) : null,
        });
      } catch (_) { /* ignora linha inválida */ }
    }
  }

  static salvarRegistros(registro) {
    const linhas = ['placa;tipoCliente;entrada;saida;valor;descontoId;valorDesconto;valorPago'];
    for (const t of registro.todosRegistros) {
      linhas.push([
        t.placa,
        t.tipoCliente,
        t.entrada.toISOString(),
        t.saida  ? t.saida.toISOString() : '',
        t.valor  ?? '',
        t.desconto?.id ?? 'nenhum',
        t.desconto?.valorDesconto ?? 0,
        t.valorPago ?? '',
      ].join(';'));
    }
    writeFileSync(ARQUIVO_REGISTROS, linhas.join('\n'), 'utf-8');
  }
}
