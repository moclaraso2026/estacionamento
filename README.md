# Sistema de Controle de Estacionamento — Fase 1

Sistema de controle de estacionamento desenvolvido em JavaScript com POO, implementado para a disciplina de Programação Orientada a Objetos.

---

## Objetivo

Controlar entradas, saídas e cobranças de um estacionamento com 9.000 vagas, atendendo clientes avulsos e pré-cadastrados (professores, estudantes e empresas).

---

## Estrutura das Classes

```
estacionamento/
├── src/
│   ├── app/
│   │   └── App.js                        — inicialização e execução
│   ├── cadastro/
│   │   └── CadastroClientes.js           — cadastro, busca e bloqueios
│   ├── clientes/
│   │   ├── Cliente.js                    — classe base (abstrata)
│   │   ├── Professor.js                  — herda de Cliente
│   │   ├── Estudante.js                  — herda de Cliente
│   │   ├── Empresa.js                    — herda de Cliente
│   │   └── ClienteAvulso.js              — classe independente (sem CPF/CNPJ)
│   ├── registro/
│   │   └── RegistroDeEntradas_E_Saidas.js — controle de entrada/saída/cobrança
│   ├── relatorios/
│   │   └── RelatoriosGerenciais.js       — consultas gerenciais
│   ├── ticket/
│   │   └── TicketEstacionamento.js       — registro de uma permanência
│   └── utils/
│       ├── Constantes.js                 — valores configuráveis
│       └── Desconto.js                   — estratégia de desconto extensível
├── teste.js                              — rotina de testes
└── package.json
```

---

## Relacionamento entre as Classes

```
Cliente (abstrata)
  ├── Professor    — herança, calcularValor() retorna 0
  ├── Estudante    — herança, calcularValor() usa ingresso fixo
  └── Empresa      — herança, calcularValor() usa diária + multa

ClienteAvulso      — independente (sem CPF/CNPJ), calcularValor() usa tarifa horária/diária

CadastroClientes   — contém Map<clientes>, Map<placas>, Set<bloqueados>
RegistroDeEntradas_E_Saidas
  — usa CadastroClientes (associação)
  — cria TicketEstacionamento (composição)
  — usa Desconto (associação)
  — contém Map<registros>, Map<ativos>, Map<avulsos>

RelatoriosGerenciais
  — consulta CadastroClientes e RegistroDeEntradas_E_Saidas (associação)

App
  — compõe CadastroClientes, RegistroDeEntradas_E_Saidas, RelatoriosGerenciais
```

---

## Como Executar

Pré-requisito: Node.js instalado.

```bash
# Instalar dependências (nenhuma dependência externa necessária)
# O projeto usa apenas ES Modules nativos do Node.js

# Iniciar o sistema
node src/index.js

# Executar os testes
node teste.js
```

---

## Como Testar

O arquivo `teste.js` contém uma rotina de demonstração que cobre todos os cenários da seção 22 do enunciado:

```bash
node teste.js
```

Saída esperada: todos os testes marcados com ✅.

---

## Principais Regras de Negócio

### Professor
- Máximo de 2 veículos cadastrados.
- Somente 1 veículo pode estar estacionado simultaneamente.
- Estacionamento gratuito (`calcularValor()` retorna 0).

### Estudante
- Máximo de 1 veículo cadastrado.
- Cobrança por ingresso fixo (`VALORES.INGRESSO`).
- Saída após meia-noite cobra 2 ingressos.
- Saldo pode ficar negativo; saída sempre liberada.
- Saldo negativo bloqueia nova entrada.

### Empresa
- Sem limite de veículos; todos podem estar simultaneamente estacionados.
- Cobrança por diária (`VALORES.DIARIA`).
- Multa por cada meia-noite ultrapassada (`VALORES.MULTA_EMPRESA`).
- Débitos acumulados; inadimplência bloqueia todos os veículos.

### Cliente Avulso
- Identificado apenas pela placa.
- Cobrança por hora até 6 horas; acima disso, cobra diária.
- Passagem da meia-noite gera nova diária.
- Recusa de pagamento bloqueia a placa.

### Desconto ClienteFrequente
- 3 usos nos últimos 5 dias → 20% de desconto.
- Pode ser concedido repetidamente (janela deslizante).
- Identificado internamente pela string `"ClienteFrequente"`.

---

## Decisões de Implementação

