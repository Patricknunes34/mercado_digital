# Sistema E-commerce - Mercado Digital

Sistema completo de e-commerce com integração de HTML, CSS, JavaScript e MySQL para funcionalidade operacional com conexão direta ao banco de dados para gerenciamento de informações e utilização de node_modules para dependências externas.

## 🚀 Funcionalidades

### 📊 Dashboard Administrativo
- Estatísticas em tempo real
- Contadores de clientes, produtos, pedidos e entregas
- Integração completa com banco de dados MySQL
- Interface intuitiva para gestão geral

### 👥 Gestão de Clientes
- Cadastro de Pessoa Física (PF) e Pessoa Jurídica (PJ)
- CRUD completo integrado com MySQL
- Validação automática de CPF/CNPJ
- Sistema de contas vinculadas
- Histórico completo de atividades

### 💳 Sistema de Pagamentos
- Múltiplas formas de pagamento por pedido
- Integração com tabela de pagamentos no banco
- Suporte a: Dinheiro, Cartão de Crédito, Cartão de Débito, PIX, Boleto
- Processamento seguro de transações

### 📦 Catálogo de Produtos
- Gerenciamento completo de produtos
- Controle de estoque em tempo real
- Sistema de categorização
- Upload e gerenciamento de imagens
- Filtros por categoria

### 🛒 Sistema de Pedidos
- Carrinho de compras interativo
- Criação de pedidos com múltiplos produtos
- Cálculo automático de totais e subtotais
- Múltiplas formas de pagamento por pedido
- Sistema de status de acompanhamento
- Histórico completo de pedidos

### 🚚 Controle de Entregas
- Geração automática de códigos de rastreio únicos
- Atualização de status de entrega em tempo real
- Confirmação de recebimento pelo cliente
- Previsão de entrega automatizada

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript para servidor
- **MySQL2** - Driver MySQL para Node.js com suporte a promises
- **CORS** - Middleware para requisições cross-origin
- **Express** - Framework web para Node.js

### Frontend
- **HTML5** - Estrutura semântica moderna
- **CSS3** - Estilização avançada com design responsivo
- **JavaScript ES6+** - Lógica da aplicação com recursos modernos
- **Fetch API** - Comunicação assíncrona com backend

### Banco de Dados
- **MySQL** - Sistema de gerenciamento de banco de dados relacional
- **Transações** - Garantia de integridade dos dados
- **Foreign Keys** - Relacionamentos consistentes entre tabelas
- **Views** - Consultas otimizadas para relatórios

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior)
- **MySQL Server** (versão 8.0 ou superior)
- **NPM** (incluído com Node.js)
- **Git** (opcional, para controle de versão)

## ⚙️ Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd mercado-digital
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados MySQL

#### 3.1. Criar o banco de dados
Execute o seguinte comando no MySQL:
```sql
CREATE DATABASE e_comerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE e_comerce;
```

#### 3.2. Execute o script SQL
Execute o script SQL completo fornecido no arquivo `database.sql` para criar todas as tabelas, views e relacionamentos necessários.

### 4. Configure a conexão com o banco

Edite o arquivo `server.js` e configure suas credenciais do MySQL:

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'seu_usuario',
    password: 'sua_senha',
    database: 'e_comerce'
};
```

### 5. Inicie o servidor
```bash
npm run dev
```

O servidor estará rodando em: `http://localhost:3000`

## 🔄 Endpoints da API

### Clientes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/clientes` | Listar todos os clientes |
| POST | `/api/clientes` | Criar novo cliente |
| GET | `/api/clientes/:id` | Buscar cliente por ID |
| PUT | `/api/clientes/:id` | Atualizar cliente |
| DELETE | `/api/clientes/:id` | Deletar cliente |
| GET | `/api/clientes/verificar-documento` | Verificar se documento já existe |

### Produtos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/produtos` | Listar produtos ativos |
| POST | `/api/produtos` | Criar novo produto |
| GET | `/api/produtos/:id` | Buscar produto por ID |
| PUT | `/api/produtos/:id` | Atualizar produto |
| DELETE | `/api/produtos/:id` | Deletar produto |

### Pedidos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/pedidos` | Listar todos os pedidos |
| POST | `/api/pedidos` | Criar novo pedido |
| GET | `/api/pedidos/cliente/:id` | Pedidos de um cliente |
| DELETE | `/api/pedidos/:id` | Deletar pedido |

### Entregas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/entregas` | Listar todas as entregas |
| GET | `/api/entregas/cliente/:id` | Entregas de um cliente |
| PUT | `/api/entregas/:id/status` | Atualizar status da entrega |
| PUT | `/api/entregas/:id/confirmar` | Confirmar recebimento |

