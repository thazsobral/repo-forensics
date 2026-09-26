# 🛡️ repo-forensics (Beta)

> **Analisador de repositórios do GitHub** — Plataforma forense de segurança, auditoria estática de código e análise de cadeia de suprimentos (*supply chain*), com arquitetura 100% *client-side* e garantia de zero telemetria.

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
  - [1. Dashboard Forense & Security Score](#1-dashboard-forense--security-score)
  - [2. Auditor de Segredos & Entropia de Shannon](#2-auditor-de-segredos--entropia-de-shannon)
  - [3. Supply Chain, SBOM & Vulnerabilidades (CVEs)](#3-supply-chain-sbom--vulnerabilidades-cves)
  - [4. Linha do Tempo Forense & Anomalias de Commits](#4-linha-do-tempo-forense--anomalias-de-commits)
  - [5. Topologia de Arquitetura & Vetores de Ameaça](#5-topologia-de-arquitetura--vetores-de-ameaça)
  - [6. Explorador & Busca Livre Multicamada](#6-explorador--busca-livre-multicamada)
  - [7. Central de Relatórios & Exportação Executiva](#7-central-de-relatórios--exportação-executiva)
- [Modelo de Segurança & Privacidade](#-modelo-de-segurança--privacidade)
- [Stack Tecnológica](#-stack-tecnológica)
- [Instalação e Execução](#-instalação-e-execução)
- [Testes Automatizados](#-testes-automatizados)
- [Licença](#-licença)

---

## 🔍 Visão Geral

O **repo-forensics** é uma solução para times de segurança ofensiva, analistas de DevSecOps e auditores de conformidade investigarem a fundo repositórios Git públicos e privados hospedados no GitHub.

Diferente de scanners convencionais em nuvem que exigem upload de código para servidores terceiros, o **repo-forensics** executa toda a triagem algorítmica diretamente no navegador do usuário (*in-memory / client-side*), permitindo inspecionar bases de código sensíveis sem expor propriedade intelectual ou violar políticas de confidencialidade.

---

## ✨ Funcionalidades Principais

### 1. Dashboard Forense & Security Score
- **Algoritmo de Pontuação de Segurança (0 a 100)** calculado dinamicamente com base em pesos de severidade (*Crítico*, *Alto*, *Médio*, *Baixo*).
- Métricas instantâneas de exposição: segredos detectados, pacotes vulneráveis, anomalias de autoria e taxa de conformidade.
- Ações imediatas recomendadas categorizadas por prioridade de mitigação.

### 2. Auditor de Segredos & Entropia de Shannon
- Detecção determinística de credenciais em repouso (chaves AWS, tokens JWT, certificados RSA/SSH, chaves privadas e senhas em arquivos de configuração).
- **Cálculo da Entropia da Informação de Shannon**:
  $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
- Limiar (*threshold*) de entropia ajustável em tempo real para filtrar falsos positivos e destacar sequências aleatórias de alta densidade criptográfica.
- **Investigação Direta no GitHub**: Links diretos com âncoras de linha (`#L42`) para navegação imediata até o trecho no repositório.

### 3. Supply Chain, SBOM & Vulnerabilidades (CVEs)
- Inventário de Software Bill of Materials (SBOM) compatível com múltiplos ecossistemas (`npm`, `PyPI`, `Cargo`, `Go`, `Maven`).
- Identificação de pacotes maliciosos conhecidos, dependências diretas vs. transitivas e licenças de software.
- Correlação de vulnerabilidades com a base do **National Vulnerability Database (NVD)** e avisos de segurança oficiais.
- Filtros por nível de risco (*Todos*, *Vulneráveis*, *Malware*, *Seguras*), ecossistema e ordenações por severidade e quantidade de CVEs.
- Links para os arquivos de manifesto do repositório (`package.json`, `requirements.txt`, `Cargo.toml`).

### 4. Linha do Tempo Forense & Anomalias de Commits
- Rastreamento cronológico de atividade suspeita no histórico do Git.
- **Detecção de Padrões Anômalos**:
  - Commits fora do horário comercial (*After-Hours commits*).
  - Suspeita de falsificação de identidade (*Author Spoofing*).
  - Termos de risco em mensagens de commit (`bypass`, `eval`, `token leak`, `hotfix credential`).
- Filtros avançados por anomalia, busca textual de autores/hashes SHA e ordenação por churn e risco.
- Links clicáveis para o diff completo de cada commit no GitHub.

### 5. Topologia de Arquitetura & Vetores de Ameaça
- Mapa visual de conexões entre microsserviços, gateways de API, bancos de dados e serviços em nuvem.
- Análise de zonas desprotegidas e conexões de rede em risco com rotulagem clara de severidade.

### 6. Explorador & Busca Livre Multicamada
- Motor de pesquisa por expressões regulares e termos livres varrendo paralelamente:
  - Nomes de arquivos e caminhos de diretório.
  - Mensagens e identificadores de commit.
  - Dependências declaradas e CVEs.
  - Trechos de código e linhas suspeitas.

### 7. Central de Relatórios & Exportação Executiva
- **Relatório Forense em Markdown**: Documentação completa e pronta para anexar a relatórios técnicos.
- **Central de Impressão & Exportação A4 (PDF)**:
  - Janela modal dedicada com suporte a visualização prévia.
  - Folha de estilo de mídia para impressão (`@media print`) limpa e sem elementos de interface.
  - Opção de download de arquivo HTML autônomo com auto-impressão integrada.
- **Sessão Forense (JSON)**: Exportação e importação de snapshots completos de auditoria para persistência offline.
- **Síntese Analítica Opcional via IA (Nível 3)**: Integração com provedores de IA sob demanda mantendo guardrail estrito.

---

## 🔒 Modelo de Segurança & Privacidade

| Princípio | Implementação no repo-forensics |
| :--- | :--- |
| **100% Client-Side** | Nenhuma linha de código ou credencial é enviada a servidores intermediários. |
| **Zero Telemetria** | Sem cookies de rastreamento, Google Analytics ou bibliotecas de monitoramento. |
| **Isolamento de Credenciais** | Personal Access Tokens (PAT) e chaves de IA ficam restritos ao `localStorage` do seu navegador. |
| **Purga Instantânea (Wipe)** | Botão de purga completa nas configurações que elimina todos os tokens salvos em um clique. |

---

## 🛠️ Stack Tecnológica

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) com temas Claro/Escuro
- **Gerenciamento de Estado**: [Zustand](https://github.com/pmndrs/zustand)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Análise Criptográfica**: Implementação nativa de Entropia de Shannon
- **Testes**: [Vitest](https://vitest.dev/) com Testing Library e JSDOM

---

## 🚀 Instalação e Execução

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- Gerenciador de pacotes `npm`

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/repo-forensics.git
cd repo-forensics
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
O aplicativo estará disponível em: `http://localhost:3000`

### 4. Gerar build de produção
```bash
npm run build
```

---

## 🧪 Testes Automatizados

O projeto conta com ampla cobertura de testes unitários e de integração para os utilitários de entropia, persistência, busca, exportação e componentes de interface.

Para executar toda a suíte de testes:
```bash
npm run test
```

Para validar a tipagem estática do TypeScript:
```bash
npm run lint
```

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte o arquivo de licença para mais detalhes.

repo-forensics • Analisador de repositórios do GitHub • © 2026
