import { CadastroClientes }            from './src/cadastro/CadastroClientes.js';
import { RegistroDeEntradas_E_Saidas } from './src/registro/RegistroDeEntradas_E_Saidas.js';
import { RelatoriosGerenciais }        from './src/relatorios/RelatoriosGerenciais.js';
import { Professor } from './src/clientes/Professor.js';
import { Estudante } from './src/clientes/Estudante.js';
import { Empresa }   from './src/clientes/Empresa.js';

const cadastro   = new CadastroClientes();
const registro   = new RegistroDeEntradas_E_Saidas(cadastro);
const relatorios = new RelatoriosGerenciais(cadastro, registro);

// ── Cadastro ──────────────────────────────────────────────────
const prof = new Professor('111.111.111-11', 'João Silva');
cadastro.cadastrar(prof);
cadastro.adicionarPlaca('111.111.111-11', 'PRF1A11');
cadastro.adicionarPlaca('111.111.111-11', 'PRF2B22');

const est = new Estudante('222.222.222-22', 'Maria Souza');
est.carregarSaldo(50);
cadastro.cadastrar(est);
cadastro.adicionarPlaca('222.222.222-22', 'EST1A11');

const emp = new Empresa('00.000.000/0001-00', 'TechCorp');
cadastro.cadastrar(emp);
cadastro.adicionarPlaca('00.000.000/0001-00', 'EMP1A11');
cadastro.adicionarPlaca('00.000.000/0001-00', 'EMP2B22');
cadastro.adicionarPlaca('00.000.000/0001-00', 'EMP3C33');

// ── Professor — 4 visitas em setembro/2026 ────────────────────
registro.registrarEntrada('PRF1A11', new Date('2026-09-02T08:00:00'));
registro.registrarSaida('PRF1A11',   new Date('2026-09-02T12:00:00'));

registro.registrarEntrada('PRF2B22', new Date('2026-09-08T09:00:00'));
registro.registrarSaida('PRF2B22',   new Date('2026-09-08T17:00:00'));

registro.registrarEntrada('PRF1A11', new Date('2026-09-15T08:00:00'));
registro.registrarSaida('PRF1A11',   new Date('2026-09-15T14:00:00'));

registro.registrarEntrada('PRF2B22', new Date('2026-09-22T10:00:00'));
registro.registrarSaida('PRF2B22',   new Date('2026-09-22T16:00:00'));

// ── Estudante — 3 visitas em setembro/2026 ────────────────────
registro.registrarEntrada('EST1A11', new Date('2026-09-03T08:00:00'));
registro.registrarSaida('EST1A11',   new Date('2026-09-03T10:00:00'));

registro.registrarEntrada('EST1A11', new Date('2026-09-10T09:00:00'));
registro.registrarSaida('EST1A11',   new Date('2026-09-10T11:00:00'));

registro.registrarEntrada('EST1A11', new Date('2026-09-18T08:00:00'));
registro.registrarSaida('EST1A11',   new Date('2026-09-18T10:00:00'));

// ── Empresa — 4 visitas em setembro/2026 ─────────────────────
registro.registrarEntrada('EMP1A11', new Date('2026-09-01T08:00:00'));
registro.registrarSaida('EMP1A11',   new Date('2026-09-01T18:00:00'));

registro.registrarEntrada('EMP2B22', new Date('2026-09-05T08:00:00'));
registro.registrarSaida('EMP2B22',   new Date('2026-09-05T18:00:00'));

registro.registrarEntrada('EMP3C33', new Date('2026-09-12T08:00:00'));
registro.registrarSaida('EMP3C33',   new Date('2026-09-12T18:00:00'));

registro.registrarEntrada('EMP1A11', new Date('2026-09-19T08:00:00'));
registro.registrarSaida('EMP1A11',   new Date('2026-09-19T18:00:00'));

// ── Avulso frequente — 4 visitas (ganha desconto na 4ª) ───────
// 3 visitas nos últimos 5 dias antes da 4ª → desconto ClienteFrequente
registro.registrarEntrada('AVU9Z99', new Date('2026-09-21T08:00:00'));
registro.registrarSaida('AVU9Z99',   new Date('2026-09-21T10:00:00'));

