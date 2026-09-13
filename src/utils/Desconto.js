import { DESCONTO } from '../utils/Constantes.js';

export class Desconto {
  static #historico = new Map();

  static registrarEntrada(placa, dataEntrada) {
    if (!Desconto.#historico.has(placa)) {
      Desconto.#historico.set(placa, []);
    }
    Desconto.#historico.get(placa).push(new Date(dataEntrada));
  }

  static #isClienteFrequente(placa, dataReferencia) {
    const usos   = Desconto.#historico.get(placa) ?? [];
    const ref    = new Date(dataReferencia);
    const limite = new Date(ref);
    limite.setDate(limite.getDate() - DESCONTO.CLIENTE_FREQUENTE.dias);
    const usosRecentes = usos.filter(d => d >= limite && d <= ref);
    return usosRecentes.length >= DESCONTO.CLIENTE_FREQUENTE.usos;
  }

  static aplicar(avulso, valorBruto, dataEntrada) {
    if (Desconto.#isClienteFrequente(avulso.placa, dataEntrada)) {
      const valorDesconto = valorBruto * DESCONTO.CLIENTE_FREQUENTE.percentual;
      return {
        valor:         valorBruto,
        descontoId:    DESCONTO.CLIENTE_FREQUENTE.id,
        valorDesconto,
        valorPago:     valorBruto - valorDesconto,
      };
    }
    return {
      valor:         valorBruto,
      descontoId:    'nenhum',
      valorDesconto: 0,
      valorPago:     valorBruto,
    };
  }
}