### Por que `ClienteAvulso` não herda de `Cliente`
`Cliente` exige `cpfOuCnpj` e `nome`. O avulso não possui esses dados. Forçar herança criaria atributos sem sentido e violaria o encapsulamento.

### Por que a classe `Desconto` existe separada
O enunciado pede que o sistema permita adicionar novos descontos no futuro. Colocar a lógica dentro de `TicketEstacionamento` ou `ClienteAvulso` tornaria difícil estender. A classe `Desconto` centraliza todas as regras de desconto; para adicionar um novo, basta incluir uma nova verificação em `Desconto.aplicar()`.

### Por que `CadastroClientes` usa `Map` e `Set` para placas
O diagrama exige `Set<placas>`. Mas `buscarPorPlaca()` precisa localizar o dono, o que exige um `Map<placa, cpfOuCnpj>`. A solução usa ambos: o `Map` para busca e o `Set` para verificação de duplicatas, satisfazendo os dois requisitos.

### Capacidade de vagas
Controlada em `RegistroDeEntradas_E_Saidas` pelo tamanho do `Map` de ativos (`#ativos.size >= CAPACIDADE_VAGAS`). Não foi criada uma estrutura de vagas numeradas pois o enunciado não exige isso na Fase 1.

---

## Onde foi utilizado `Map`

| Localização | Chave | Valor | Finalidade |
|---|---|---|---|
| `CadastroClientes.#clientes` | cpfOuCnpj | Cliente | Busca rápida de cliente |
| `CadastroClientes.#placas` | placa | cpfOuCnpj | Identificar dono da placa |
| `RegistroDeEntradas_E_Saidas.#registros` | placa | TicketEstacionamento[] | Histórico por placa |
| `RegistroDeEntradas_E_Saidas.#ativos` | placa | TicketEstacionamento | Veículos dentro agora |
| `RegistroDeEntradas_E_Saidas.#avulsos` | placa | ClienteAvulso | Histórico de avulsos |
| `Desconto.#historico` (estático) | placa | Date[] | Histórico para ClienteFrequente |

---

## Onde foi utilizado `Set`

| Localização | Conteúdo | Finalidade |
|---|---|---|
| `Cliente.#placas` | placas | Placas de cada cliente (sem duplicatas) |
| `CadastroClientes.#placasSet` | placas | Verificação de duplicatas O(1) |
| `CadastroClientes.#bloqueados` | placas | Verificação rápida de bloqueio |

---

## Onde ocorre Herança

```
Cliente
  ├── Professor  (extends Cliente)
  ├── Estudante  (extends Cliente)
  └── Empresa    (extends Cliente)
```

Cada subclasse chama `super(cpfOuCnpj, nome)` no construtor e sobrescreve `calcularValor()`.

---

## Onde ocorre Polimorfismo

O método `calcularValor(ticket)` é sobrescrito em cada subclasse:

| Classe | Comportamento |
|---|---|
| `Professor` | Sempre retorna 0 |
| `Estudante` | Retorna ingresso fixo (ou 2x se passou meia-noite) |
| `Empresa` | Retorna diária + multa por meia-noite |
| `ClienteAvulso` | Retorna valor horário/diário com desconto |

`RegistroDeEntradas_E_Saidas.calcularCobranca()` chama `cliente.calcularValor(ticket)` sem saber o tipo concreto — o comportamento correto é selecionado automaticamente pelo JavaScript.

---

## Valores Configuráveis (Premissas)

Todos os valores estão em `src/utils/Constantes.js`:

| Constante | Valor | Origem |
|---|---|---|
| `VALORES.VALOR_HORA` | R$ 5,00 | **Premissa configurável** |
| `VALORES.DIARIA` | R$ 25,00 | **Premissa configurável** |
| `VALORES.INGRESSO` | R$ 10,00 | **Premissa configurável** |
| `VALORES.MULTA_EMPRESA` | R$ 50,00 | **Premissa configurável** |
| `VALORES.HORAS_DIARIA` | 6 horas | Definido no enunciado |
| `DESCONTO.CLIENTE_FREQUENTE.percentual` | 20% | Definido no enunciado |
| `DESCONTO.CLIENTE_FREQUENTE.usos` | 3 usos | Definido no enunciado |
| `DESCONTO.CLIENTE_FREQUENTE.dias` | 5 dias | Definido no enunciado |
| `CAPACIDADE_VAGAS` | 9.000 | Definido no enunciado |
