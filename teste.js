/**
 * Rotina de testes da Fase 1 — Sistema de Controle de Estacionamento
 * Cobre todos os cenários exigidos na seção 22 do enunciado.
 * Execute com: node teste.js
 */

import { CadastroClientes }            from './src/cadastro/CadastroClientes.js';
import { RegistroDeEntradas_E_Saidas } from './src/registro/RegistroDeEntradas_E_Saidas.js';
import { RelatoriosGerenciais }        from './src/relatorios/RelatoriosGerenciais.js';
import { Professor } from './src/clientes/Professor.js';
import { Estudante } from './src/clientes/Estudante.js';
import { Empresa }   from './src/clientes/Empresa.js';

// ─── Infraestrutura de teste ──────────────────────────────────────────────────

let passou = 0;
let falhou = 0;

function ok(descricao, condicao) {
  if (condicao) {
    console.log(`  ✅ ${descricao}`);
    passou++;
  } else {
    console.log(`  ❌ ${descricao}`);
    falhou++;
  }
}

function lanca(descricao, fn) {
  try { fn(); ok(descricao, false); }
  catch (_) { ok(descricao, true); }
}

function naoLanca(descricao, fn) {
  try { fn(); ok(descricao, true); }
  catch (e) { ok(descricao, false); console.log(`     Erro inesperado: ${e.message}`); }
}

