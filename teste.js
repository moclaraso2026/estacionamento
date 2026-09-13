import { CadastroClientes }            from './src/cadastro/CadastroClientes.js';
import { RegistroDeEntradas_E_Saidas } from './src/registro/RegistroDeEntradas_E_Saidas.js';
import { RelatoriosGerenciais }        from './src/relatorios/RelatoriosGerenciais.js';
import { Professor } from './src/clientes/Professor.js';
import { Estudante } from './src/clientes/Estudante.js';
import { Empresa }   from './src/clientes/Empresa.js';

let passou = 0;
let falhou = 0;

function ok(descricao, condicao) {
  if (condicao) { console.log(`  ✅ ${descricao}`); passou++; }
  else          { console.log(`  ❌ ${descricao}`); falhou++; }
}

function lanca(descricao, fn) {
  try { fn(); ok(descricao, false); }
  catch (_) { ok(descricao, true); }
}

function naoLanca(descricao, fn) {
  try { fn(); ok(descricao, true); }
  catch (e) { ok(descricao, false); console.log(`     Erro: ${e.message}`); }
}

function secao(titulo) {
  console.log(`\n─── ${titulo} ${'─'.repeat(Math.max(0, 50 - titulo.length))}`);
}

const cadastro   = new CadastroClientes();
const registro   = new RegistroDeEntradas_E_Saidas(cadastro);
const relatorios = new RelatoriosGerenciais(cadastro, registro);

secao('Professor');
const prof = new Professor('111.111.111-11', 'João Professor');
naoLanca('Cadastrar professor', () => cadastro.cadastrar(prof));
naoLanca('Adicionar placa 1',   () => cadastro.adicionarPlaca('111.111.111-11', 'ABC1D23'));
naoLanca('Adicionar placa 2',   () => cadastro.adicionarPlaca('111.111.111-11', 'DEF2E34'));
lanca('Bloquear 3ª placa',      () => cadastro.adicionarPlaca('111.111.111-11', 'GHI3F45'));
const t1 = registro.registrarEntrada('ABC1D23');
ok('Professor entrou', t1 !== null);
lanca('2º veículo bloqueado enquanto 1º está dentro', () => registro.registrarEntrada('DEF2E34'));
registro.registrarSaida('ABC1D23');
ok('Após saída, 2º pode entrar', prof.podeEntrar('DEF2E34'));
ok('Cobrança do professor é zero', t1.valorPago === 0);

secao('Estudante');
const est = new Estudante('222.222.222-22', 'Maria Estudante');
naoLanca('Cadastrar estudante', () => cadastro.cadastrar(est));
naoLanca('Adicionar placa',     () => cadastro.adicionarPlaca('222.222.222-22', 'EST1A11'));
lanca('Bloquear 2ª placa',      () => cadastro.adicionarPlaca('222.222.222-22', 'EST2B22'));
est.carregarSaldo(30);
registro.registrarEntrada('EST1A11', new Date('2025-11-27T08:00:00'));
registro.registrarSaida('EST1A11',   new Date('2025-11-27T12:00:00'));
ok('Saldo debitado (30 - 10 = 20)', est.saldo === 20);
est.debitarSaldo(50);
ok('Saldo negativo bloqueia entrada', !est.podeEntrar());
lanca('Entrada bloqueada com saldo negativo', () => registro.registrarEntrada('EST1A11'));

secao('Empresa');
const emp = new Empresa('00.000.000/0001-00', 'TechCorp');
naoLanca('Cadastrar empresa', () => cadastro.cadastrar(emp));
naoLanca('Adicionar 3 placas', () => {
  cadastro.adicionarPlaca('00.000.000/0001-00', 'EMP1A11');
  cadastro.adicionarPlaca('00.000.000/0001-00', 'EMP2B22');
  cadastro.adicionarPlaca('00.000.000/0001-00', 'EMP3C33');
});
ok('Empresa pode entrar', emp.podeEntrar());
emp.marcarInadimplente();
ok('Inadimplência bloqueia entrada', !emp.podeEntrar());
emp.quitarDebito();
ok('Após quitar, pode entrar', emp.podeEntrar());

secao('Avulso');
registro.registrarEntrada('AVU1Z99', new Date('2025-11-27T08:00:00'));
const tAv = registro.registrarSaida('AVU1Z99', new Date('2025-11-27T10:30:00'));
ok('2.5h → R$15', tAv.valorPago === 15);
registro.registrarEntrada('BLQ9Z00', new Date('2025-11-27T09:00:00'));
registro.registrarSaida('BLQ9Z00',   new Date('2025-11-27T10:00:00'), true);
ok('Placa bloqueada após recusa', cadastro.estaBloqueado('BLQ9Z00'));
lanca('Entrada bloqueada para placa na lista negra', () => registro.registrarEntrada('BLQ9Z00'));

secao('Desconto ClienteFrequente');
const placaFreq = 'FRQ1A01';
const hoje = new Date('2025-11-27T10:00:00');
for (let i = 4; i >= 2; i--) {
  const e = new Date(hoje); e.setDate(e.getDate() - i); e.setHours(8, 0, 0, 0);
  const s = new Date(e); s.setHours(10, 0, 0, 0);
  registro.registrarEntrada(placaFreq, e);
  registro.registrarSaida(placaFreq, s);
}
const eFreq = new Date(hoje); eFreq.setHours(8, 0, 0, 0);
const sFreq = new Date(hoje); sFreq.setHours(10, 0, 0, 0);
registro.registrarEntrada(placaFreq, eFreq);
const tFreq = registro.registrarSaida(placaFreq, sFreq);
ok('Desconto ClienteFrequente aplicado', tFreq.desconto?.id === 'ClienteFrequente');
ok('Valor com 20% desconto (R$10 → R$8)', tFreq.valorPago === 8);

secao('Relatórios');
const arr = relatorios.arrecadacao('2025-11-01', '2025-11-30');
ok('Arrecadação calculada', arr.total >= 0);
const inad = relatorios.inadimplentes();
ok('Lista de bloqueados retornada', Array.isArray(inad.avulsosBloqueados));
const top = relatorios.top10Frequentes(2025);
ok('Top 10 retornado', Array.isArray(top));

console.log(`\n${'═'.repeat(50)}`);
console.log(`  Resultado: ${passou} passou | ${falhou} falhou`);
console.log(`${'═'.repeat(50)}`);
if (falhou === 0) console.log('  🎉 Todos os testes passaram!');
