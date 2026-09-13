import { Cliente } from './Cliente.js';

export class Professor extends Cliente {
  #veiculoAtivo;
  static MAX_PLACAS = 2;

  constructor(cpfOuCnpj, nome) {
    super(cpfOuCnpj, nome);
    this.#veiculoAtivo = null;
  }

  get veiculoAtivo() { return this.#veiculoAtivo; }

  adicionarPlaca(placa) {
    if (this.listarPlacas().length >= Professor.MAX_PLACAS) {
      throw new Error('Professor pode cadastrar no máximo 2 veículos.');
    }
    super.adicionarPlaca(placa);
  }

  podeEntrar(placa) {
    if (!this.temPlaca(placa.toUpperCase())) return false;
    return this.#veiculoAtivo === null;
  }

  entrar(placa) { this.#veiculoAtivo = placa.toUpperCase(); }
  sair()        { this.#veiculoAtivo = null; }

  calcularValor(_ticket) { return 0; }
}