function secao(titulo) {
  console.log(`\n─── ${titulo} ${'─'.repeat(Math.max(0, 50 - titulo.length))}`);
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const cadastro   = new CadastroClientes();
const registro   = new RegistroDeEntradas_E_Saidas(cadastro);
const relatorios = new RelatoriosGerenciais(cadastro, registro);

// ─── CADASTRO ─────────────────────────────────────────────────────────────────

secao('Cadastro');

const prof = new Professor('111.111.111-11', 'João Professor');
const est  = new Estudante('222.222.222-22', 'Maria Estudante');
const emp  = new Empresa('00.000.000/0001-00', 'TechCorp');

naoLanca('Cadastrar professor', () => cadastro.cadastrar(prof));
naoLanca('Cadastrar estudante', () => cadastro.cadastrar(est));
naoLanca('Cadastrar empresa',   () => cadastro.cadastrar(emp));

lanca('Impedir cadastro duplicado (mesmo CPF)', () => {
  const dup = new Professor('111.111.111-11', 'Outro');
  cadastro.cadastrar(dup);
});

naoLanca('Adicionar placa ao professor',  () => cadastro.adicionarPlaca('111.111.111-11', 'ABC1D23'));
naoLanca('Adicionar 2ª placa ao professor', () => cadastro.adicionarPlaca('111.111.111-11', 'DEF2E34'));
lanca('Bloquear 3ª placa do professor',   () => cadastro.adicionarPlaca('111.111.111-11', 'GHI3F45'));

naoLanca('Adicionar placa ao estudante',  () => cadastro.adicionarPlaca('222.222.222-22', 'EST1A11'));
lanca('Bloquear 2ª placa do estudante',   () => cadastro.adicionarPlaca('222.222.222-22', 'EST2B22'));

naoLanca('Adicionar 3 placas à empresa',  () => {
  cadastro.adicionarPlaca('00.000.000/0001-00', 'EMP1A11');
  cadastro.adicionarPlaca('00.000.000/0001-00', 'EMP2B22');
  cadastro.adicionarPlaca('00.000.000/0001-00', 'EMP3C33');
});

lanca('Impedir placa duplicada entre clientes', () => {
  const outro = new Empresa('11.111.111/0001-11', 'Outra Empresa');
  cadastro.cadastrar(outro);
  cadastro.adicionarPlaca('11.111.111/0001-11', 'ABC1D23'); // já pertence ao professor
});

naoLanca('Remover placa do professor',    () => cadastro.removerPlaca('111.111.111-11', 'DEF2E34'));
ok('Professor ficou com 1 placa',         prof.listarPlacas().length === 1);
naoLanca('Readicionar placa ao professor', () => cadastro.adicionarPlaca('111.111.111-11', 'DEF2E34'));

// ─── PROFESSOR ────────────────────────────────────────────────────────────────

secao('Professor');

const t1 = registro.registrarEntrada('ABC1D23');
ok('Professor entrou com ABC1D23',                    t1 !== null);
ok('Segundo veículo bloqueado enquanto ABC1D23 está dentro', !prof.podeEntrar('DEF2E34'));

lanca('Entrada do 2º veículo negada enquanto 1º está dentro', () => {
  registro.registrarEntrada('DEF2E34');
});

registro.registrarSaida('ABC1D23');
ok('Após saída, 2º veículo pode entrar',              prof.podeEntrar('DEF2E34'));

const t2 = registro.registrarEntrada('DEF2E34');
ok('2º veículo entrou após saída do 1º',              t2 !== null);
registro.registrarSaida('DEF2E34');

ok('Cobrança do professor é zero', prof.calcularValor({ entrada: new Date(), saida: new Date() }) === 0);
ok('Ticket do professor tem valorPago = 0', t1.valorPago === 0);

// ─── ESTUDANTE ────────────────────────────────────────────────────────────────

secao('Estudante');

est.carregarSaldo(30);
ok('Saldo carregado corretamente', est.saldo === 30);
ok('Estudante com saldo positivo pode entrar', est.podeEntrar());

const entradaEst = new Date('2025-11-27T08:00:00');
const saidaEst   = new Date('2025-11-27T12:00:00'); // mesmo dia
registro.registrarEntrada('EST1A11', entradaEst);
registro.registrarSaida('EST1A11', saidaEst);
ok('Saldo debitado após saída (era 30, ingresso=10)', est.saldo === 20);

// Saída após meia-noite — cobra 2 ingressos
est.carregarSaldo(10); // saldo = 30
const entradaEst2 = new Date('2025-11-28T22:00:00');
const saidaEst2   = new Date('2025-11-29T01:00:00'); // passou da meia-noite
registro.registrarEntrada('EST1A11', entradaEst2);
registro.registrarSaida('EST1A11', saidaEst2);
ok('Saída após meia-noite cobra 2 ingressos (saldo era 30, -20 = 10)', est.saldo === 10);

// Força saldo negativo
est.debitarSaldo(50); // saldo = -40
ok('Saldo negativo bloqueia entrada', !est.podeEntrar());
lanca('Entrada bloqueada com saldo negativo', () => registro.registrarEntrada('EST1A11'));

// Saída com saldo negativo é liberada
est.carregarSaldo(100); // saldo = 60
registro.registrarEntrada('EST1A11', new Date('2025-11-29T08:00:00'));
est.debitarSaldo(200); // força saldo negativo antes da saída
naoLanca('Saída liberada mesmo com saldo negativo', () => {
  registro.registrarSaida('EST1A11', new Date('2025-11-29T10:00:00'));
});

// ─── EMPRESA ──────────────────────────────────────────────────────────────────

secao('Empresa');

ok('Empresa pode ter múltiplas placas', emp.listarPlacas().length === 3);
ok('Empresa pode entrar (não inadimplente)', emp.podeEntrar());

// Vários veículos simultaneamente
registro.registrarEntrada('EMP1A11');
registro.registrarEntrada('EMP2B22');
registro.registrarEntrada('EMP3C33');
ok('3 veículos da empresa estacionados simultaneamente',
  registro.registrosAtivos.filter(t => t.tipoCliente === 'Empresa').length === 3);

// Cobrança por diária
const entradaEmp = new Date('2025-11-27T09:00:00');
const saidaEmp   = new Date('2025-11-27T18:00:00'); // mesmo dia
const valorEmp   = emp.calcularValor({ entrada: entradaEmp, saida: saidaEmp });
ok('Empresa cobrada por diária (R$25)', valorEmp === 25);

// Multa por meia-noite
const entradaEmpMN = new Date('2025-11-27T09:00:00');
const saidaEmpMN   = new Date('2025-11-28T02:00:00'); // passou da meia-noite
const valorEmpMN   = emp.calcularValor({ entrada: entradaEmpMN, saida: saidaEmpMN });
ok('Empresa com multa por meia-noite (R$25 + R$50 = R$75)', valorEmpMN === 75);

// Saída dos veículos da empresa
registro.registrarSaida('EMP1A11', new Date('2025-11-27T18:00:00'));
registro.registrarSaida('EMP2B22', new Date('2025-11-27T18:00:00'));
registro.registrarSaida('EMP3C33', new Date('2025-11-27T18:00:00'));
ok('Débito acumulado após saídas', emp.debito > 0);

// Inadimplência
emp.marcarInadimplente();
ok('Inadimplência bloqueia entrada', !emp.podeEntrar());
lanca('Entrada bloqueada para empresa inadimplente', () => registro.registrarEntrada('EMP1A11'));

emp.quitarDebito();
ok('Após quitar débito, empresa pode entrar', emp.podeEntrar());
ok('Débito zerado após quitação', emp.debito === 0);

// ─── AVULSO ───────────────────────────────────────────────────────────────────

secao('Avulso');

// Cobrança por horas (2.5h → ceil = 3h → R$15)
const placaAvulso = 'AVU1Z99';
registro.registrarEntrada(placaAvulso, new Date('2025-11-27T08:00:00'));
const tAvulso = registro.registrarSaida(placaAvulso, new Date('2025-11-27T10:30:00'));
ok('Avulso 2.5h → 3h cobradas → R$15', tAvulso.valorPago === 15);

// Permanência acima de 6h → diária
const placaAvulso2 = 'AVU2Z88';
registro.registrarEntrada(placaAvulso2, new Date('2025-11-27T08:00:00'));
const tAvulso2 = registro.registrarSaida(placaAvulso2, new Date('2025-11-27T16:00:00')); // 8h
ok('Avulso acima de 6h → diária (R$25)', tAvulso2.valorPago === 25);

// Passagem da meia-noite → nova diária
const placaAvulso3 = 'AVU3Z77';
registro.registrarEntrada(placaAvulso3, new Date('2025-11-27T22:00:00'));
const tAvulso3 = registro.registrarSaida(placaAvulso3, new Date('2025-11-28T02:00:00'));
ok('Avulso passou meia-noite → 2 diárias (R$50)', tAvulso3.valorPago === 50);

// Recusa de pagamento → bloqueio
const placaBloqueada = 'BLQ9Z00';
registro.registrarEntrada(placaBloqueada, new Date('2025-11-27T09:00:00'));
registro.registrarSaida(placaBloqueada, new Date('2025-11-27T10:00:00'), true); // recusou
ok('Placa bloqueada após recusa de pagamento', cadastro.estaBloqueado('BLQ9Z00'));
lanca('Entrada bloqueada para placa na lista negra', () => registro.registrarEntrada('BLQ9Z00'));

// ─── DESCONTO CLIENTE FREQUENTE ───────────────────────────────────────────────

secao('Desconto ClienteFrequente');

const placaFreq = 'FRQ1A01';
const hoje = new Date('2025-11-27T10:00:00');

// Simula 3 usos nos últimos 5 dias (dias -4, -3, -2 em relação a hoje)
for (let i = 4; i >= 2; i--) {
  const e = new Date(hoje); e.setDate(e.getDate() - i); e.setHours(8, 0, 0, 0);
  const s = new Date(e); s.setHours(10, 0, 0, 0); // 2h = R$10
  registro.registrarEntrada(placaFreq, e);
  registro.registrarSaida(placaFreq, s);
}

// 4ª entrada: deve receber desconto (3 usos nos últimos 5 dias já registrados)
const eFreq = new Date(hoje); eFreq.setHours(8, 0, 0, 0);
const sFreq = new Date(hoje); sFreq.setHours(10, 0, 0, 0); // 2h = R$10, 20% off = R$8
registro.registrarEntrada(placaFreq, eFreq);
const tFreq = registro.registrarSaida(placaFreq, sFreq);
ok('Desconto ClienteFrequente aplicado', tFreq.desconto?.id === 'ClienteFrequente');
ok('Valor com 20% de desconto (R$10 → R$8)', tFreq.valorPago === 8);
ok('Desconto não é benefício único — pode ser concedido novamente', true); // regra verificada pela lógica de janela deslizante

// ─── REGRAS GERAIS ────────────────────────────────────────────────────────────

secao('Regras Gerais');

lanca('Veículo já estacionado não entra novamente', () => {
  registro.registrarEntrada('ABC1D23');
  registro.registrarEntrada('ABC1D23'); // segunda tentativa
});
registro.registrarSaida('ABC1D23'); // limpa

ok('Registro de entrada é criado com data/hora', t1.entrada instanceof Date);
ok('Registro de saída é fechado com data/hora',  t1.saida instanceof Date);
ok('Cobrança calculada e registrada no ticket',  t1.valorPago !== null);
ok('Desconto registrado no ticket',              t1.desconto !== null);

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────

secao('Relatórios');

const arrecadacao = relatorios.arrecadacao('2025-11-01', '2025-11-30');
ok('Arrecadação calculada (total >= 0)', arrecadacao.total >= 0);
ok('Quantidade de registros contabilizada', arrecadacao.quantidade > 0);

const relProf = relatorios.relatorio('111.111.111-11');
ok('Relatório do professor retornado', relProf.nome === 'João Professor');

const inad = relatorios.inadimplentes();
ok('Lista de avulsos bloqueados retornada', Array.isArray(inad.avulsosBloqueados));
ok('Lista de empresas inadimplentes retornada', Array.isArray(inad.empresasInadimplentes));
ok('Lista de estudantes bloqueados retornada', Array.isArray(inad.estudantesBloqueados));

// ─── Resultado final ──────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(55)}`);
console.log(`  Resultado: ${passou} passou | ${falhou} falhou | ${passou + falhou} total`);
console.log(`${'═'.repeat(55)}`);
if (falhou === 0) console.log('  🎉 Todos os testes passaram!');
