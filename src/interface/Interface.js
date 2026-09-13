import * as readline from 'readline';
import { Professor } from '../clientes/Professor.js';
import { Estudante } from '../clientes/Estudante.js';
import { Empresa }   from '../clientes/Empresa.js';

export class Interface {
  #cadastro;
  #registro;
  #relatorios;
  #salvar;
  #rl;

  constructor(cadastro, registro, relatorios, salvar) {
    this.#cadastro   = cadastro;
    this.#registro   = registro;
    this.#relatorios = relatorios;
    this.#salvar     = salvar;
    this.#rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  #pergunta(texto) {
    return new Promise(res => this.#rl.question(texto, res));
  }

  async iniciar() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   Sistema de Controle de Estacionamento  ║');
    console.log('╚══════════════════════════════════════════╝');
    await this.#menuPrincipal();
  }

  async #menuPrincipal() {
    while (true) {
      console.log(`
┌─────────────────────────────────┐
│           MENU PRINCIPAL        │
├─────────────────────────────────┤
│ 1. Cadastro de clientes         │
│ 2. Entrada de veículo           │
│ 3. Saída de veículo             │
│ 4. Relatórios                   │
│ 5. Salvar e sair                │
└─────────────────────────────────┘`);

      const op = (await this.#pergunta('Escolha uma opção: ')).trim();
      if      (op === '1') await this.#menuCadastro();
      else if (op === '2') await this.#menuEntrada();
      else if (op === '3') await this.#menuSaida();
      else if (op === '4') await this.#menuRelatorios();
      else if (op === '5') { await this.#sair(); break; }
      else console.log('❌ Opção inválida.');
    }
  }

  async #menuCadastro() {
    console.log(`
┌─────────────────────────────────┐
│           CADASTRO              │
├─────────────────────────────────┤
│ 1. Cadastrar cliente            │
│ 2. Adicionar placa a cliente    │
│ 3. Remover placa de cliente     │
│ 4. Consultar cliente            │
│ 0. Voltar                       │
└─────────────────────────────────┘`);

    const op = (await this.#pergunta('Escolha: ')).trim();

    if (op === '1') {
      console.log('Tipos: Professor | Estudante | Empresa');
      const tipo      = (await this.#pergunta('Tipo: ')).trim();
      const cpfOuCnpj = (await this.#pergunta('CPF/CNPJ: ')).trim();
      const nome      = (await this.#pergunta('Nome: ')).trim();
      try {
        let cliente;
        if (tipo === 'Professor')      cliente = new Professor(cpfOuCnpj, nome);
        else if (tipo === 'Estudante') cliente = new Estudante(cpfOuCnpj, nome);
        else if (tipo === 'Empresa')   cliente = new Empresa(cpfOuCnpj, nome);
        else { console.log('❌ Tipo inválido.'); return; }

        if (tipo === 'Estudante') {
          const saldo = parseFloat(await this.#pergunta('Saldo inicial (R$): '));
          if (!isNaN(saldo) && saldo > 0) cliente.carregarSaldo(saldo);
        }
        this.#cadastro.cadastrar(cliente);
        console.log(`✅ ${tipo} "${nome}" cadastrado com sucesso.`);
      } catch (e) { console.log(`❌ ${e.message}`); }

    } else if (op === '2') {
      const cpfOuCnpj = (await this.#pergunta('CPF/CNPJ do cliente: ')).trim();
      const placa     = (await this.#pergunta('Placa: ')).trim();
      try {
        this.#cadastro.adicionarPlaca(cpfOuCnpj, placa);
        console.log(`✅ Placa ${placa.toUpperCase()} adicionada.`);
      } catch (e) { console.log(`❌ ${e.message}`); }

    } else if (op === '3') {
      const cpfOuCnpj = (await this.#pergunta('CPF/CNPJ do cliente: ')).trim();
      const placa     = (await this.#pergunta('Placa: ')).trim();
      try {
        this.#cadastro.removerPlaca(cpfOuCnpj, placa);
        console.log(`✅ Placa ${placa.toUpperCase()} removida.`);
      } catch (e) { console.log(`❌ ${e.message}`); }

    } else if (op === '4') {
      const cpfOuCnpj = (await this.#pergunta('CPF/CNPJ: ')).trim();
      try {
        const info = this.#relatorios.relatorio(cpfOuCnpj);
        console.log('\n📋 Situação do cliente:');
        console.log(`   Nome:    ${info.nome}`);
        console.log(`   Tipo:    ${info.tipo}`);
        console.log(`   Placas:  ${info.placas.join(', ') || 'nenhuma'}`);
        console.log(`   Dentro:  ${info.veiculosAtivos.join(', ') || 'nenhum'}`);
        if (info.saldo  !== undefined) console.log(`   Saldo:   R$ ${info.saldo.toFixed(2)}`);
        if (info.debito !== undefined) console.log(`   Débito:  R$ ${info.debito.toFixed(2)}`);
      } catch (e) { console.log(`❌ ${e.message}`); }
    }
  }

  async #menuEntrada() {
    const placa = (await this.#pergunta('Placa do veículo: ')).trim();
    try {
      const ticket = this.#registro.registrarEntrada(placa);
      console.log(`✅ Entrada registrada — Placa: ${ticket.placa} | ${ticket.entrada.toLocaleString()}`);
    } catch (e) { console.log(`❌ ${e.message}`); }
  }

  async #menuSaida() {
    const placa   = (await this.#pergunta('Placa do veículo: ')).trim();
    const cliente = this.#cadastro.buscarPorPlaca(placa);
    let recusou   = false;
    if (!cliente) {
      const resp = (await this.#pergunta('Cliente recusou pagamento? (s/n): ')).trim().toLowerCase();
      recusou = resp === 's';
    }
    try {
      const ticket = this.#registro.registrarSaida(placa, new Date(), recusou);
      console.log(`\n✅ Saída registrada:`);
      console.log(`   Placa:      ${ticket.placa}`);
      console.log(`   Entrada:    ${ticket.entrada.toLocaleString()}`);
      console.log(`   Saída:      ${ticket.saida.toLocaleString()}`);
      console.log(`   Tempo:      ${ticket.calcularTempo().toFixed(2)}h`);
      console.log(`   Valor pago: R$ ${(ticket.valorPago ?? 0).toFixed(2)}`);
      if (ticket.desconto?.id !== 'nenhum') {
        console.log(`   Desconto:   ${ticket.desconto.id} (-R$ ${ticket.desconto.valorDesconto.toFixed(2)})`);
      }
    } catch (e) { console.log(`❌ ${e.message}`); }
  }

  async #menuRelatorios() {
    console.log(`
┌─────────────────────────────────────────────────────┐
│                    RELATÓRIOS                       │
├─────────────────────────────────────────────────────┤
│ 1. Arrecadação por período / categoria              │
│ 2. Situação de cliente cadastrado                   │
│ 3. Registros de cliente cadastrado por período      │
│ 4. Registros de cliente avulso por período          │
│ 5. Clientes impedidos de entrar                     │
│ 6. Top 10 clientes mais frequentes do ano           │
│ 0. Voltar                                           │
└─────────────────────────────────────────────────────┘`);

    const op = (await this.#pergunta('Escolha: ')).trim();

    if (op === '1') {
      const inicio    = (await this.#pergunta('Data início (AAAA-MM-DD): ')).trim();
      const fim       = (await this.#pergunta('Data fim   (AAAA-MM-DD): ')).trim();
      console.log('Categoria (deixe em branco para todas): Professor | Estudante | Empresa | Avulso');
      const categoria = (await this.#pergunta('Categoria: ')).trim() || null;
      try {
        const r = this.#relatorios.arrecadacao(inicio, fim, categoria);
        console.log(`\n💰 Arrecadação de ${inicio} a ${fim}:`);
        console.log(`   Total:      R$ ${r.total.toFixed(2)}`);
        console.log(`   Registros:  ${r.quantidade}`);
        if (Object.keys(r.porCategoria).length) {
          console.log('   Por categoria:');
          for (const [cat, val] of Object.entries(r.porCategoria)) {
            console.log(`     ${cat}: R$ ${val.toFixed(2)}`);
          }
        }
      } catch (e) { console.log(`❌ ${e.message}`); }

    } else if (op === '2') {
      const cpfOuCnpj = (await this.#pergunta('CPF/CNPJ: ')).trim();
      try {
        const info = this.#relatorios.relatorio(cpfOuCnpj);
        console.log('\n📋 Situação do cliente:');
        console.log(`   Nome:    ${info.nome}`);
        console.log(`   Tipo:    ${info.tipo}`);
        console.log(`   Placas:  ${info.placas.join(', ') || 'nenhuma'}`);
        console.log(`   Dentro:  ${info.veiculosAtivos.join(', ') || 'nenhum'}`);
        if (info.saldo  !== undefined) console.log(`   Saldo:   R$ ${info.saldo.toFixed(2)}`);
        if (info.debito !== undefined) console.log(`   Débito:  R$ ${info.debito.toFixed(2)}`);
      } catch (e) { console.log(`❌ ${e.message}`); }

    } else if (op === '3') {
      const cpfOuCnpj = (await this.#pergunta('CPF/CNPJ: ')).trim();
      const inicio    = (await this.#pergunta('Data início (AAAA-MM-DD): ')).trim();
      const fim       = (await this.#pergunta('Data fim   (AAAA-MM-DD): ')).trim();
      try {
        const r = this.#relatorios.registrosCadastrado(cpfOuCnpj, inicio, fim);
        console.log(`\n📋 Registros de ${r.cliente}:`);
        if (!r.tickets.length) { console.log('   Nenhum registro no período.'); return; }
        for (const t of r.tickets) {
          const saida = t.saida ? t.saida.toLocaleString() : 'em aberto';
          console.log(`   ${t.placa} | Entrada: ${t.entrada.toLocaleString()} | Saída: ${saida} | R$ ${(t.valorPago ?? 0).toFixed(2)}`);
        }
      } catch (e) { console.log(`❌ ${e.message}`); }

    } else if (op === '4') {
      const placa  = (await this.#pergunta('Placa: ')).trim();
      const inicio = (await this.#pergunta('Data início (AAAA-MM-DD): ')).trim();
      const fim    = (await this.#pergunta('Data fim   (AAAA-MM-DD): ')).trim();
      const r = this.#relatorios.registrosAvulso(placa, inicio, fim);
      console.log(`\n📋 Registros avulso — Placa ${r.placa}:`);
      if (!r.tickets.length) { console.log('   Nenhum registro no período.'); return; }
      for (const t of r.tickets) {
        const saida = t.saida ? t.saida.toLocaleString() : 'em aberto';
        console.log(`   Entrada: ${t.entrada.toLocaleString()} | Saída: ${saida} | R$ ${(t.valorPago ?? 0).toFixed(2)}`);
      }

    } else if (op === '5') {
      const r = this.#relatorios.inadimplentes();
      console.log('\n🚫 Clientes impedidos de entrar:');
      const todos = [...r.avulsosBloqueados, ...r.empresasInadimplentes, ...r.estudantesBloqueados];
      if (!todos.length) { console.log('   Nenhum.'); return; }
      for (const item of r.avulsosBloqueados)
        console.log(`   [Avulso]    Placa: ${item.placa}`);
      for (const item of r.empresasInadimplentes)
        console.log(`   [Empresa]   ${item.nome} (${item.cnpj}) — Débito: R$ ${item.debito.toFixed(2)}`);
      for (const item of r.estudantesBloqueados)
        console.log(`   [Estudante] ${item.nome} (${item.cpf}) — Saldo: R$ ${item.saldo.toFixed(2)}`);

    } else if (op === '6') {
      const ano = parseInt(await this.#pergunta('Ano (ex: 2025): '));
      const top = this.#relatorios.top10Frequentes(ano);
      console.log(`\n🏆 Top 10 mais frequentes em ${ano}:`);
      if (!top.length) { console.log('   Nenhum registro no ano.'); return; }
      top.forEach((item, i) => {
        console.log(`   ${i + 1}º ${item.nome} — Placa: ${item.placa} — ${item.usos} uso(s)`);
      });
    }
  }

  async #sair() {
    this.#salvar();
    console.log('\n✅ Dados salvos. Até logo!');
    this.#rl.close();
  }
}
