// ==================== CONFIGURAÇÕES GLOBAIS ====================
const API_BASE_URL = 'http://localhost:3000/api';

// Estado global da aplicação
let currentUser = null;
let currentUserType = null;
let carrinho = [];
let produtos = [];
let clientes = [];
let pedidos = [];
let entregas = [];

// ==================== FUNÇÕES DE UTILIDADE ====================

// Função para fazer requisições HTTP
async function apiRequest(endpoint, options = {}) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        console.log(`Fazendo requisição para: ${url}`);
        if (options.body) {
            console.log('Dados enviados:', options.body);
        }
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erro ${response.status}:`, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Resposta recebida:', data);
        return data;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Adicionar estilos inline
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Definir cor baseada no tipo
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
    }
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para formatar data
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

// ==================== FUNÇÕES DE AUTENTICAÇÃO ====================

// Toggle entre formulários de login e cadastro
function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginLinks = document.querySelectorAll('.login-demo p');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginLinks[0].style.display = 'block';
        loginLinks[1].style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        loginLinks[0].style.display = 'none';
        loginLinks[1].style.display = 'block';
    }
}

// Toggle campos PF/PJ no cadastro
document.addEventListener('DOMContentLoaded', function() {
    const tipoPF = document.getElementById('tipoPF');
    const tipoPJ = document.getElementById('tipoPJ');
    const camposPF = document.getElementById('campos-pf');
    const camposPJ = document.getElementById('campos-pj');
    
    function toggleCampos() {
        if (tipoPF.checked) {
            camposPF.style.display = 'block';
            camposPJ.style.display = 'none';
        } else {
            camposPF.style.display = 'none';
            camposPJ.style.display = 'block';
        }
    }
    
    tipoPF.addEventListener('change', toggleCampos);
    tipoPJ.addEventListener('change', toggleCampos);
    
    // Inicializar
    toggleCampos();
});

// Login demo
function loginDemo(type) {
    if (type === 'admin') {
        currentUser = { email: 'admin@mercadodigital.com', tipo: 'admin' };
        currentUserType = 'admin';
        showOwnerInterface();
    } else {
        currentUser = { email: 'cliente@exemplo.com', tipo: 'PF', nome: 'Cliente Demo', id: 1 };
        currentUserType = 'user';
        showUserInterface();
    }
    showNotification('Login realizado com sucesso!', 'success');
}

// Processar login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const loginData = {
            email: email,
            password: password
        };
        
        // Verifica se é o admin
        if (email === 'admin@mercadodigital.com') {
            currentUser = { 
                email: 'admin@mercadodigital.com', 
                tipo: 'admin', 
                nome: 'Administrador',
                id: 1
            };
            currentUserType = 'admin';
            showOwnerInterface();
            showNotification('Login realizado com sucesso!', 'success');
            return;
        }
        
        // Busca cliente no banco
        const clientes = await apiRequest('/clientes');
        const clienteEncontrado = clientes.find(c => c.email === email);
        
        if (clienteEncontrado) {
            currentUser = {
                id: clienteEncontrado.id,
                email: clienteEncontrado.email,
                tipo: clienteEncontrado.tipo,
                nome: clienteEncontrado.nome_razao || clienteEncontrado.nome || 'Cliente'
            };
            currentUserType = 'user';
            showUserInterface();
            showNotification('Login realizado com sucesso!', 'success');
        } else {
            throw new Error('Usuário não encontrado');
        }
        
    } catch (error) {
        showNotification('Erro no login: ' + error.message, 'error');
    }
});

// Processar cadastro
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const tipo = document.querySelector('input[name="tipo"]:checked').value;
        
        const clienteData = {
            tipo: tipo,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            endereco: document.getElementById('endereco').value
        };
        
        if (tipo === 'PF') {
            clienteData.nome = document.getElementById('nome').value;
            clienteData.cpf = document.getElementById('cpf').value;
            clienteData.dataNascimento = document.getElementById('dataNascimento').value;
        } else {
            clienteData.razaoSocial = document.getElementById('razaoSocial').value;
            clienteData.cnpj = document.getElementById('cnpj').value;
            clienteData.inscricaoEstadual = document.getElementById('inscricaoEstadual').value;
            clienteData.nomeFantasia = document.getElementById('nomeFantasia') ? document.getElementById('nomeFantasia').value : null;
        }
        
        // Validar campos obrigatórios
        if (!clienteData.email || !clienteData.telefone || !clienteData.endereco) {
            showNotification('Email, telefone e endereço são obrigatórios', 'error');
            return;
        }
        
        if (tipo === 'PF' && (!clienteData.nome || !clienteData.cpf)) {
            showNotification('Nome e CPF são obrigatórios para Pessoa Física', 'error');
            return;
        }
        
        if (tipo === 'PJ' && (!clienteData.razaoSocial || !clienteData.cnpj || !clienteData.inscricaoEstadual)) {
            showNotification('Razão Social, CNPJ e Inscrição Estadual são obrigatórios para Pessoa Jurídica', 'error');
            return;
        }
        
        console.log('Enviando dados do cliente:', clienteData);
        
        const response = await apiRequest('/clientes', {
            method: 'POST',
            body: JSON.stringify(clienteData)
        });
        
        if (response.success) {
            showNotification('Cadastro realizado com sucesso!', 'success');
            document.getElementById('registerForm').reset();
            
            // Fazer login automático após cadastro
            currentUser = {
                id: response.contaId,
                email: clienteData.email,
                tipo: clienteData.tipo,
                nome: clienteData.tipo === 'PF' ? clienteData.nome : clienteData.razaoSocial
            };
            currentUserType = 'user';
            showUserInterface();
            
            toggleForm(); // Voltar para o login
        } else {
            showNotification('Erro no cadastro: ' + (response.error || 'Erro desconhecido'), 'error');
        }
    } catch (error) {
        console.error('Erro detalhado:', error);
        showNotification('Erro ao realizar cadastro: ' + error.message, 'error');
    }
});

// Logout
function logout() {
    currentUser = null;
    currentUserType = null;
    carrinho = [];
    
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('userInterface').classList.add('hidden');
    document.getElementById('ownerInterface').classList.add('hidden');
    
    showNotification('Logout realizado com sucesso!', 'success');
}

// ==================== FUNÇÕES DE INTERFACE ====================

// Mostrar interface do usuário
function showUserInterface() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('userInterface').classList.remove('hidden');
    document.getElementById('ownerInterface').classList.add('hidden');
    
    // Atualizar informações do usuário
    document.getElementById('user-email').textContent = currentUser.nome || currentUser.email;
    document.getElementById('user-type').textContent = currentUser.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica';
    
    // Carregar dados iniciais
    carregarProdutosUser();
    carregarPedidosUser();
    carregarEntregasUser();
}

// Mostrar interface do admin
function showOwnerInterface() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('userInterface').classList.add('hidden');
    document.getElementById('ownerInterface').classList.remove('hidden');
    
    // Carregar dados iniciais
    setTimeout(() => {
        carregarDashboard();
        carregarClientes();
        carregarProdutos();
        carregarPedidos();
        carregarEntregas();
    }, 100);
}

// Navegação entre seções
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('nav-link')) {
        e.preventDefault();
        
        const targetSection = e.target.getAttribute('data-section');
        
        // Remover classe active de todos os links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Adicionar classe active ao link clicado
        e.target.classList.add('active');
        
        // Esconder todas as seções
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar seção alvo
        const section = document.getElementById(targetSection);
        if (section) {
            section.classList.add('active');
        }
    }
});

// ==================== FUNÇÕES DO DASHBOARD ====================

async function carregarDashboard() {
    try {
        console.log('Carregando dashboard...');
        const stats = await apiRequest('/dashboard');
        console.log('Stats recebidas:', stats);
        
        document.getElementById('total-clientes').textContent = stats.totalClientes || 0;
        document.getElementById('total-produtos').textContent = stats.totalProdutos || 0;
        document.getElementById('total-pedidos').textContent = stats.totalPedidos || 0;
        document.getElementById('total-entregas').textContent = stats.totalEntregas || 0;
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        // Definir valores padrão em caso de erro
        document.getElementById('total-clientes').textContent = '0';
        document.getElementById('total-produtos').textContent = '0';
        document.getElementById('total-pedidos').textContent = '0';
        document.getElementById('total-entregas').textContent = '0';
    }
}

// ==================== FUNÇÕES DE CLIENTES ====================

async function carregarClientes() {
    try {
        clientes = await apiRequest('/clientes');
        renderizarClientes();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showNotification('Erro ao carregar clientes', 'error');
    }
}

function renderizarClientes() {
    const tbody = document.getElementById('clientes-tbody');
    if (!tbody) {
        console.warn('Elemento clientes-tbody não encontrado');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!clientes || clientes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center; padding: 20px;">Nenhum cliente cadastrado</td>';
        tbody.appendChild(row);
        return;
    }
    
    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cliente.id}</td>
            <td>${cliente.nome_razao || cliente.nome || cliente.razaoSocial || 'N/A'}</td>
            <td>${cliente.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</td>
            <td>${cliente.documento || cliente.cpf || cliente.cnpj || 'N/A'}</td>
            <td>${cliente.email}</td>
            <td>${cliente.telefone || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== FUNÇÕES DE PRODUTOS ====================

async function carregarProdutos() {
    try {
        produtos = await apiRequest('/produtos');
        renderizarProdutos();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showNotification('Erro ao carregar produtos', 'error');
    }
}

function renderizarProdutos() {
    const grid = document.getElementById('produtos-grid');
    grid.innerHTML = '';
    
    produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${produto.imagem || 'https://via.placeholder.com/200x150?text=Produto'}" alt="${produto.nome}">
            </div>
            <div class="product-info">
                <h3>${produto.nome}</h3>
                <p class="product-category">${produto.categoria}</p>
                <p class="product-description">${produto.descricao || ''}</p>
                <div class="product-price">${formatCurrency(produto.preco)}</div>
                <div class="product-stock">Estoque: ${produto.estoque}</div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-small" onclick="editarProduto(${produto.id})">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="excluirProduto(${produto.id})">Excluir</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function carregarProdutosUser() {
    try {
        produtos = await apiRequest('/produtos');
        renderizarProdutosUser();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showNotification('Erro ao carregar produtos', 'error');
    }
}

function renderizarProdutosUser() {
    const grid = document.getElementById('user-produtos-grid');
    grid.innerHTML = '';
    
    produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${produto.imagem || 'https://via.placeholder.com/200x150?text=Produto'}" alt="${produto.nome}">
            </div>
            <div class="product-info">
                <h3>${produto.nome}</h3>
                <p class="product-category">${produto.categoria}</p>
                <p class="product-description">${produto.descricao || ''}</p>
                <div class="product-price">${formatCurrency(produto.preco)}</div>
                <div class="product-stock">Estoque: ${produto.estoque}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="adicionarAoCarrinho(${produto.id})" ${produto.estoque <= 0 ? 'disabled' : ''}>
                        ${produto.estoque <= 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Salvar produto
async function salvarProduto(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const produtoData = {
            nome: formData.get('nome'),
            categoria: formData.get('categoria'),
            descricao: formData.get('descricao'),
            preco: parseFloat(formData.get('preco')),
            estoque: parseInt(formData.get('estoque')),
            imagem: formData.get('imagem')
        };
        
        const response = await apiRequest('/produtos', {
            method: 'POST',
            body: JSON.stringify(produtoData)
        });
        
        if (response.success) {
            showNotification('Produto salvo com sucesso!', 'success');
            closeModal('produtoModal');
            carregarProdutos();
            event.target.reset();
        }
    } catch (error) {
        showNotification('Erro ao salvar produto: ' + error.message, 'error');
    }
}

// Excluir produto
async function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            const response = await apiRequest(`/produtos/${id}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                showNotification('Produto excluído com sucesso!', 'success');
                carregarProdutos();
            }
        } catch (error) {
            showNotification('Erro ao excluir produto: ' + error.message, 'error');
        }
    }
}

