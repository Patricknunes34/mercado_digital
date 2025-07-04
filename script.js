// Sistema de E-commerce - Mercado Digital com MySQL
// Sistema com Usuário e Dono

class MercadoDigital {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.userType = null;
        this.clientes = [];
        this.produtos = [];
        this.pedidos = [];
        this.entregas = [];
        this.carrinho = [];
        this.editandoCliente = null;
        this.editandoProduto = null;
        
        this.init();
    }

    async init() {
        // Não carregar dados até fazer login
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event listeners para navegação
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                const section = e.target.dataset.section;
                if (section) {
                    this.showSection(section);
                    this.updateActiveNav(e.target);
                }
            }
        });

        // Fechar modal clicando fora
        window.onclick = (event) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    // ==================== LOGIN SYSTEM ====================
    
    async loginAs(type) {
        this.userType = type;
        
        // Esconder modal de login
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.remove('active');
        }
        
        if (type === 'user') {
            const userInterface = document.getElementById('userInterface');
            if (userInterface) {
                userInterface.classList.remove('hidden');
            }
            await this.initUserInterface();
        } else {
            const ownerInterface = document.getElementById('ownerInterface');
            if (ownerInterface) {
                ownerInterface.classList.remove('hidden');
            }
            await this.initOwnerInterface();
        }
    }

    logout() {
        this.userType = null;
        this.carrinho = [];
        
        // Esconder interfaces
        const userInterface = document.getElementById('userInterface');
        const ownerInterface = document.getElementById('ownerInterface');
        const loginModal = document.getElementById('loginModal');
        
        if (userInterface) userInterface.classList.add('hidden');
        if (ownerInterface) ownerInterface.classList.add('hidden');
        if (loginModal) loginModal.classList.add('active');
        
        // Reset navegação
        this.showSection(this.userType === 'user' ? 'user-produtos' : 'dashboard');
    }

    // ==================== USER INTERFACE ====================
    
    async initUserInterface() {
        await this.loadProdutos();
        this.renderUserProdutos();
        this.updateCartCount();
        this.setupFormHandlers(); // Add this line to define toggleCheckoutFields
        this.showSection('user-produtos');
    }

    renderUserProdutos() {
        const grid = document.getElementById('user-produtos-grid');
        if (!grid) return;
        
        grid.innerHTML = '';

        this.produtos.forEach(produto => {
            if (produto.estoque > 0) {
                const preco = parseFloat(produto.preco) || 0;
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <img src="${produto.imagem || 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=400'}" 
                         alt="${produto.nome}" class="product-image">
                    <div class="product-content">
                        <div class="product-category">${produto.categoria}</div>
                        <h3 class="product-title">${produto.nome}</h3>
                        <p class="product-description">${produto.descricao || 'Sem descrição disponível'}</p>
                        <div class="product-footer">
                            <span class="product-price">R$ ${preco.toFixed(2)}</span>
                            <span class="product-stock">Estoque: ${produto.estoque}</span>
                        </div>
                        <div class="quantity-selector">
                            <button class="quantity-btn" onclick="mercado.changeQuantity(${produto.id}, -1)">-</button>
                            <input type="number" class="quantity-input" id="qty-${produto.id}" value="1" min="1" max="${produto.estoque}">
                            <button class="quantity-btn" onclick="mercado.changeQuantity(${produto.id}, 1)">+</button>
                        </div>
                        <button class="btn btn-primary btn-full" onclick="mercado.addToCart(${produto.id})">
                            Adicionar ao Carrinho
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            }
        });
    }

    changeQuantity(produtoId, change) {
        const input = document.getElementById(`qty-${produtoId}`);
        if (!input) return;
        
        const produto = this.produtos.find(p => p.id === produtoId);
        if (!produto) return;
        
        let newValue = parseInt(input.value) + change;
        
        if (newValue < 1) newValue = 1;
        if (newValue > produto.estoque) newValue = produto.estoque;
        
        input.value = newValue;
    }

    addToCart(produtoId) {
        const produto = this.produtos.find(p => p.id === produtoId);
        if (!produto) return;
        
        const quantityInput = document.getElementById(`qty-${produtoId}`);
        if (!quantityInput) return;
        
        const quantidade = parseInt(quantityInput.value) || 1;
        const preco = parseFloat(produto.preco) || 0;
        
        const existingItem = this.carrinho.find(item => item.id === produtoId);
        
        if (existingItem) {
            existingItem.quantidade += quantidade;
        } else {
            this.carrinho.push({
                id: produto.id,
                nome: produto.nome,
                preco: preco,
                imagem: produto.imagem,
                quantidade: quantidade
            });
        }
        
        this.updateCartCount();
        this.showNotification('Produto adicionado ao carrinho!', 'success');
        quantityInput.value = 1;
    }

    updateCartCount() {
        const count = this.carrinho.reduce((total, item) => total + (parseInt(item.quantidade) || 0), 0);
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = count;
        }
    }

    renderCarrinho() {
        const container = document.getElementById('cart-items');
        const totalElement = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (!container || !totalElement || !checkoutBtn) return;
        
        if (this.carrinho.length === 0) {
            container.innerHTML = '<div class="empty-cart">Seu carrinho está vazio</div>';
            totalElement.textContent = 'R$ 0,00';
            checkoutBtn.disabled = true;
            return;
        }
        
        container.innerHTML = '';
        let total = 0;
        
        this.carrinho.forEach(item => {
            const preco = parseFloat(item.preco) || 0;
            const quantidade = parseInt(item.quantidade) || 0;
            const itemTotal = preco * quantidade;
            total += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.imagem || 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=400'}" 
                     alt="${item.nome}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nome}</div>
                    <div class="cart-item-price">R$ ${preco.toFixed(2)}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="mercado.updateCartQuantity(${item.id}, -1)">-</button>
                    <span>${quantidade}</span>
                    <button class="quantity-btn" onclick="mercado.updateCartQuantity(${item.id}, 1)">+</button>
                </div>
                <div class="cart-item-price">R$ ${itemTotal.toFixed(2)}</div>
                <div class="cart-item-remove" onclick="mercado.removeFromCart(${item.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                    </svg>
                </div>
            `;
            container.appendChild(cartItem);
        });
        
        totalElement.textContent = `R$ ${total.toFixed(2)}`;
        checkoutBtn.disabled = false;
    }

    updateCartQuantity(produtoId, change) {
        const item = this.carrinho.find(item => item.id === produtoId);
        if (item) {
            item.quantidade = (parseInt(item.quantidade) || 0) + change;
            if (item.quantidade <= 0) {
                this.removeFromCart(produtoId);
            } else {
                this.renderCarrinho();
                this.updateCartCount();
            }
        }
    }

    removeFromCart(produtoId) {
        this.carrinho = this.carrinho.filter(item => item.id !== produtoId);
        this.renderCarrinho();
        this.updateCartCount();
        this.showNotification('Produto removido do carrinho', 'warning');
    }

    finalizarCompra() {
        if (this.carrinho.length === 0) return;
        
        // Preencher resumo do checkout
        const checkoutItems = document.getElementById('checkout-items');
        const checkoutTotal = document.getElementById('checkout-total');
        
        if (!checkoutItems || !checkoutTotal) return;
        
        checkoutItems.innerHTML = '';
        let total = 0;
        
        this.carrinho.forEach(item => {
            const preco = parseFloat(item.preco) || 0;
            const quantidade = parseInt(item.quantidade) || 0;
            const itemTotal = preco * quantidade;
            total += itemTotal;
            
            const checkoutItem = document.createElement('div');
            checkoutItem.className = 'checkout-item';
            checkoutItem.innerHTML = `
                <span>${item.nome} x ${quantidade}</span>
                <span>R$ ${itemTotal.toFixed(2)}</span>
            `;
            checkoutItems.appendChild(checkoutItem);
        });
        
        checkoutTotal.textContent = `R$ ${total.toFixed(2)}`;
        
        openModal('checkoutModal');
        toggleCheckoutFields(); // Add this line to set initial field visibility
    }

    async processarCompra(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const clienteData = Object.fromEntries(formData.entries());
        
        // Client-side validation
        if (!clienteData.tipoCliente) {
            this.showNotification('Selecione o tipo de cliente (PF/PJ)', 'error');
            return;
        }
        if (!clienteData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteData.email)) {
            this.showNotification('Email inválido', 'error');
            return;
        }
        if (!clienteData.telefone) {
            this.showNotification('Telefone é obrigatório', 'error');
            return;
        }
        if (!clienteData.endereco) {
            this.showNotification('Endereço é obrigatório', 'error');
            return;
        }
        if (!clienteData.formaPagamento) {
            this.showNotification('Selecione uma forma de pagamento', 'error');
            return;
        }
        if (clienteData.tipoCliente === 'PJ') {
    if (!clienteData.razaoSocial) {
        this.showNotification('Razão Social é obrigatória para Pessoa Jurídica', 'error');
        return;
    }
    if (!clienteData.cnpj || !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(clienteData.cnpj)) {
        this.showNotification('CNPJ inválido (formato: 00.000.000/0000-00)', 'error');
        return;
    }
    if (!clienteData.inscricaoEstadual) {
        this.showNotification('Inscrição Estadual é obrigatória para Pessoa Jurídica', 'error');
        return;
    }

        } else if (clienteData.tipoCliente === 'PJ') {
            if (!clienteData.razaoSocial) {
                this.showNotification('Razão Social é obrigatória para Pessoa Jurídica', 'error');
                return;
            }
            if (!clienteData.cnpj || !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(clienteData.cnpj)) {
                this.showNotification('CNPJ inválido (formato: 00.000.000/0000-00)', 'error');
                return;
            }
        }
        if (this.carrinho.length === 0) {
            this.showNotification('O carrinho está vazio', 'error');
            return;
        }

        try {
            const apiData = {
                tipo: clienteData.tipoCliente,
                email: clienteData.email,
                telefone: clienteData.telefone,
                endereco: clienteData.endereco
            };

            if (clienteData.tipoCliente === 'PF') {
                apiData.nome = clienteData.nome;
                apiData.cpf = clienteData.cpf;
                apiData.dataNascimento = clienteData.dataNascimento || null;
            } else if (clienteData.tipoCliente === 'PJ') {
                apiData.razaoSocial = clienteData.razaoSocial;
                apiData.nomeFantasia = clienteData.nomeFantasia || null;
                apiData.cnpj = clienteData.cnpj;
                apiData.inscricaoEstadual = clienteData.inscricaoEstadual || null;
            }

            const clienteResult = await this.apiRequest('/clientes', {
                method: 'POST',
                body: JSON.stringify(apiData)
            });
            
            if (clienteResult.success) {
                const totalCarrinho = this.carrinho.reduce((total, item) => {
                    const preco = parseFloat(item.preco) || 0;
                    const quantidade = parseInt(item.quantidade) || 0;
                    return total + (preco * quantidade);
                }, 0);

                const produtos = this.carrinho.map(item => ({
                    id_produto: item.id,
                    quantidade: parseInt(item.quantidade) || 0
                }));

                const formasPagamento = [{
                    tipo: clienteData.formaPagamento,
                    valor: totalCarrinho
                }];

                const pedidoData = {
                    id_conta: clienteResult.contaId,
                    data_pedido: new Date().toISOString().split('T')[0],
                    produtos: produtos,
                    formas_pagamento: formasPagamento,
                    observacoes: 'Pedido realizado pelo usuário'
                };

                const pedidoResult = await this.apiRequest('/pedidos', {
                    method: 'POST',
                    body: JSON.stringify(pedidoData)
                });
                
                if (pedidoResult.success) {
                    this.showNotification('Pedido realizado com sucesso!', 'success');
                    this.carrinho = [];
                    this.updateCartCount();
                    closeModal('checkoutModal');
                    this.showSection('user-pedidos');
                    await this.loadUserPedidos();
                } else {
                    this.showNotification('Erro ao criar pedido', 'error');
                }
            } else {
                this.showNotification('Erro ao criar cliente', 'error');
            }
        } catch (error) {
            console.error('Erro ao processar compra:', error);
            this.showNotification('Erro ao processar compra', 'error');
        }
    }

    async loadUserPedidos() {
        try {
            this.pedidos = await this.apiRequest('/pedidos');
            this.renderUserPedidos();
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            this.pedidos = [];
            this.renderUserPedidos();
        }
    }

    renderUserPedidos() {
        const grid = document.getElementById('user-pedidos-grid');
        if (!grid) return;
        
        grid.innerHTML = '';

        this.pedidos.forEach(pedido => {
            const total = parseFloat(pedido.total) || 0;
            const card = document.createElement('div');
            card.className = 'pedido-card';
            card.innerHTML = `
                <div class="pedido-header">
                    <span class="pedido-id">Pedido #${pedido.id}</span>
                    <span class="pedido-status status-${pedido.status}">${pedido.status}</span>
                </div>
                <div class="pedido-info">
                    <div class="pedido-detail">
                        <label>Data</label>
                        <span>${new Date(pedido.data_pedido || pedido.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div class="pedido-detail">
                        <label>Total</label>
                        <span>R$ ${total.toFixed(2)}</span>
                    </div>
                    <div class="pedido-detail">
                        <label>Status</label>
                        <span>${pedido.status}</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    async loadUserEntregas() {
        try {
            this.entregas = await this.apiRequest('/entregas');
            this.renderUserEntregas();
        } catch (error) {
            console.error('Erro ao carregar entregas:', error);
            this.entregas = [];
            this.renderUserEntregas();
        }
    }

    renderUserEntregas() {
        const grid = document.getElementById('user-entregas-grid');
        if (!grid) return;
        
        grid.innerHTML = '';

        this.entregas.forEach(entrega => {
            const card = document.createElement('div');
            card.className = 'entrega-card';
            card.innerHTML = `
                <div class="entrega-header">
                    <span class="entrega-id">Entrega #${entrega.id}</span>
                    <span class="entrega-status status-${entrega.status}">${entrega.status}</span>
                </div>
                <div class="entrega-info">
                    <div class="entrega-detail">
                        <label>Pedido</label>
                        <span>#${entrega.pedido_id}</span>
                    </div>
                    <div class="entrega-detail">
                        <label>Código de Rastreio</label>
                        <span class="codigo-rastreio">${entrega.codigo_rastreio}</span>
                    </div>
                    <div class="entrega-detail">
                        <label>Previsão de Entrega</label>
                        <span>${entrega.previsao_entrega ? new Date(entrega.previsao_entrega).toLocaleDateString('pt-BR') : 'Não definida'}</span>
                    </div>
                    <div class="entrega-detail">
                        <label>Status</label>
                        <span>${entrega.status}</span>
                    </div>
                </div>
                ${entrega.status === 'entregue' ? `
                    <div class="entrega-actions">
                        <button class="btn btn-success btn-small" onclick="mercado.confirmarEntrega(${entrega.id})">
                            Confirmar Recebimento
                        </button>
                    </div>
                ` : ''}
            `;
            grid.appendChild(card);
        });
    }

    confirmarEntrega(entregaId) {
        this.showNotification('Entrega confirmada! Obrigado pela preferência.', 'success');
    }

    filtrarProdutos() {
        const categoriaFilter = document.getElementById('categoria-filter');
        if (!categoriaFilter) return;
        
        const categoria = categoriaFilter.value;
        const cards = document.querySelectorAll('#user-produtos-grid .product-card');
        
        cards.forEach(card => {
            const cardCategoria = card.querySelector('.product-category');
            if (cardCategoria) {
                const categoriaText = cardCategoria.textContent.trim();
                if (!categoria || categoriaText === categoria) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }

    // ==================== OWNER INTERFACE ====================
    
    async initOwnerInterface() {
        await this.loadDashboard();
        await this.loadClientes();
        await this.loadProdutos();
        await this.loadPedidos();
        await this.loadEntregas();
        this.setupFormHandlers();
        this.populateSelects();
        this.showSection('dashboard');
        
        // Definir data atual no formulário de pedido
        const dataInput = document.getElementById('pedido-data');
        if (dataInput) {
            dataInput.value = new Date().toISOString().split('T')[0];
        }
    }

    // ==================== MÉTODOS DE API ====================
    
    async apiRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro da API:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
            this.showNotification('Erro de conexão com o servidor', 'error');
            throw error;
        }
    }

    // ==================== DASHBOARD ====================
    
    async loadDashboard() {
        try {
            const stats = await this.apiRequest('/dashboard');
            
            const totalClientesEl = document.getElementById('total-clientes');
            const totalProdutosEl = document.getElementById('total-produtos');
            const totalPedidosEl = document.getElementById('total-pedidos');
            const totalEntregasEl = document.getElementById('total-entregas');
            
            if (totalClientesEl) totalClientesEl.textContent = stats.totalClientes || 0;
            if (totalProdutosEl) totalProdutosEl.textContent = stats.totalProdutos || 0;
            if (totalPedidosEl) totalPedidosEl.textContent = stats.totalPedidos || 0;
            if (totalEntregasEl) totalEntregasEl.textContent = stats.totalEntregas || 0;
            
            console.log('Dashboard carregado:', stats);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            // Fallback para dados locais
            const totalClientesEl = document.getElementById('total-clientes');
            const totalProdutosEl = document.getElementById('total-produtos');
            const totalPedidosEl = document.getElementById('total-pedidos');
            const totalEntregasEl = document.getElementById('total-entregas');
            
            if (totalClientesEl) totalClientesEl.textContent = this.clientes.length;
            if (totalProdutosEl) totalProdutosEl.textContent = this.produtos.length;
            if (totalPedidosEl) totalPedidosEl.textContent = this.pedidos.length;
            if (totalEntregasEl) totalEntregasEl.textContent = this.entregas.filter(e => e.status !== 'entregue').length;
        }
    }

    // ==================== CLIENTES ====================
    
    async loadClientes() {
        try {
            this.clientes = await this.apiRequest('/clientes');
            this.renderClientes();
            this.populateSelects();
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.clientes = [];
            this.renderClientes();
        }
    }

    renderClientes() {
        const tbody = document.getElementById('clientes-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.clientes.forEach(cliente => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${cliente.id}</td>
                <td>${cliente.nome_razao || 'Nome não informado'}</td>
                <td><span class="status-badge ${cliente.tipo === 'PF' ? 'status-confirmado' : 'status-enviado'}">${cliente.tipo}</span></td>
                <td>${cliente.documento || 'Documento não informado'}</td>
                <td>${cliente.email || 'Email não informado'}</td>
                <td>${cliente.telefone || 'Telefone não informado'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="mercado.editarCliente(${cliente.id})" title="Editar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon btn-delete" onclick="mercado.excluirCliente(${cliente.id})" title="Excluir">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async salvarCliente(clienteData) {
        try {
            // Preparar dados para a API
            const apiData = {
                tipo: clienteData.tipo,
                nome: clienteData.nome,
                cpf: clienteData.cpf,
                dataNascimento: clienteData.dataNascimento,
                razaoSocial: clienteData.razaoSocial,
                nomeFantasia: clienteData.nomeFantasia,
                cnpj: clienteData.cnpj,
                inscricaoEstadual: clienteData.inscricaoEstadual,
                email: clienteData.email,
                telefone: clienteData.telefone,
                endereco: clienteData.endereco
            };

            if (this.editandoCliente) {
                // Atualizar cliente existente
                const result = await this.apiRequest(`/clientes/${this.editandoCliente}`, {
                    method: 'PUT',
                    body: JSON.stringify(apiData)
                });
                
                if (result.success) {
                    this.showNotification('Cliente atualizado com sucesso!', 'success');
                    this.editandoCliente = null;
                }
            } else {
                // Criar novo cliente
                const result = await this.apiRequest('/clientes', {
                    method: 'POST',
                    body: JSON.stringify(apiData)
                });

                if (result.success) {
                    this.showNotification('Cliente salvo com sucesso!', 'success');
                }
            }
            
            await this.loadClientes();
            await this.loadDashboard();
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            this.showNotification('Erro ao salvar cliente', 'error');
        }
    }

    async editarCliente(id) {
        try {
            const cliente = await this.apiRequest(`/clientes/${id}`);
            this.editandoCliente = id;
            this.preencherFormularioCliente(cliente);
            openModal('clienteModal');
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            this.showNotification('Erro ao carregar dados do cliente', 'error');
        }
    }

    async excluirCliente(id) {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                const result = await this.apiRequest(`/clientes/${id}`, {
                    method: 'DELETE'
                });

                if (result.success) {
                    this.showNotification('Cliente excluído com sucesso!', 'success');
                    await this.loadClientes();
                    await this.loadDashboard();
                }
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
                this.showNotification('Erro ao excluir cliente', 'error');
            }
        }
    }

    // ==================== PRODUTOS ====================
    
    async loadProdutos() {
        try {
            this.produtos = await this.apiRequest('/produtos');
        } catch (error) {
            console.error('Erro ao carregar produtos da API:', error);
            this.produtos = [];
        }
        
        if (this.userType === 'user') {
            this.renderUserProdutos();
        } else {
            this.renderProdutos();
        }
        this.populateSelects();
    }
    

    renderProdutos() {
        const grid = document.getElementById('produtos-grid');
        if (!grid) return;
        
        grid.innerHTML = '';

        this.produtos.forEach(produto => {
            const preco = parseFloat(produto.preco) || 0;
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${produto.imagem || 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=400'}" 
                     alt="${produto.nome}" class="product-image">
                <div class="product-content">
                    <div class="product-category">${produto.categoria}</div>
                    <h3 class="product-title">${produto.nome}</h3>
                    <p class="product-description">${produto.descricao || 'Sem descrição disponível'}</p>
                    <div class="product-footer">
                        <span class="product-price">R$ ${preco.toFixed(2)}</span>
                        <span class="product-stock">Estoque: ${produto.estoque}</span>
                    </div>
                    <div class="action-buttons" style="margin-top: 1rem;">
                        <button class="btn-icon btn-edit" onclick="mercado.editarProduto(${produto.id})" title="Editar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon btn-delete" onclick="mercado.excluirProduto(${produto.id})" title="Excluir">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    async salvarProduto(produtoData) {
        try {
            const produto = {
                ...produtoData,
                preco: parseFloat(produtoData.preco) || 0,
                estoque: parseInt(produtoData.estoque) || 0
            };

            if (this.editandoProduto) {
                // Atualizar produto existente via API
                const result = await this.apiRequest(`/produtos/${this.editandoProduto}`, {
                    method: 'PUT',
                    body: JSON.stringify(produto)
                });
                
                if (result.success) {
                    this.showNotification('Produto atualizado com sucesso!', 'success');
                    this.editandoProduto = null;
                }
            } else {
                // Criar novo produto via API
                const result = await this.apiRequest('/produtos', {
                    method: 'POST',
                    body: JSON.stringify(produto)
                });
                
                if (result.success) {
                    this.showNotification('Produto salvo com sucesso!', 'success');
                }
            }
            
            await this.loadProdutos();
            await this.loadDashboard();
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            this.showNotification('Erro ao salvar produto', 'error');
        }
    }

    async editarProduto(id) {
        try {
            const produto = await this.apiRequest(`/produtos/${id}`);
            this.editandoProduto = id;
            this.preencherFormularioProduto(produto);
            openModal('produtoModal');
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            this.showNotification('Erro ao carregar dados do produto', 'error');
        }
    }

    async excluirProduto(id) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                const result = await this.apiRequest(`/produtos/${id}`, {
                    method: 'DELETE'
                });

                if (result.success) {
                    this.showNotification(result.message || 'Produto excluído com sucesso!', 'success');
                    await this.loadProdutos();
                    await this.loadDashboard();
                }
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                this.showNotification('Erro ao excluir produto', 'error');
            }
        }
    }

    // ==================== PEDIDOS ====================
    
    async loadPedidos() {
        try {
            this.pedidos = await this.apiRequest('/pedidos');
            this.renderPedidos();
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            this.pedidos = [];
            this.renderPedidos();
        }
    }

    renderPedidos() {
        const tbody = document.getElementById('pedidos-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.pedidos.forEach(pedido => {
            const total = parseFloat(pedido.total) || 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${pedido.id}</td>
                <td>${pedido.cliente_nome || 'Cliente não encontrado'}</td>
                <td>${new Date(pedido.data_pedido || pedido.created_at).toLocaleDateString('pt-BR')}</td>
                <td>R$ ${total.toFixed(2)}</td>
                <td><span class="status-badge status-${pedido.status}">${pedido.status}</span></td>
                <td>Múltiplas formas</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="mercado.verPedido(${pedido.id})" title="Ver Detalhes">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="btn-icon btn-delete" onclick="mercado.excluirPedido(${pedido.id})" title="Excluir">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async salvarPedido(pedidoData) {
        try {
            // Preparar dados para a API
            const apiData = {
                id_conta: parseInt(pedidoData.cliente),
                data_pedido: pedidoData.data,
                produtos: pedidoData.produtos.map(p => ({
                    id_produto: parseInt(p.produtoId),
                    quantidade: parseInt(p.quantidade)
                })),
                formas_pagamento: pedidoData.formasPagamento.map(fp => ({
                    tipo: fp.tipo,
                    valor: parseFloat(fp.valor)
                })),
                observacoes: pedidoData.observacoes
            };

            const result = await this.apiRequest('/pedidos', {
                method: 'POST',
                body: JSON.stringify(apiData)
            });

            if (result.success) {
                this.showNotification('Pedido criado com sucesso!', 'success');
                await this.loadPedidos();
                await this.loadEntregas();
                await this.loadDashboard();
            }
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            this.showNotification('Erro ao criar pedido', 'error');
        }
    }

    verPedido(id) {
        const pedido = this.pedidos.find(p => p.id === id);
        if (pedido) {
            const total = parseFloat(pedido.total) || 0;
            alert(`Detalhes do Pedido #${pedido.id}\nCliente: ${pedido.cliente_nome}\nTotal: R$ ${total.toFixed(2)}\nStatus: ${pedido.status}`);
        }
    }

    excluirPedido(id) {
        if (confirm('Tem certeza que deseja excluir este pedido?')) {
            this.showNotification('Funcionalidade em desenvolvimento', 'warning');
        }
    }

    // ==================== ENTREGAS ====================
    
    async loadEntregas() {
        try {
            this.entregas = await this.apiRequest('/entregas');
            if (this.userType === 'user') {
                this.renderUserEntregas();
            } else {
                this.renderEntregas();
            }
        } catch (error) {
            console.error('Erro ao carregar entregas:', error);
            this.entregas = [];
            if (this.userType === 'user') {
                this.renderUserEntregas();
            } else {
                this.renderEntregas();
            }
        }
    }

    renderEntregas() {
        const grid = document.getElementById('entregas-grid');
        if (!grid) return;
        
        grid.innerHTML = '';

        this.entregas.forEach(entrega => {
            const card = document.createElement('div');
            card.className = 'entrega-card';
            card.innerHTML = `
                <div class="entrega-header">
                    <span class="entrega-id">Entrega #${entrega.id}</span>
                    <span class="entrega-status status-${entrega.status}">${entrega.status}</span>
                </div>
                <div class="entrega-info">
                    <div class="entrega-detail">
                        <label>Cliente</label>
                        <span>${entrega.cliente_nome || 'Cliente não encontrado'}</span>
                    </div>
                    <div class="entrega-detail">
                        <label>Pedido</label>
                        <span>#${entrega.pedido_id}</span>
                    </div>
                    <div class="entrega-detail">
                        <label>Data de Criação</label>
                        <span>${new Date(entrega.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div class="entrega-detail">
                        <label>Previsão de Entrega</label>
                        <span>${entrega.previsao_entrega ? new Date(entrega.previsao_entrega).toLocaleDateString('pt-BR') : 'Não definida'}</span>
                    </div>
                    <div class="entrega-detail">
                        <label>Código de Rastreio</label>
                        <span class="codigo-rastreio">${entrega.codigo_rastreio}</span>
                    </div>
                    <div class="entrega-detail">
                        <label>Endereço</label>
                        <span>${entrega.endereco_entrega}</span>
                    </div>
                </div>
                <div class="action-buttons" style="margin-top: 1rem;">
                    <button class="btn btn-small btn-primary" onclick="mercado.atualizarStatusEntrega(${entrega.id})">
                        Atualizar Status
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    async atualizarStatusEntrega(id) {
        const entrega = this.entregas.find(e => e.id === id);
        if (entrega) {
            const statusOptions = ['preparando', 'enviado', 'transito', 'entregue'];
            const currentIndex = statusOptions.indexOf(entrega.status);
            const nextIndex = (currentIndex + 1) % statusOptions.length;
            const novoStatus = statusOptions[nextIndex];
            
            try {
                const result = await this.apiRequest(`/entregas/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: novoStatus })
                });

                if (result.success) {
                    this.showNotification('Status da entrega atualizado!', 'success');
                    await this.loadEntregas();
                    await this.loadDashboard();
                }
            } catch (error) {
                console.error('Erro ao atualizar entrega:', error);
                this.showNotification('Erro ao atualizar entrega', 'error');
            }
        }
    }

    filtrarEntregas() {
        const filtroStatus = document.getElementById('filtro-status');
        if (!filtroStatus) return;
        
        const filtro = filtroStatus.value;
        const cards = document.querySelectorAll('.entrega-card');
        
        cards.forEach(card => {
            const statusElement = card.querySelector('.entrega-status');
            if (statusElement) {
                const status = statusElement.textContent.trim();
                if (!filtro || status === filtro) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }

    // ==================== NAVEGAÇÃO ====================
    
    showSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => section.classList.remove('active'));
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Carregar dados específicos da seção
            if (this.userType === 'user') {
                switch(sectionId) {
                    case 'user-carrinho':
                        this.renderCarrinho();
                        break;
                    case 'user-pedidos':
                        this.loadUserPedidos();
                        break;
                    case 'user-entregas':
                        this.loadUserEntregas();
                        break;
                }
            }
        }
    }

    updateActiveNav(activeLink) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }

    // ==================== FORMULÁRIOS ====================
    
    setupFormHandlers() {
        // Toggle campos PF/PJ
        window.toggleClienteFields = () => {
            const tipoRadio = document.querySelector('input[name="tipo"]:checked');
            if (!tipoRadio) return;
            
            const tipo = tipoRadio.value;
            const camposPF = document.getElementById('campos-pf');
            const camposPJ = document.getElementById('campos-pj');
            
            if (!camposPF || !camposPJ) return;
            
            if (tipo === 'PF') {
                camposPF.style.display = 'block';
                camposPJ.style.display = 'none';
                // Limpar campos PJ
                camposPJ.querySelectorAll('input').forEach(input => input.value = '');
            } else {
                camposPF.style.display = 'none';
                camposPJ.style.display = 'block';
                // Limpar campos PF
                camposPF.querySelectorAll('input').forEach(input => input.value = '');
            }
        };

        // Toggle campos checkout
        window.toggleCheckoutFields = () => {
            const tipoRadio = document.querySelector('input[name="tipoCliente"]:checked');
            if (!tipoRadio) {
                console.error('No tipoCliente radio button selected');
                return;
            }
            
            const tipo = tipoRadio.value;
            const camposPF = document.getElementById('checkout-campos-pf');
            const camposPJ = document.getElementById('checkout-campos-pj');
            
            if (!camposPF || !camposPJ) {
                console.error('Checkout fields not found');
                return;
            }
            
            if (tipo === 'PF') {
                camposPF.style.display = 'block';
                camposPJ.style.display = 'none';
                camposPJ.querySelectorAll('input').forEach(input => input.value = '');
            } else {
                camposPF.style.display = 'none';
                camposPJ.style.display = 'block';
                camposPF.querySelectorAll('input').forEach(input => input.value = '');
            }
        };

        // Adicionar produto ao pedido
        window.adicionarProdutoPedido = () => {
            const container = document.getElementById('produtos-pedido');
            if (!container) return;
            
            const div = document.createElement('div');
            div.className = 'produto-item';
            div.innerHTML = `
                <select name="produto" required>
                    <option value="">Selecione um produto...</option>
                    ${this.produtos.map(p => {
                        const preco = parseFloat(p.preco) || 0;
                        return `<option value="${p.id}">${p.nome} - R$ ${preco.toFixed(2)}</option>`;
                    }).join('')}
                </select>
                <input type="number" name="quantidade" placeholder="Qtd" min="1" required>
                <button type="button" class="btn btn-small btn-danger" onclick="removerProdutoPedido(this)">Remover</button>
            `;
            container.appendChild(div);
        };

        window.removerProdutoPedido = (button) => {
            button.parentElement.remove();
        };

        // Adicionar forma de pagamento
        window.adicionarFormaPagamento = () => {
            const container = document.getElementById('formas-pagamento');
            if (!container) return;
            
            const div = document.createElement('div');
            div.className = 'pagamento-item';
            div.innerHTML = `
                <select name="formaPagamento" required>
                    <option value="">Selecione...</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao-credito">Cartão de Crédito</option>
                    <option value="cartao-debito">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                </select>
                <input type="number" name="valorPagamento" placeholder="Valor (R$)" step="0.01" min="0" required>
                <button type="button" class="btn btn-small btn-danger" onclick="removerFormaPagamento(this)">Remover</button>
            `;
            container.appendChild(div);
        };

        window.removerFormaPagamento = (button) => {
            button.parentElement.remove();
        };
    }

    populateSelects() {
        // Popular select de clientes no pedido
        const selectCliente = document.getElementById('pedido-cliente');
        if (selectCliente) {
            selectCliente.innerHTML = '<option value="">Selecione um cliente...</option>';
            this.clientes.forEach(cliente => {
                const nome = cliente.nome_razao || 'Nome não informado';
                selectCliente.innerHTML += `<option value="${cliente.id}">${nome} (${cliente.tipo})</option>`;
            });
        }

        // Popular selects de produtos
        const selectsProduto = document.querySelectorAll('select[name="produto"]');
        selectsProduto.forEach(select => {
            select.innerHTML = '<option value="">Selecione um produto...</option>';
            this.produtos.forEach(produto => {
                const preco = parseFloat(produto.preco) || 0;
                select.innerHTML += `<option value="${produto.id}">${produto.nome} - R$ ${preco.toFixed(2)}</option>`;
            });
        });
    }

    // Preencher formulários para edição
    preencherFormularioCliente(cliente) {
        const tipoRadio = document.querySelector(`input[name="tipo"][value="${cliente.tipo}"]`);
        if (tipoRadio) {
            tipoRadio.checked = true;
            toggleClienteFields();
        }
        
        if (cliente.tipo === 'PF') {
            const nomeInput = document.getElementById('nome');
            const cpfInput = document.getElementById('cpf');
            const dataNascInput = document.getElementById('data-nascimento');
            
            if (nomeInput) nomeInput.value = cliente.nome || '';
            if (cpfInput) cpfInput.value = cliente.cpf || '';
            if (dataNascInput) dataNascInput.value = cliente.dataNascimento || '';
        } else {
            const razaoSocialInput = document.getElementById('razao-social');
            const nomeFantasiaInput = document.getElementById('nome-fantasia');
            const cnpjInput = document.getElementById('cnpj');
            const inscricaoEstadualInput = document.getElementById('inscricao-estadual');
            
            if (razaoSocialInput) razaoSocialInput.value = cliente.razaoSocial || '';
            if (nomeFantasiaInput) nomeFantasiaInput.value = cliente.nomeFantasia || '';
            if (cnpjInput) cnpjInput.value = cliente.cnpj || '';
            if (inscricaoEstadualInput) inscricaoEstadualInput.value = cliente.inscricaoEstadual || '';
        }
        
        const emailInput = document.getElementById('email');
        const telefoneInput = document.getElementById('telefone');
        const enderecoInput = document.getElementById('endereco');
        
        if (emailInput) emailInput.value = cliente.email || '';
        if (telefoneInput) telefoneInput.value = cliente.telefone || '';
        if (enderecoInput) enderecoInput.value = cliente.endereco || '';
    }

    preencherFormularioProduto(produto) {
        const nomeInput = document.getElementById('produto-nome');
        const categoriaInput = document.getElementById('produto-categoria');
        const descricaoInput = document.getElementById('produto-descricao');
        const precoInput = document.getElementById('produto-preco');
        const estoqueInput = document.getElementById('produto-estoque');
        const imagemInput = document.getElementById('produto-imagem');
        
        if (nomeInput) nomeInput.value = produto.nome || '';
        if (categoriaInput) categoriaInput.value = produto.categoria || '';
        if (descricaoInput) descricaoInput.value = produto.descricao || '';
        if (precoInput) precoInput.value = produto.preco || '';
        if (estoqueInput) estoqueInput.value = produto.estoque || '';
        if (imagemInput) imagemInput.value = produto.imagem || '';
    }

    // ==================== UTILITÁRIOS ====================
    
    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Definir cor baseada no tipo
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f59e0b';
                break;
            default:
                notification.style.backgroundColor = '#2563eb';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// ==================== FUNÇÕES GLOBAIS ====================

// Funções globais para login
function loginAs(type) {
    mercado.loginAs(type);
}

function logout() {
    mercado.logout();
}

// Funções globais para modais
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
    if (modalId === 'checkoutModal') {
        const form = document.getElementById('checkoutForm');
        if (form) {
            form.reset();
        }
        if (typeof toggleCheckoutFields === 'function') {
            toggleCheckoutFields(); 
        }
    }
}

// Funções para salvar dados
async function salvarCliente(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const clienteData = Object.fromEntries(formData.entries());
    
    await mercado.salvarCliente(clienteData);
    closeModal('clienteModal');
}

async function salvarProduto(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const produtoData = Object.fromEntries(formData.entries());
    
    await mercado.salvarProduto(produtoData);
    closeModal('produtoModal');
}

async function salvarPedido(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Processar produtos
    const produtos = [];
    const produtoSelects = document.querySelectorAll('#produtos-pedido select[name="produto"]');
    const quantidadeInputs = document.querySelectorAll('#produtos-pedido input[name="quantidade"]');
    
    for (let i = 0; i < produtoSelects.length; i++) {
        if (produtoSelects[i].value && quantidadeInputs[i].value) {
            produtos.push({
                produtoId: produtoSelects[i].value,
                quantidade: parseInt(quantidadeInputs[i].value)
            });
        }
    }
    
    // Processar formas de pagamento
    const formasPagamento = [];
    const pagamentoSelects = document.querySelectorAll('#formas-pagamento select[name="formaPagamento"]');
    const valorInputs = document.querySelectorAll('#formas-pagamento input[name="valorPagamento"]');
    
    for (let i = 0; i < pagamentoSelects.length; i++) {
        if (pagamentoSelects[i].value && valorInputs[i].value) {
            formasPagamento.push({
                tipo: pagamentoSelects[i].value,
                valor: parseFloat(valorInputs[i].value)
            });
        }
    }
    
    const pedidoData = {
        cliente: formData.get('cliente'),
        data: formData.get('data'),
        produtos,
        formasPagamento,
        observacoes: formData.get('observacoes')
    };
    
    await mercado.salvarPedido(pedidoData);
    closeModal('pedidoModal');
}

async function processarCompra(event) {
    await mercado.processarCompra(event);
}

function filtrarEntregas() {
    mercado.filtrarEntregas();
}

function filtrarProdutos() {
    mercado.filtrarProdutos();
}

function finalizarCompra() {
    mercado.finalizarCompra();
}

// Inicializar sistema
const mercado = new MercadoDigital();
