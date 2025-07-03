# Sistema E-commerce - Mercado Digital

Sistema completo de e-commerce com integração de HTML, CSS como estrutura e estilo, MySQL e JavaScript
para funcionalidade operacional de conexão direta ao banco de dados para pixar informações e utilização 
de nodes_modules para dependências externas na estrutura do codigo

## 🚀 Funcionalidades

### 📊 **Dashboard**
- Estatísticas em tempo real
- Contadores de clientes, produtos, pedidos e entregas
- Integração com banco de dados MySQL

### 👥 **Gestão de Clientes**
- Cadastro de Pessoa Física (PF) e Pessoa Jurídica (PJ)
- CRUD completo integrado com MySQL
- Validação de CPF/CNPJ
- Sistema de contas vinculadas

### 💳 **Sistema de Pagamentos**
- Múltiplas formas de pagamento
- Integração com tabela de pagamentos
- Suporte a: Dinheiro, Cartão, PIX, Boleto

### 📦 **Produtos**
- Catálogo completo de produtos
- Controle de estoque
- Categorização
- Upload de imagens

### 🛒 **Pedidos**
- Criação de pedidos com múltiplos produtos
- Cálculo automático de totais
- Múltiplas formas de pagamento por pedido
- Status de acompanhamento

### 🚚 **Entregas**
- Códigos de rastreio únicos
- Status de entrega em tempo real

## 🛠️ **Tecnologias Utilizadas**

### Backend
- **Node.js** - Runtime JavaScript
- **MySQL** - Driver MySQL para Node.js
- **CORS** - Middleware para requisições cross-origin

### Frontend
- **HTML** - Estrutura
- **CSS** - Estilização moderna
- **JavaScript** - Lógica da aplicação
- **Fetch API** - Comunicação com backend

### Banco de Dados
- **MySQL** - Sistema de gerenciamento de banco de dados
- **Transações** - Garantia de integridade dos dados
- **Foreign Keys** - Relacionamentos entre tabelas

## 📋 **Pré-requisitos**
- Node.js (versão 14 ou superior)
- MySQL Server
- NPM

## ⚙️ **Instalação**

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd mercado-digital
```
### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados
Execute o script SQL fornecido no MySQL:

```
Copie e cole o documento 
```

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

O servidor estará rodando em `http://localhost:3000`

## 🔄 **API Endpoints**

### Clientes
- `GET /api/clientes` - Listar todos os clientes
- `POST /api/clientes` - Criar novo cliente
- `GET /api/clientes/:id` - Buscar cliente por ID
- `PUT /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Deletar cliente

### Pagamentos
- `GET /api/clientes/:id/pagamentos` - Listar pagamentos do cliente
- `POST /api/pagamentos` - Criar novo pagamento

### Dashboard
- `GET /api/dashboard` - Estatísticas gerais
## 📱 **Como Usar**

### 1. **Dashboard**
- Visualize estatísticas gerais do sistema
- Monitore totais de clientes, produtos, pedidos e entregas

### 2. **Cadastro de Clientes**
- Clique em "Novo Cliente"
- Selecione o tipo (PF ou PJ)
- Preencha os dados obrigatórios
- Salve para criar no banco de dados

### 3. **Gestão de Produtos**
- Adicione produtos com imagens
- Controle estoque
- Categorize produtos
- nomeamento de produto
- Salvamento de alteração no banco de dados permanentemente

### 4. **Criação de Pedidos**
- Selecione cliente
- Adicione produtos e quantidades
- Configure formas de pagamento
- O sistema criará automaticamente:
  - Registro de pagamento no MySQL
  - Entrega com código de rastreio

### 5. **Acompanhamento de Entregas**
- Visualize status em tempo real
- Atualize status conforme necessário
- Filtre por status de entrega

## 🔒 **Segurança**

- Transações MySQL para integridade dos dados
- Validação de dados no frontend e backend
- Relacionamentos com Foreign Keys
- Constraints para garantir consistência

## 🎨 **Interface**

- Design responsivo e moderno
- Navegação intuitiva
- Notificações em tempo real
- Modais para formulários
- Tabelas e grids organizados

## 📊 **Estrutura do Banco**

```
e_comerce/
├── cliente_pf (id, nome, cpf)
├── cliente_pj (id, razao_social, cnpj)
├── conta (id, tipo, id_cliente_pf, id_cliente_pj)
└── pagamento (id, tipo, dados, id_conta)
```

## 🚀 **Próximos Passos**

- [ ] Autenticação de usuários
- [ ] Relatórios avançados
- [ ] Integração com APIs de pagamento
- [ ] Sistema de notificações
- [ ] App mobile

## 📞 **Suporte**

Para dúvidas ou problemas:
1. Verifique se o MySQL está rodando
2. Confirme as credenciais de conexão
3. Verifique os logs do servidor
4. Teste as rotas da API individualmente

---

**Desenvolvido com ❤️ usando Node.js, MySQL e JavaScript**