// ==================== FUNÇÕES DO CARRINHO ====================

function adicionarAoCarrinho(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    
    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
        if (itemExistente.quantidade < produto.estoque) {
            itemExistente.quantidade++;
        } else {
            showNotification('Quantidade máxima em estoque atingida', 'warning');
            return;
        }
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: 1,
            imagem: produto.imagem
        });
    }
    
    atualizarCarrinho();
    showNotification('Produto adicionado ao carrinho!', 'success');
}

function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    atualizarCarrinho();
}

function alterarQuantidade(produtoId, novaQuantidade) {
    const item = carrinho.find(item => item.id === produtoId);
    if (item) {
        if (novaQuantidade <= 0) {
            removerDoCarrinho(produtoId);
        } else {
            item.quantidade = novaQuantidade;
            atualizarCarrinho();
        }
    }
}

function atualizarCarrinho() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    // Atualizar contador
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    cartCount.textContent = totalItens;
    
    // Atualizar itens
    cartItems.innerHTML = '';
    let total = 0;
    
    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.imagem || 'https://via.placeholder.com/80x60?text=Produto'}" alt="${item.nome}">
            </div>
            <div class="cart-item-info">
                <h4>${item.nome}</h4>
                <p>${formatCurrency(item.preco)}</p>
            </div>
            <div class="cart-item-quantity">
                <button onclick="alterarQuantidade(${item.id}, ${item.quantidade - 1})">-</button>
                <span>${item.quantidade}</span>
                <button onclick="alterarQuantidade(${item.id}, ${item.quantidade + 1})">+</button>
            </div>
            <div class="cart-item-total">
                ${formatCurrency(subtotal)}
            </div>
            <button class="cart-item-remove" onclick="removerDoCarrinho(${item.id})">×</button>
        `;
        cartItems.appendChild(itemElement);
    });
    
    // Atualizar total
    cartTotal.textContent = formatCurrency(total);
    
    // Habilitar/desabilitar botão de checkout
    checkoutBtn.disabled = carrinho.length === 0;
    
    if (carrinho.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
    }
}

// ==================== FUNÇÕES DE PEDIDOS ====================

async function carregarPedidos() {
    try {
        pedidos = await apiRequest('/pedidos');
        renderizarPedidos();
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        showNotification('Erro ao carregar pedidos', 'error');
    }
}

function renderizarPedidos() {
    const tbody = document.getElementById('pedidos-tbody');
    tbody.innerHTML = '';
    
    pedidos.forEach(pedido => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pedido.id}</td>
            <td>${pedido.cliente_nome}</td>
            <td>${formatDate(pedido.data_pedido)}</td>
            <td>${formatCurrency(pedido.total)}</td>
            <td><span class="status-badge status-${pedido.status}">${pedido.status}</span></td>
            <td>${pedido.forma_pagamento || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

async function carregarPedidosUser() {
    try {
        if (!currentUser || !currentUser.id) {
            const pedidosGrid = document.getElementById('user-pedidos-grid');
            pedidosGrid.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
            return;
        }

        // Buscar pedidos do usuário atual
        const response = await apiRequest(`/pedidos/cliente/${currentUser.id}`);
        const pedidosUsuario = response || [];
        
        renderizarPedidosUser(pedidosUsuario);
    } catch (error) {
        console.error('Erro ao carregar pedidos do usuário:', error);
        const pedidosGrid = document.getElementById('user-pedidos-grid');
        pedidosGrid.innerHTML = '<p>Erro ao carregar pedidos. Tente novamente.</p>';
    }
}

function renderizarPedidosUser(pedidosUsuario) {
    const pedidosGrid = document.getElementById('user-pedidos-grid');
    pedidosGrid.innerHTML = '';
    
    if (!pedidosUsuario || pedidosUsuario.length === 0) {
        pedidosGrid.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
        return;
    }
    
    pedidosUsuario.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'pedido-card';
        card.innerHTML = `
            <div class="pedido-header">
                <h3>Pedido #${pedido.id}</h3>
                <span class="status-badge status-${pedido.status}">${getStatusText(pedido.status)}</span>
            </div>
            <div class="pedido-info">
                <p><strong>Data:</strong> ${formatDate(pedido.data_pedido)}</p>
                <p><strong>Total:</strong> ${formatCurrency(pedido.total)}</p>
                <p><strong>Forma de Pagamento:</strong> ${getFormaPagamentoText(pedido.forma_pagamento)}</p>
                ${pedido.observacoes ? `<p><strong>Observações:</strong> ${pedido.observacoes}</p>` : ''}
            </div>
            <div class="pedido-actions">
                <button class="btn btn-primary btn-small" onclick="verDetalhesPedido(${pedido.id})">Ver Detalhes</button>
                ${pedido.codigo_rastreio ? `<button class="btn btn-secondary btn-small" onclick="rastrearPedido('${pedido.codigo_rastreio}')">Rastrear</button>` : ''}
            </div>
        `;
        pedidosGrid.appendChild(card);
    });
}

function getStatusText(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'preparando': 'Preparando',
        'enviado': 'Enviado',
        'entregue': 'Entregue',
        'finalizado': 'Finalizado',
        'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
}

function getFormaPagamentoText(formaPagamento) {
    const formaMap = {
        'dinheiro': 'Dinheiro',
        'cartao-credito': 'Cartão de Crédito',
        'cartao-debito': 'Cartão de Débito',
        'pix': 'PIX',
        'boleto': 'Boleto'
    };
    return formaMap[formaPagamento] || formaPagamento;
}

function verDetalhesPedido(pedidoId) {
    // Implementar modal com detalhes do pedido
    showNotification('Funcionalidade de detalhes em desenvolvimento', 'info');
}

function rastrearPedido(codigoRastreio) {
    showNotification(`Rastreando pedido: ${codigoRastreio}`, 'info');
}

// Finalizar compra
function finalizarCompra() {
    if (carrinho.length === 0) return;
    
    // Atualizar modal de checkout
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    
    checkoutItems.innerHTML = '';
    let total = 0;
    
    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'checkout-item';
        itemElement.innerHTML = `
            <span>${item.nome} x ${item.quantidade}</span>
            <span>${formatCurrency(subtotal)}</span>
        `;
        checkoutItems.appendChild(itemElement);
    });
    
    checkoutTotal.textContent = formatCurrency(total);
    openModal('checkoutModal');
}

// Processar compra
async function processarCompra(event) {
    event.preventDefault();
    
    try {
        const formaPagamento = document.getElementById('checkout-pagamento').value;
        
        if (!currentUser || !currentUser.id) {
            showNotification('Usuário não identificado', 'error');
            return;
        }
        
        const pedidoData = {
            id_conta: currentUser.id || 1, // Para demo
            data_pedido: new Date().toISOString().split('T')[0],
            produtos: carrinho.map(item => ({
                id_produto: item.id,
                quantidade: item.quantidade
            })),
            formas_pagamento: [{
                tipo: formaPagamento,
                valor: carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0)
            }],
            observacoes: 'Pedido realizado via sistema web'
        };
        
        const response = await apiRequest('/pedidos', {
            method: 'POST',
            body: JSON.stringify(pedidoData)
        });
        
        if (response.success) {
            showNotification('Pedido realizado com sucesso!', 'success');
            carrinho = [];
            atualizarCarrinho();
            closeModal('checkoutModal');
            carregarPedidosUser();
        }
    } catch (error) {
        showNotification('Erro ao processar pedido: ' + error.message, 'error');
    }
}

// ==================== FUNÇÕES DE ENTREGAS ====================

async function carregarEntregas() {
    try {
        entregas = await apiRequest('/entregas');
        renderizarEntregas();
    } catch (error) {
        console.error('Erro ao carregar entregas:', error);
        showNotification('Erro ao carregar entregas', 'error');
    }
}

function renderizarEntregas() {
    const grid = document.getElementById('entregas-grid');
    grid.innerHTML = '';
    
    entregas.forEach(entrega => {
        const card = document.createElement('div');
        card.className = 'entrega-card';
        card.innerHTML = `
            <div class="entrega-header">
                <h3>Pedido #${entrega.pedido_id}</h3>
                <span class="status-badge status-${entrega.status}">${entrega.status}</span>
            </div>
            <div class="entrega-info">
                <p><strong>Cliente:</strong> ${entrega.cliente_nome}</p>
                <p><strong>Código:</strong> ${entrega.codigo_rastreio}</p>
                <p><strong>Endereço:</strong> ${entrega.endereco_entrega}</p>
                <p><strong>Previsão:</strong> ${formatDate(entrega.previsao_entrega)}</p>
                ${entrega.data_confirmacao ? `<p><strong>Confirmado em:</strong> ${formatDate(entrega.data_confirmacao)}</p>` : ''}
            </div>
            <div class="entrega-actions">
                ${entrega.status === 'confirmada' ? 
                    '<p class="status-final">✅ Entrega confirmada pelo cliente</p>' :
                    `<select onchange="atualizarStatusEntrega(${entrega.id}, this.value)">
                        <option value="">Alterar Status</option>
                        <option value="preparando" ${entrega.status === 'preparando' ? 'selected' : ''}>Preparando</option>
                        <option value="enviado" ${entrega.status === 'enviado' ? 'selected' : ''}>Enviado</option>
                        <option value="transito" ${entrega.status === 'transito' ? 'selected' : ''}>Em Trânsito</option>
                        <option value="entregue" ${entrega.status === 'entregue' ? 'selected' : ''}>Entregue</option>
                    </select>`
                }
            </div>
        `;
        grid.appendChild(card);
    });
}

async function carregarEntregasUser() {
    try {
        if (!currentUser || !currentUser.id) {
            const entregasGrid = document.getElementById('user-entregas-grid');
            entregasGrid.innerHTML = '<p>Você não possui entregas no momento.</p>';
            return;
        }

        // Buscar entregas do usuário atual
        const response = await apiRequest(`/entregas/cliente/${currentUser.id}`);
        const entregasUsuario = response || [];
        
        renderizarEntregasUser(entregasUsuario);
    } catch (error) {
        console.error('Erro ao carregar entregas do usuário:', error);
        const entregasGrid = document.getElementById('user-entregas-grid');
        entregasGrid.innerHTML = '<p>Erro ao carregar entregas. Tente novamente.</p>';
    }
}

function renderizarEntregasUser(entregasUsuario) {
    const entregasGrid = document.getElementById('user-entregas-grid');
    entregasGrid.innerHTML = '';
    
    if (!entregasUsuario || entregasUsuario.length === 0) {
        entregasGrid.innerHTML = '<p>Você não possui entregas no momento.</p>';
        return;
    }
    
    entregasUsuario.forEach(entrega => {
        const card = document.createElement('div');
        card.className = 'entrega-card';
        card.innerHTML = `
            <div class="entrega-header">
                <h3>Pedido #${entrega.pedido_id}</h3>
                <span class="status-badge status-${entrega.status}">${getStatusText(entrega.status)}</span>
            </div>
            <div class="entrega-info">
                <p><strong>Código de Rastreio:</strong> ${entrega.codigo_rastreio}</p>
                <p><strong>Endereço:</strong> ${entrega.endereco_entrega}</p>
                <p><strong>Previsão de Entrega:</strong> ${formatDate(entrega.previsao_entrega)}</p>
                ${entrega.data_envio ? `<p><strong>Data de Envio:</strong> ${formatDate(entrega.data_envio)}</p>` : ''}
                ${entrega.data_entrega ? `<p><strong>Data de Entrega:</strong> ${formatDate(entrega.data_entrega)}</p>` : ''}
            </div>
            <div class="entrega-actions">
                ${entrega.status === 'entregue' && entrega.status !== 'confirmada' ? 
                    `<button class="btn btn-primary btn-small" onclick="confirmarEntrega(${entrega.id})">Confirmar Recebimento</button>` : 
                    ''
                }
            </div>
        `;
        entregasGrid.appendChild(card);
    });
}

async function confirmarEntrega(entregaId) {
    try {
        console.log('Confirmando entrega com ID:', entregaId);
        const response = await apiRequest(`/entregas/${entregaId}/confirmar`, {
            method: 'PUT'
        });
        
        if (response.success) {
            showNotification('Entrega confirmada com sucesso!', 'success');
            carregarEntregasUser();
            carregarPedidosUser();
        }
    } catch (error) {
        const errorMessage = error.message.includes('HTTP error! status: 500')
            ? 'Erro no servidor ao confirmar entrega. Tente novamente mais tarde.'
            : error.message.includes('HTTP error! status: 404')
            ? 'Entrega não encontrada.'
            : error.message.includes('HTTP error! status:  bers')
            ? 'Entrega já confirmada ou não está no status correto.'
            : 'Erro ao confirmar entrega: ' + error.message;
        showNotification(errorMessage, 'error');
    }
}

async function atualizarStatusEntrega(id, novoStatus) {
    if (!novoStatus) return;
    
    try {
        const response = await apiRequest(`/entregas/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: novoStatus })
        });
        
        if (response.success) {
            showNotification('Status da entrega atualizado!', 'success');
            carregarEntregas();
        }
    } catch (error) {
        showNotification('Erro ao atualizar entrega: ' + error.message, 'error');
    }
}


