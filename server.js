import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';

// Para obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da raiz do projeto
app.use(express.static('.'));

// Rota para servir o index.html na raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configuração do banco de dados
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'e_comerce'
};

// Função para conectar ao banco
async function connectDB() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado ao MySQL!');
        return connection;
    } catch (error) {
        console.error('❌ Erro ao conectar ao MySQL:', error);
        console.log('💡 Verifique se o MySQL está rodando e as credenciais estão corretas');
        throw error;
    }
}

// ==================== ROTAS PARA CLIENTES ====================

// Verificar se documento já existe
app.get('/api/clientes/verificar-documento', async (req, res) => {
    try {
        const { tipo, documento } = req.query;
        
        if (!tipo || !documento) {
            return res.status(400).json({ error: 'Tipo e documento são obrigatórios' });
        }

        const connection = await connectDB();
        let query, params;

        if (tipo === 'PF') {
            query = `
                SELECT 
                    c.id as conta_id,
                    pf.nome,
                    pf.email,
                    pf.telefone,
                    pf.cpf
                FROM conta c
                JOIN cliente_pf pf ON c.id_cliente_pf = pf.id
                WHERE pf.cpf = ? AND c.status = 'ativo'
            `;
            params = [documento];
        } else if (tipo === 'PJ') {
            query = `
                SELECT 
                    c.id as conta_id,
                    pj.razao_social,
                    pj.email,
                    pj.telefone,
                    pj.cnpj
                FROM conta c
                JOIN cliente_pj pj ON c.id_cliente_pj = pj.id
                WHERE pj.cnpj = ? AND c.status = 'ativo'
            `;
            params = [documento];
        } else {
            await connection.end();
            return res.status(400).json({ error: 'Tipo inválido' });
        }

        const [rows] = await connection.execute(query, params);
        await connection.end();

        if (rows.length > 0) {
            res.json({ 
                exists: true, 
                cliente: rows[0] 
            });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Erro ao verificar documento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar todos os clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const connection = await connectDB();
        const [rows] = await connection.execute('SELECT * FROM view_clientes ORDER BY created_at DESC');
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar novo cliente
app.post('/api/clientes', async (req, res) => {
    try {
        const connection = await connectDB();
        const { tipo, nome, cpf, dataNascimento, razaoSocial, nomeFantasia, cnpj, inscricaoEstadual, email, telefone, endereco } = req.body;

        // Validações
        if (!tipo || !['PF', 'PJ'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de cliente inválido' });
        }
        if (!email || !telefone || !endereco) {
            return res.status(400).json({ error: 'Email, telefone e endereço são obrigatórios' });
        }
        if (tipo === 'PF' && (!nome || !cpf)) {
            return res.status(400).json({ error: 'Nome e CPF são obrigatórios para Pessoa Física' });
        }
        if (tipo === 'PJ' && (!razaoSocial || !cnpj || !inscricaoEstadual)) {
            return res.status(400).json({ error: 'Razão Social, CNPJ e Inscrição Estadual são obrigatórios para Pessoa Jurídica' });
        }

        // Verificar se documento já existe
        if (tipo === 'PF' && cpf) {
            const [existingCPF] = await connection.execute('SELECT id FROM cliente_pf WHERE cpf = ?', [cpf]);
            if (existingCPF.length > 0) {
                await connection.end();
                return res.status(400).json({ error: 'CPF já cadastrado no sistema' });
            }
        }
        if (tipo === 'PJ' && cnpj) {
            const [existingCNPJ] = await connection.execute('SELECT id FROM cliente_pj WHERE cnpj = ?', [cnpj]);
            if (existingCNPJ.length > 0) {
                await connection.end();
                return res.status(400).json({ error: 'CNPJ já cadastrado no sistema' });
            }
        }

        await connection.beginTransaction();

        let clienteId;
        let contaClientePF = null;
        let contaClientePJ = null;

        if (tipo === 'PF') {
            // Inserir cliente PF
            const [result] = await connection.execute(
                'INSERT INTO cliente_pf (nome, cpf, data_nascimento, email, telefone, endereco) VALUES (?, ?, ?, ?, ?, ?)',
                [nome, cpf || null, dataNascimento || null, email, telefone, endereco]
            );
            clienteId = result.insertId;
            contaClientePF = clienteId;
        } else if (tipo === 'PJ') {
            // Inserir cliente PJ
            const [result] = await connection.execute(
                'INSERT INTO cliente_pj (razao_social, cnpj, nome_fantasia, inscricao_estadual, email, telefone, endereco) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [razaoSocial, cnpj, nomeFantasia || null, inscricaoEstadual, email, telefone, endereco]
            );
            clienteId = result.insertId;
            contaClientePJ = clienteId;
        }

        // Inserir conta
        const [contaResult] = await connection.execute(
            'INSERT INTO conta (tipo, id_cliente_pf, id_cliente_pj) VALUES (?, ?, ?)',
            [tipo, contaClientePF, contaClientePJ]
        );

        await connection.commit();
        await connection.end();

        res.json({ 
            success: true, 
            contaId: contaResult.insertId,
            clienteId: clienteId,
            message: 'Cliente criado com sucesso!' 
        });
    } catch (error) {
        console.error('Erro ao criar cliente:', error.message, error.stack);
        res.status(500).json({ error: 'Erro ao criar cliente', details: error.message });
    }
});

// Buscar cliente por ID
app.get('/api/clientes/:id', async (req, res) => {
    try {
        const connection = await connectDB();
        const { id } = req.params;
        
        const [rows] = await connection.execute(`
            SELECT 
                c.id,
                c.tipo,
                pf.nome,
                pf.cpf,
                pf.data_nascimento,
                pf.email as pf_email,
                pf.telefone as pf_telefone,
                pf.endereco as pf_endereco,
                pj.razao_social,
                pj.cnpj,
                pj.inscricao_estadual,
                pj.email as pj_email,
                pj.telefone as pj_telefone,
                pj.endereco as pj_endereco
            FROM conta c
            LEFT JOIN cliente_pf pf ON c.id_cliente_pf = pf.id
            LEFT JOIN cliente_pj pj ON c.id_cliente_pj = pj.id
            WHERE c.id = ?
        `, [id]);
        
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        
        // Formatar resposta
        const cliente = rows[0];
        const response = {
            id: cliente.id,
            tipo: cliente.tipo,
            email: cliente.tipo === 'PF' ? cliente.pf_email : cliente.pj_email,
            telefone: cliente.tipo === 'PF' ? cliente.pf_telefone : cliente.pj_telefone,
            endereco: cliente.tipo === 'PF' ? cliente.pf_endereco : cliente.pj_endereco
        };
        
        if (cliente.tipo === 'PF') {
            response.nome = cliente.nome;
            response.cpf = cliente.cpf;
            response.dataNascimento = cliente.data_nascimento;
        } else {
            response.razaoSocial = cliente.razao_social;
            response.cnpj = cliente.cnpj;
            response.inscricaoEstadual = cliente.inscricao_estadual;
        }
        
        res.json(response);
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar cliente
app.put('/api/clientes/:id', async (req, res) => {
    try {
        const connection = await connectDB();
        const { id } = req.params;
        const { tipo, nome, cpf, dataNascimento, razaoSocial, nomeFantasia, cnpj, inscricaoEstadual, email, telefone, endereco } = req.body;
        
        await connection.beginTransaction();
        
        // Buscar dados da conta
        const [conta] = await connection.execute('SELECT * FROM conta WHERE id = ?', [id]);
        
        if (conta.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        
        if (tipo === 'PF' && conta[0].id_cliente_pf) {
            await connection.execute(
                'UPDATE cliente_pf SET nome = ?, cpf = ?, data_nascimento = ?, email = ?, telefone = ?, endereco = ? WHERE id = ?',
                [nome, cpf|| null, dataNascimento || null, email, telefone, endereco, conta[0].id_cliente_pf]
            );
        } else if (tipo === 'PJ' && conta[0].id_cliente_pj) {
            await connection.execute(
                'UPDATE cliente_pj SET razao_social = ?, cnpj = ?, inscricao_estadual = ?, email = ?, telefone = ?, endereco = ? WHERE id = ?',
                [razaoSocial, cnpj, inscricaoEstadual || null, email, telefone, endereco, conta[0].id_cliente_pj]
            );
        }
        
        await connection.commit();
        await connection.end();
        
        res.json({ success: true, message: 'Cliente atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

// Deletar cliente
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        const connection = await connectDB();
        const { id } = req.params;
        
        await connection.beginTransaction();
        
        // Buscar dados da conta
        const [conta] = await connection.execute('SELECT * FROM conta WHERE id = ?', [id]);
        
        if (conta.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        
        // Deletar conta (CASCADE irá deletar relacionamentos)
        await connection.execute('DELETE FROM conta WHERE id = ?', [id]);
        
        await connection.commit();
        await connection.end();
        
        res.json({ success: true, message: 'Cliente deletado com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
});

app.delete('/api/pedidos/:id', async (req, res) => {
    try {
        const connection = await connectDB();
        const { id } = req.params;

        // Verificar se o pedido existe
        const [pedido] = await connection.execute('SELECT id FROM pedidos WHERE id = ?', [id]);
        if (pedido.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        // Deletar o pedido (pode adicionar CASCADE se necessário)
        await connection.execute('DELETE FROM pedidos WHERE id = ?', [id]);

        await connection.end();
        res.json({ success: true, message: 'Pedido excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar pedido:', error);
        res.status(500).json({ error: 'Erro ao deletar pedido' });
    }
});

// ==================== ROTAS PARA PRODUTOS ====================

// Listar produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const connection = await connectDB();
        const [rows] = await connection.execute('SELECT * FROM produtos WHERE status = "ativo" ORDER BY nome');
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar produto por ID
app.get('/api/produtos/:id', async (req, res) => {
    try {
        const connection = await connectDB();
        const { id } = req.params;
        
        const [rows] = await connection.execute('SELECT * FROM produtos WHERE id = ? AND status = "ativo"', [id]);
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar produto
app.post('/api/produtos', async (req, res) => {
    try {
        const connection = await connectDB();
        const { nome, categoria, descricao, preco, estoque, imagem } = req.body;
        
        const [result] = await connection.execute(
            'INSERT INTO produtos (nome, categoria, descricao, preco, estoque, imagem) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, categoria, descricao || null, preco, estoque, imagem || null]
        );
        
        await connection.end();
        res.json({ success: true, id: result.insertId, message: 'Produto criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
});

// Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
    try {
        const connection = await connectDB();
        const { id } = req.params;
        const { nome, categoria, descricao, preco, estoque, imagem } = req.body;
        
        const [result] = await connection.execute(
            'UPDATE produtos SET nome = ?, categoria = ?, descricao = ?, preco = ?, estoque = ?, imagem = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "ativo"',
            [nome, categoria, descricao || null, preco, estoque, imagem || null, id]
        );
        
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        
        res.json({ success: true, message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

// Deletar produto (soft delete)
app.delete('/api/produtos/:id', async (req, res) => {
    try {
        const connection = await connectDB();
        const { id } = req.params;
        
        // Verificar se o produto existe e está ativo
        const [produto] = await connection.execute('SELECT id FROM produtos WHERE id = ? AND status = "ativo"', [id]);
        
        if (produto.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        
        // Verificar se o produto está sendo usado em algum pedido
        const [pedidosComProduto] = await connection.execute(
            'SELECT COUNT(*) as total FROM itens_pedido WHERE id_produto = ?', 
            [id]
        );
        
        if (pedidosComProduto[0].total > 0) {
            // Se o produto está em pedidos, fazer soft delete
            await connection.execute(
                'UPDATE produtos SET status = "inativo", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
            await connection.end();
            res.json({ success: true, message: 'Produto desativado com sucesso! (produto estava em pedidos)' });
        } else {
            // Se não está em pedidos, pode deletar completamente
            await connection.execute('DELETE FROM produtos WHERE id = ?', [id]);
            await connection.end();
            res.json({ success: true, message: 'Produto excluído com sucesso!' });
        }
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
});

// ==================== ROTAS PARA PEDIDOS ====================

// Listar pedidos
app.get('/api/pedidos', async (req, res) => {
    try {
        const connection = await connectDB();
        const [rows] = await connection.execute(`
            SELECT 
                p.*,
                vc.nome_razao as cliente_nome,
                vc.tipo as cliente_tipo
            FROM pedidos p
            JOIN view_clientes vc ON p.id_conta = vc.id
            ORDER BY p.created_at DESC
        `);
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar pedido
app.post('/api/pedidos', async (req, res) => {
    try {
        const connection = await connectDB();
        const { id_conta, data_pedido, produtos, formas_pagamento, observacoes } = req.body;

        // Validate required fields
        if (!id_conta) {
            return res.status(400).json({ error: 'ID da conta é obrigatório' });
        }
        if (!data_pedido || !/^\d{4}-\d{2}-\d{2}$/.test(data_pedido)) {
            return res.status(400).json({ error: 'Data do pedido inválida (formato: YYYY-MM-DD)' });
        }
        if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
            return res.status(400).json({ error: 'Lista de produtos é obrigatória e não pode estar vazia' });
        }
        if (!formas_pagamento || !Array.isArray(formas_pagamento) || formas_pagamento.length === 0) {
            return res.status(400).json({ error: 'Forma de pagamento é obrigatória' });
        }

        // Validate produtos
        for (const item of produtos) {
            if (!item.id_produto || !item.quantidade || item.quantidade <= 0) {
                return res.status(400).json({ error: 'Produto inválido: id_produto e quantidade são obrigatórios' });
            }
        }

        // Validate formas_pagamento
        for (const pagamento of formas_pagamento) {
            if (!pagamento.tipo || !['dinheiro', 'cartao-credito', 'cartao-debito', 'pix', 'boleto'].includes(pagamento.tipo)) {
                return res.status(400).json({ error: 'Tipo de pagamento inválido' });
            }
            if (!pagamento.valor || pagamento.valor <= 0) {
                return res.status(400).json({ error: 'Valor do pagamento inválido' });
            }
        }

        await connection.beginTransaction();
        
        // Calcular total
        let total = 0;
        for (const item of produtos) {
            const [produtoData] = await connection.execute('SELECT preco FROM produtos WHERE id = ?', [item.id_produto]);
            if (produtoData.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: `Produto com ID ${item.id_produto} não encontrado` });
            }
            total += produtoData[0].preco * item.quantidade;
        }
        
        // Inserir pedido
        const [pedidoResult] = await connection.execute(
            'INSERT INTO pedidos (id_conta, data_pedido, total, observacoes) VALUES (?, ?, ?, ?)',
            [id_conta, data_pedido, total, observacoes || null]
        );
        
        const pedidoId = pedidoResult.insertId;
        
        // Inserir itens do pedido
        for (const item of produtos) {
            const [produtoData] = await connection.execute('SELECT preco FROM produtos WHERE id = ?', [item.id_produto]);
            const precoUnitario = produtoData[0].preco;
            const subtotal = precoUnitario * item.quantidade;
            
            await connection.execute(
                'INSERT INTO itens_pedido (id_pedido, id_produto, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                [pedidoId, item.id_produto, item.quantidade, precoUnitario, subtotal]
            );
        }
        
        // Inserir formas de pagamento
        for (const pagamento of formas_pagamento) {
            await connection.execute(
                'INSERT INTO pagamento (id_pedido, tipo, valor, dados) VALUES (?, ?, ?, ?)',
                [pedidoId, pagamento.tipo, pagamento.valor, JSON.stringify(pagamento)]
            );
        }
        
        // Criar entrega
        const codigoRastreio = 'BR' + Math.random().toString(36).substr(2, 11).toUpperCase();
        const previsaoEntrega = new Date();
        previsaoEntrega.setDate(previsaoEntrega.getDate() + 7);
        
        const [clienteData] = await connection.execute('SELECT endereco FROM view_clientes WHERE id = ?', [id_conta]);
        if (clienteData.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Conta não encontrada' });
        }
        const endereco = clienteData[0].endereco || 'Endereço não informado';
        
        await connection.execute(
            'INSERT INTO entregas (id_pedido, codigo_rastreio, endereco_entrega, previsao_entrega) VALUES (?, ?, ?, ?)',
            [pedidoId, codigoRastreio, endereco, previsaoEntrega.toISOString().split('T')[0]]
        );
        
        await connection.commit();
        await connection.end();
        
        res.json({ success: true, id: pedidoId, message: 'Pedido criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ error: 'Erro ao criar pedido' });
    }
});

// ==================== ROTAS PARA ENTREGAS ====================

// Listar entregas
app.get('/api/entregas', async (req, res) => {
    try {
        const connection = await connectDB();
        const [rows] = await connection.execute(`
            SELECT 
                e.*,
                p.id as pedido_id,
                vc.nome_razao as cliente_nome
            FROM entregas e
            JOIN pedidos p ON e.id_pedido = p.id
            JOIN view_clientes vc ON p.id_conta = vc.id
            ORDER BY e.created_at DESC
        `);
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar entregas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar status da entrega
app.put('/api/entregas/:id/status', async (req, res) => {
    try {
        const connection = await connectDB();
        const { id } = req.params;
        const { status } = req.body;
        
        let updateFields = 'status = ?';
        let updateValues = [status];
        
        if (status === 'enviado' || status === 'transito') {
            updateFields += ', data_envio = ?';
            updateValues.push(new Date());
        } else if (status === 'entregue') {
            updateFields += ', data_entrega = ?';
            updateValues.push(new Date());
        }
        
        updateValues.push(id);
        
        await connection.execute(`UPDATE entregas SET ${updateFields} WHERE id = ?`, updateValues);
        await connection.end();
        
        res.json({ success: true, message: 'Status da entrega atualizado!' });
    } catch (error) {
        console.error('Erro ao atualizar entrega:', error);
        res.status(500).json({ error: 'Erro ao atualizar entrega' });
    }
});

// Confirmar entrega pelo cliente
app.put('/api/entregas/:id/confirmar', async (req, res) => {
    try {
        const connection = await connectDB();
        const { id } = req.params;
        
        // Verificar se a entrega existe
        const [entregaExiste] = await connection.execute('SELECT id, id_pedido FROM entregas WHERE id = ?', [id]);
        if (entregaExiste.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Entrega não encontrada' });
        }
        
        await connection.beginTransaction();
        
        try {
            // Atualizar status da entrega para "confirmada"
            await connection.execute(
                'UPDATE entregas SET status = "confirmada", data_confirmacao = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
            
            // Atualizar status do pedido relacionado
            await connection.execute(
                'UPDATE pedidos SET status = "finalizado" WHERE id = ?',
                [entregaExiste[0].id_pedido]
            );
            
            await connection.commit();
            await connection.end();
            
            res.json({ success: true, message: 'Entrega confirmada com sucesso!' });
        } catch (error) {
            await connection.rollback();
            await connection.end();
            throw error;
        }
    } catch (error) {
        console.error('Erro ao confirmar entrega:', error);
        res.status(500).json({ error: 'Erro ao confirmar entrega' });
    }
});

// ==================== ROTAS PARA ESTATÍSTICAS ====================

// Dashboard - estatísticas gerais
app.get('/api/dashboard', async (req, res) => {
    try {
        const connection = await connectDB();
        
        // Total de clientes
        const [clientesCount] = await connection.execute('SELECT COUNT(*) as total FROM conta WHERE status = "ativo"');
        
        // Total de produtos
        const [produtosCount] = await connection.execute('SELECT COUNT(*) as total FROM produtos WHERE status = "ativo"');
        
        // Total de pedidos
        const [pedidosCount] = await connection.execute('SELECT COUNT(*) as total FROM pedidos');
        
        // Total de entregas em andamento
        const [entregasCount] = await connection.execute('SELECT COUNT(*) as total FROM entregas WHERE status NOT IN ("entregue", "confirmada")');
        
        // Clientes por tipo
        const [clientesPorTipo] = await connection.execute(`
            SELECT tipo, COUNT(*) as total 
            FROM conta 
            WHERE status = "ativo"
            GROUP BY tipo
        `);
        
        // Pedidos por status
        const [pedidosPorStatus] = await connection.execute(`
            SELECT status, COUNT(*) as total 
            FROM pedidos 
            GROUP BY status
        `);
        
        await connection.end();
        
        res.json({
            totalClientes: clientesCount[0].total,
            totalProdutos: produtosCount[0].total,
            totalPedidos: pedidosCount[0].total,
            totalEntregas: entregasCount[0].total,
            clientesPorTipo,
            pedidosPorStatus
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Inicializar servidor
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Testar conexão com o banco antes de iniciar o servidor
        const testConnection = await connectDB();
        await testConnection.end();
        
        app.listen(PORT, () => {
            console.log('\n ===== MERCADO DIGITAL - SISTEMA E-COMMERCE =====');
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Acesse: http://localhost:${PORT}`);
            console.log(`API disponível em: http://localhost:${PORT}/api`);
            console.log('✅ Sistema pronto para uso!\n');
            
            // Abrir automaticamente no navegador
            setTimeout(() => {
                console.log('Abrindo navegador automaticamente...');
                open(`http://localhost:${PORT}`).catch(err => {
                    console.log('Não foi possível abrir o navegador automaticamente');
                    console.log('Abra manualmente: http://localhost:3000');
                });
            }, 1000);
        });
    } catch (error) {
        console.error('\n❌ Erro ao inicializar o servidor:');
        console.error('💾 Verifique se o MySQL está rodando');
        console.error('🔑 Verifique as credenciais do banco de dados');
        console.error('📋 Verifique se o banco "e_comerce" existe');
        console.error('\n📖 Para criar o banco, execute o script SQL fornecido\n');
        process.exit(1);
    }
}

startServer();
