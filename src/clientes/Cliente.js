export class Cliente {
  #cpfOuCnpj;
  #nome;
  #placas;

  constructor(cpfOuCnpj, nome) {
    if (new.target === Cliente) throw new Error('Cliente é uma classe abstrata.');
    if (!cpfOuCnpj || !cpfOuCnpj.trim()) throw new Error('CPF/CNPJ é obrigatório.');
    if (!nome || !nome.trim())            throw new Error('Nome é obrigatório.');
    this.#cpfOuCnpj = cpfOuCnpj.trim();
    this.#nome      = nome.trim();
    this.#placas    = new Set();
  }

  get cpfOuCnpj() { return this.#cpfOuCnpj; }
  get nome()      { return this.#nome; }

  adicionarPlaca(placa) {
    if (!placa || !placa.trim()) throw new Error('Placa inválida.');
    this.#placas.add(placa.trim().toUpperCase());
  }

  removerPlaca(placa) {
    const p = placa.trim().toUpperCase();
    if (!this.#placas.has(p)) throw new Error(`Placa ${p} não encontrada neste cliente.`);
    this.#placas.delete(p);
  }

  listarPlacas() { return [...this.#placas]; }
  temPlaca(placa) { return this.#placas.has(placa.trim().toUpperCase()); }

  calcularValor(_ticket) {
    throw new Error('calcularValor() deve ser implementado pela subclasse.');
  }
}
