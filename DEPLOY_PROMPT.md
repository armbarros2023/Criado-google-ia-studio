# Prompt para Backend e Deploy em VPS (Hostinger)

Este prompt foi desenvolvido para migrar o sistema de gestão de licenças de um ambiente de desenvolvimento para produção em uma VPS.

## 1. Configuração do Ambiente VPS
- **SO Recomendado:** Ubuntu 22.04 LTS
- **Stack:** Node.js 20+, PostgreSQL (em vez de SQLite para produção), Nginx (Reverse Proxy), PM2 (Process Manager).

## 2. Prompt para Geração do Backend de Produção
"Atue como um Engenheiro de Backend Sênior. Preciso converter um sistema Express + SQLite para Express + PostgreSQL.
O sistema gerencia licenças regulatórias.
Requisitos:
- Implementar autenticação JWT segura com expiração de 24h.
- Usar Bcrypt para hash de senhas.
- Configurar Multer para upload de arquivos (PDF) para o sistema de arquivos ou S3.
- Criar migrations para as tabelas: users, companies, licenses, documents.
- Implementar rotas de CRUD protegidas por middleware de autenticação e autorização (admin vs user).
- Adicionar logs de auditoria para cada alteração em licenças.
- Configurar CORS para o domínio da aplicação.
- Usar variáveis de ambiente (.env) para todas as credenciais."

## 3. Passos para Deploy na Hostinger
1. **Acesso SSH:** `ssh root@seu_ip_vps`
2. **Instalação de Dependências:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql nginx
   sudo npm install -g pm2
   ```
3. **Configuração do Banco:** Criar database e usuário no PostgreSQL.
4. **Clone e Build:**
   ```bash
   git clone <seu-repositorio>
   npm install
   npm run build
   ```
5. **Configuração Nginx:** Criar arquivo em `/etc/nginx/sites-available/licencagest` apontando para a porta 3000.
6. **Execução:** `pm2 start dist/server.js --name licencagest`

## 4. Protocolos de Segurança Recomendados
- **SSL/TLS:** Usar Certbot (Let's Encrypt) para HTTPS.
- **Firewall:** Configurar UFW para permitir apenas portas 80, 443 e 22.
- **Fail2Ban:** Para prevenir ataques de força bruta no SSH.
- **Backups:** Rotina diária de dump do PostgreSQL.