registro.registrarEntrada('AVU9Z99', new Date('2026-09-23T08:00:00'));
registro.registrarSaida('AVU9Z99',   new Date('2026-09-23T10:00:00'));

registro.registrarEntrada('AVU9Z99', new Date('2026-09-24T08:00:00'));
registro.registrarSaida('AVU9Z99',   new Date('2026-09-24T10:00:00'));

registro.registrarEntrada('AVU9Z99', new Date('2026-09-25T08:00:00'));
registro.registrarSaida('AVU9Z99',   new Date('2026-09-25T10:00:00')); // com desconto

// ── Avulso que recusou pagamento ──────────────────────────────
registro.registrarEntrada('BLQ0Z00', new Date('2026-09-10T09:00:00'));
registro.registrarSaida('BLQ0Z00',   new Date('2026-09-10T10:00:00'), true);

// ── Empresa inadimplente ──────────────────────────────────────
emp.marcarInadimplente();

// ── Relatórios ────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════╗');
console.log('║         DEMONSTRAÇÃO DO SISTEMA          ║');
console.log('╚══════════════════════════════════════════╝');

console.log('\n📋 1. SITUAÇÃO DO PROFESSOR:');
const rProf = relatorios.relatorio('111.111.111-11');
console.log(`   Nome:   ${rProf.nome}`);
console.log(`   Placas: ${rProf.placas.join(', ')}`);

console.log('\n📋 2. SITUAÇÃO DO ESTUDANTE:');
const rEst = relatorios.relatorio('222.222.222-22');
console.log(`   Nome:  ${rEst.nome}`);
console.log(`   Saldo: R$ ${rEst.saldo.toFixed(2)}`);

console.log('\n💰 3. ARRECADAÇÃO (SET/2026):');
const arr = relatorios.arrecadacao('2026-09-01', '2026-09-30');
console.log(`   Total:     R$ ${arr.total.toFixed(2)}`);
console.log(`   Registros: ${arr.quantidade}`);
for (const [cat, val] of Object.entries(arr.porCategoria)) {
  console.log(`   ${cat}: R$ ${val.toFixed(2)}`);
}

console.log('\n📋 4. REGISTROS DO PROFESSOR (SET/2026):');
const rProfPer = relatorios.registrosCadastrado('111.111.111-11', '2026-09-01', '2026-09-30');
for (const t of rProfPer.tickets) {
  console.log(`   ${t.placa} | ${new Date(t.entrada).toLocaleDateString('pt-BR')} | R$ ${(t.valorPago ?? 0).toFixed(2)}`);
}

console.log('\n📋 5. REGISTROS AVULSO (AVU9Z99 — SET/2026):');
const rAvulso = relatorios.registrosAvulso('AVU9Z99', '2026-09-01', '2026-09-30');
for (const t of rAvulso.tickets) {
  const desc = t.descontoId && t.descontoId !== 'nenhum' ? ` (desconto: ${t.descontoId})` : '';
  console.log(`   ${new Date(t.entrada).toLocaleDateString('pt-BR')} | R$ ${(t.valorPago ?? 0).toFixed(2)}${desc}`);
}

console.log('\n🚫 6. CLIENTES IMPEDIDOS:');
const inad = relatorios.inadimplentes();
for (const i of inad.avulsosBloqueados)
  console.log(`   [Avulso]    Placa: ${i.placa}`);
for (const i of inad.empresasInadimplentes)
  console.log(`   [Empresa]   ${i.nome} — Débito: R$ ${i.debito.toFixed(2)}`);
for (const i of inad.estudantesBloqueados)
  console.log(`   [Estudante] ${i.nome} — Saldo: R$ ${i.saldo.toFixed(2)}`);
if (!inad.avulsosBloqueados.length && !inad.empresasInadimplentes.length && !inad.estudantesBloqueados.length)
  console.log('   Nenhum.');

console.log('\n🏆 7. TOP 10 FREQUENTES (2026):');
const top = relatorios.top10Frequentes(2026);
top.forEach((item, i) => {
  console.log(`   ${i + 1}º ${item.nome} — Placa: ${item.placa} — ${item.usos} uso(s)`);
});

console.log('\n✅ Demonstração concluída!');
