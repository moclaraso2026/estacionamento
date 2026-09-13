import { CadastroClientes }           from '../cadastro/CadastroClientes.js';
import { RegistroDeEntradas_E_Saidas } from '../registro/RegistroDeEntradas_E_Saidas.js';
import { RelatoriosGerenciais }        from '../relatorios/RelatoriosGerenciais.js';
import { PersistenciaCSV }             from '../persistencia/PersistenciaCSV.js';
import { Interface }                   from '../interface/Interface.js';

export class App {
  #cadastro;
  #registro;
  #relatorios;
  #interface;

  constructor() {
    this.#cadastro   = new CadastroClientes();
    this.#registro   = new RegistroDeEntradas_E_Saidas(this.#cadastro);
    this.#relatorios = new RelatoriosGerenciais(this.#cadastro, this.#registro);
    this.#interface  = new Interface(
      this.#cadastro,
      this.#registro,
      this.#relatorios,
      () => this.#salvar()
    );
  }

  iniciar() {
    PersistenciaCSV.carregarClientes(this.#cadastro);
    PersistenciaCSV.carregarRegistros(this.#registro);
    console.log(`Dados carregados. Vagas ocupadas: ${this.#registro.vagasOcupadas}`);
    this.#interface.iniciar();
  }

  #salvar() {
    PersistenciaCSV.salvarClientes(this.#cadastro);
    PersistenciaCSV.salvarRegistros(this.#registro);
  }

  get cadastro()   { return this.#cadastro; }
  get registro()   { return this.#registro; }
  get relatorios() { return this.#relatorios; }
}