### Dashboard
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/dashboard` | Estatísticas gerais do sistema |

## 📱 Como Usar

### 1. Acesso ao Sistema
- **URL**: `http://localhost:3000`
- **Admin Demo**: admin@mercadodigital.com
- **Cliente Demo**: Use o botão "Cliente" na tela de login

### 2. Dashboard Administrativo
- Visualize estatísticas gerais do sistema
- Monitore totais de clientes, produtos, pedidos e entregas
- Acesse relatórios em tempo real

### 3. Gestão de Clientes
- Clique em "Clientes" no menu administrativo
- Visualize todos os clientes cadastrados
- Dados organizados por tipo (PF/PJ)

### 4. Cadastro de Produtos
- Acesse "Produtos" no menu administrativo
- Clique em "Novo Produto"
- Preencha: nome, categoria, descrição, preço, estoque
- Adicione URL da imagem (opcional)
- Sistema salva automaticamente no banco

### 5. Experiência do Cliente
- Interface limpa e intuitiva
- Navegação por categorias de produtos
- Carrinho de compras dinâmico
- Processo de checkout simplificado
- Acompanhamento de pedidos e entregas

### 6. Processo de Compra
1. Cliente navega pelo catálogo
2. Adiciona produtos ao carrinho
3. Revisa itens e quantidades
4. Seleciona forma de pagamento
5. Confirma pedido
6. Sistema gera automaticamente:
   - Registro de pagamento no MySQL
   - Entrega com código de rastreio
   - Previsão de entrega

### 7. Controle de Entregas
- Acompanhe status em tempo real
- Atualize status conforme necessário
- Cliente pode confirmar recebimento
- Filtros por status de entrega

## 🔒 Segurança e Integridade

### Banco de Dados
- **Transações MySQL** para integridade dos dados
- **Foreign Keys** para relacionamentos consistentes
- **Constraints** para garantir consistência
- **Soft Delete** para produtos com histórico

### Validações
- Validação de dados no frontend e backend
- Verificação de CPF/CNPJ únicos
- Validação de estoque antes da venda
- Sanitização de inputs do usuário

### Estrutura de Dados
- Separação clara entre PF e PJ
- Histórico completo de transações
- Rastreabilidade de todas as operações

## 🎨 Interface e Design

### Características
- **Design Responsivo** para todos os dispositivos
- **Navegação Intuitiva** com menu dinâmico
- **Tema Escuro Elegante** com detalhes dourados
- **Micro-interações** para melhor UX
- **Feedback Visual** em todas as ações

### Responsividade
- **Desktop** (1200px+): Layout completo
- **Tablet** (768px-1199px): Adaptação do grid
- **Mobile** (320px-767px): Interface otimizada

## 📊 Estrutura do Banco de Dados

```
e_comerce/
├── cliente_pf (id, nome, cpf, email, telefone, endereco)
├── cliente_pj (id, razao_social, cnpj, email, telefone, endereco)
├── conta (id, tipo, id_cliente_pf, id_cliente_pj)
├── produtos (id, nome, categoria, preco, estoque, imagem)
├── pedidos (id, id_conta, data_pedido, total, status)
├── itens_pedido (id, id_pedido, id_produto, quantidade, preco_unitario)
├── pagamento (id, id_pedido, tipo, valor, dados)
├── entregas (id, id_pedido, codigo_rastreio, status, endereco_entrega)
└── view_clientes (view unificada para consultas)
```

## 🚀 Funcionalidades Futuras

- [ ] **Autenticação** avançada com JWT
- [ ] **Relatórios** detalhados e exportação
- [ ] **Integração** com APIs de pagamento (Stripe, PagSeguro)
- [ ] **Sistema de Notificações** em tempo real
- [ ] **Aplicativo Mobile** com React Native
- [ ] **Dashboard Analytics** avançado
- [ ] **Sistema de Cupons** e promoções
- [ ] **Integração com Correios** para rastreamento

## 📞 Suporte e Troubleshooting

### Problemas Comuns

1. **Erro de conexão com MySQL**
   - Verifique se o MySQL está rodando
   - Confirme as credenciais de conexão
   - Teste a conexão manualmente

2. **Servidor não inicia**
   - Verifique se a porta 3000 está livre
   - Confirme se todas as dependências estão instaladas
   - Verifique os logs do console

3. **Problemas com API**
   - Teste as rotas da API individualmente
   - Verifique o network tab do navegador
   - Confirme se o CORS está configurado

### Logs e Debug
```bash
# Verificar logs do servidor
npm run dev

# Testar conexão com banco
mysql -u seu_usuario -p e_comerce

# Verificar se porta está em uso
netstat -an | grep :3000
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Desenvolvedor

**Sistema desenvolvido com:**
- Node.js para backend robusto
- MySQL para persistência confiável
- JavaScript moderno para interface dinâmica
- Design responsivo para todos os dispositivos
