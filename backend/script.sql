CREATE DATABASE IF NOT EXISTS sistema_visitas;
USE sistema_visitas;

CREATE TABLE IF NOT EXISTS empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL          
);

CREATE TABLE IF NOT EXISTS visita (
    id INT AUTO_INCREMENT PRIMARY KEY,             
    nome VARCHAR(255) NOT NULL,             
    documento VARCHAR(20) NOT NULL,           
    empresa_id INT,                         
    horario_entrada TIME NOT NULL,           
    horario_saida TIME DEFAULT NULL,       
    destino TEXT NOT NULL,                      
    data_visita DATE NOT NULL,                 
    status VARCHAR(20) DEFAULT 'Presente',        
    
    -- Chave estrangeira: liga a visita a uma empresa
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE SET NULL
);

INSERT INTO empresa (nome) VALUES 
('Empresa Exemplo'),
('Consultoria ABC'),
('Servicos XYZ');