// ==================== FUNÇÕES DE MODAL ====================

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Fechar modal clicando fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ==================== FUNÇÕES DE FILTRO ====================

function filtrarProdutos() {
    const categoria = document.getElementById('categoria-filter').value;
    const produtosFiltrados = categoria ? produtos.filter(p => p.categoria === categoria) : produtos;
    
    const grid = document.getElementById('user-produtos-grid');
    grid.innerHTML = '';
    
    produtosFiltrados.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${produto.imagem || 'https://via.placeholder.com/200x150?text=Produto'}" alt="${produto.nome}">
            </div>
            <div class="product-info">
                <h3>${produto.nome}</h3>
                <p class="product-category">${produto.categoria}</p>
                <p class="product-description">${produto.descricao || ''}</p>
                <div class="product-price">${formatCurrency(produto.preco)}</div>
                <div class="product-stock">Estoque: ${produto.estoque}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="adicionarAoCarrinho(${produto.id})" ${produto.estoque <= 0 ? 'disabled' : ''}>
                        ${produto.estoque <= 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filtrarEntregas() {
    const status = document.getElementById('filtro-status').value;
    const entregasFiltradas = status ? entregas.filter(e => e.status === status) : entregas;
    
    const grid = document.getElementById('entregas-grid');
    grid.innerHTML = '';
    
    entregasFiltradas.forEach(entrega => {
        const card = document.createElement('div');
        card.className = 'entrega-card';
        card.innerHTML = `
            <div class="entrega-header">
                <h3>Pedido #${entrega.pedido_id}</h3>
                <span class="status-badge status-${entrega.status}">${entrega.status}</span>
            </div>
            <div class="entrega-info">
                <p><strong>Cliente:</strong> ${entrega.cliente_nome}</p>
                <p><strong>Código:</strong> ${entrega.codigo_rastreio}</p>
                <p><strong>Endereço:</strong> ${entrega.endereco_entrega}</p>
                <p><strong>Previsão:</strong> ${formatDate(entrega.previsao_entrega)}</p>
            </div>
            <div class="entrega-actions">
                <select onchange="atualizarStatusEntrega(${entrega.id}, this.value)">
                    <option value="">Alterar Status</option>
                    <option value="preparando" ${entrega.status === 'preparando' ? 'selected' : ''}>Preparando</option>
                    <option value="enviado" ${entrega.status === 'enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="transito" ${entrega.status === 'transito' ? 'selected' : ''}>Em Trânsito</option>
                    <option value="entregue" ${entrega.status === 'entregue' ? 'selected' : ''}>Entregue</option>
                </select>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==================== FUNÇÕES DE UTILIDADE PARA FORMULÁRIOS ====================

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}

// ==================== INICIALIZAÇÃO ====================

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema Mercado Digital inicializado');
    
    // Verificar se o servidor está rodando
    apiRequest('/dashboard')
        .then(() => {
            console.log('Conexão com servidor estabelecida');
        })
        .catch(() => {
            console.warn('Servidor não está rodando - usando modo demo');
            showNotification('Servidor não conectado - usando modo demonstração', 'warning');
        });
    
    // Inicializar carrinho vazio
    atualizarCarrinho();
});
