export class CadastroClientes {
  #clientes;
  #placas;
  #placasSet;
  #bloqueados;

  constructor() {
    this.#clientes   = new Map();
    this.#placas     = new Map();
    this.#placasSet  = new Set();
    this.#bloqueados = new Set();
  }

  cadastrar(cliente) {
    if (!cliente.cpfOuCnpj) throw new Error('Cliente sem CPF/CNPJ.');
    if (this.#clientes.has(cliente.cpfOuCnpj)) throw new Error('Cliente já cadastrado.');
    for (const placa of cliente.listarPlacas()) {
      if (this.#placasSet.has(placa)) throw new Error(`Placa ${placa} já está cadastrada para outro cliente.`);
    }
    this.#clientes.set(cliente.cpfOuCnpj, cliente);
    for (const placa of cliente.listarPlacas()) this.#registrarPlaca(placa, cliente.cpfOuCnpj);
  }

  remover(cpfOuCnpj) {
    const cliente = this.#clientes.get(cpfOuCnpj);
    if (!cliente) throw new Error('Cliente não encontrado.');
    for (const placa of cliente.listarPlacas()) {
      this.#placas.delete(placa);
      this.#placasSet.delete(placa);
    }
    this.#clientes.delete(cpfOuCnpj);
  }

  buscarCliente(cpfOuCnpj) {
    return this.#clientes.get(cpfOuCnpj) ?? null;
  }

  buscarPorPlaca(placa) {
    const id = this.#placas.get(placa.toUpperCase());
    return id ? (this.#clientes.get(id) ?? null) : null;
  }

  adicionarPlaca(cpfOuCnpj, placa) {
    const cliente = this.#clientes.get(cpfOuCnpj);
    if (!cliente) throw new Error('Cliente não encontrado.');
    const p = placa.trim().toUpperCase();
    if (this.#placasSet.has(p)) throw new Error(`Placa ${p} já está cadastrada.`);
    cliente.adicionarPlaca(p);
    this.#registrarPlaca(p, cpfOuCnpj);
  }

  removerPlaca(cpfOuCnpj, placa) {
    const cliente = this.#clientes.get(cpfOuCnpj);
    if (!cliente) throw new Error('Cliente não encontrado.');
    const p = placa.trim().toUpperCase();
    cliente.removerPlaca(p);
    this.#placas.delete(p);
    this.#placasSet.delete(p);
  }

  bloquearPlaca(placa) { this.#bloqueados.add(placa.toUpperCase()); }
  estaBloqueado(placa) { return this.#bloqueados.has(placa.toUpperCase()); }
  listarBloqueados()   { return [...this.#bloqueados]; }
  listarClientes()     { return [...this.#clientes.values()]; }

  get totalClientes() { return this.#clientes.size; }

  #registrarPlaca(placa, cpfOuCnpj) {
    const p = placa.toUpperCase();
    this.#placas.set(p, cpfOuCnpj);
    this.#placasSet.add(p);
  }
}
