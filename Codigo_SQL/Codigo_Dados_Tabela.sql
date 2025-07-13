CREATE DATABASE e_comerce;
USE e_comerce;

-- Tabela Cliente Pessoa Física
CREATE TABLE cliente_pf (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    data_nascimento DATE,
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    endereco TEXT NOT NULL,
    senha varchar (10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela para Cliente Pessoa Jurídica
CREATE TABLE cliente_pj (
    id INT AUTO_INCREMENT PRIMARY KEY,
    razao_social VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(20),
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    endereco TEXT NOT NULL,
    senha varchar (10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Conta, que referencia PF ou PJ
CREATE TABLE conta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('PF', 'PJ') NOT NULL,
    id_cliente_pf INT, 
    id_cliente_pj INT,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_conta_pf FOREIGN KEY (id_cliente_pf) REFERENCES cliente_pf(id) ON DELETE CASCADE,
    CONSTRAINT fk_conta_pj FOREIGN KEY (id_cliente_pj) REFERENCES cliente_pj(id) ON DELETE CASCADE,

    CHECK (
        (tipo = 'PF' AND id_cliente_pf IS NOT NULL AND id_cliente_pj IS NULL)
        OR
        (tipo = 'PJ' AND id_cliente_pj IS NOT NULL AND id_cliente_pf IS NULL)
    )
);

-- Tabela de Produtos
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria ENUM('alimentacao', 'bebidas', 'higiene', 'limpeza', 'outros') NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    imagem VARCHAR(500),
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Pedidos
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_conta INT NOT NULL,
    data_pedido DATE NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pendente', 'confirmado', 'enviado', 'entregue', 'cancelado') DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pedido_conta FOREIGN KEY (id_conta) REFERENCES conta(id) ON DELETE CASCADE
);

-- Tabela de Itens do Pedido
CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    CONSTRAINT fk_item_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_produto FOREIGN KEY (id_produto) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de Pagamento
CREATE TABLE pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    tipo ENUM('dinheiro', 'cartao-credito', 'cartao-debito', 'pix', 'boleto') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    dados TEXT,
    status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
    data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pagamento_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- Tabela de Entregas (CORRIGIDA - com data_confirmacao já incluída)
CREATE TABLE entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    codigo_rastreio VARCHAR(20) UNIQUE NOT NULL,
    status ENUM('preparando', 'enviado', 'transito', 'entregue', 'confirmada') DEFAULT 'preparando',
    endereco_entrega TEXT NOT NULL,
    data_envio DATETIME NULL,
    data_confirmacao DATETIME NULL,
    previsao_entrega DATE NULL,
    data_entrega TIMESTAMP NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_entrega_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE
);


-- Inserir dados de exemplo para produtos
INSERT INTO produtos (nome, categoria, descricao, preco, estoque, imagem) VALUES
('Arroz Branco 5kg', 'alimentacao', 'Arroz branco tipo 1, pacote de 5kg', 15.90, 50, 'https://www.sondadelivery.com.br/Arquivos/ProdutosSku/22721/7893500020158.png'),
('Feijão Preto 1kg', 'alimentacao', 'Feijão preto pacote de 1kg', 8.50, 30, 'https://www.saborsulalimentos.com.br/wp-content/uploads/2024/04/18-mockup-sabor-sul-feijao-preto1kg.png'),
('Refrigerante Pepsi 2L', 'bebidas', 'Refrigerante Pepsi, garrafa de 2 litros', 6.99, 25, 'https://media.istockphoto.com/id/530939193/pt/foto/pepsi-refrigerantes-gaseificados-frasco.jpg?s=612x612&w=0&k=20&c=3zoXYDGxCaYW0M6ePatZmvEMMf9zjihw1NyevabTrCI='),
('Sabonete Líquido 250ml', 'higiene', 'Sabonete líquido de limpeza 250ml', 12.50, 40, 'https://drogariasp.vteximg.com.br/arquivos/ids/1016612-1000-1000/840947---Sabonete-Liquido-Infantil-Ever-Baby-Lavanda-250ml-2.jpg?v=638394126324100000'),
('Detergente Líquido Da Cor De Persil 500ml', 'limpeza', 'Detergente Líquido Da Cor De Persil', 3.99, 60, 'https://thumbs.dreamstime.com/z/detergente-l%C3%ADquido-da-cor-de-persil-128994147.jpg');

-- Views para facilitar consultas
CREATE VIEW view_clientes AS
SELECT 
    c.id,
    c.tipo,
    CASE 
        WHEN c.tipo = 'PF' THEN pf.nome
        WHEN c.tipo = 'PJ' THEN pj.razao_social
    END as nome_razao,
    CASE 
        WHEN c.tipo = 'PF' THEN pf.cpf
        WHEN c.tipo = 'PJ' THEN pj.cnpj
    END as documento,
    CASE 
        WHEN c.tipo = 'PF' THEN pf.email
        WHEN c.tipo = 'PJ' THEN pj.email
    END as email,
    CASE 
        WHEN c.tipo = 'PF' THEN pf.telefone
        WHEN c.tipo = 'PJ' THEN pj.telefone
    END as telefone,
    CASE 
        WHEN c.tipo = 'PF' THEN pf.endereco
        WHEN c.tipo = 'PJ' THEN pj.endereco
    END as endereco,
    c.status,
    c.created_at
FROM conta c
LEFT JOIN cliente_pf pf ON c.id_cliente_pf = pf.id
LEFT JOIN cliente_pj pj ON c.id_cliente_pj = pj.id;

-- Exemplos de consultas úteis
SELECT * FROM view_clientes;
SELECT * FROM produtos WHERE status = 'ativo';
SELECT * FROM pedidos WHERE status = 'pendente';

drop database e_comerce;
