# Welcome to Colyseus!

This project has been created using [⚔️ `create-colyseus-app`](https://github.com/colyseus/create-colyseus-app/) - an npm init template for kick starting a Colyseus project in TypeScript.

[Documentation](http://docs.colyseus.io/)

## :crossed_swords: Usage

```
npm start
```

## Structure

- `index.ts`: main entry point, register an empty room handler and attach [`@colyseus/monitor`](https://github.com/colyseus/colyseus-monitor)
- `src/rooms/MyRoom.ts`: an empty room handler for you to implement your logic
- `src/rooms/schema/MyRoomState.ts`: an empty schema used on your room's state.
- `loadtest/example.ts`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `package.json`:
    - `scripts`:
        - `npm start`: runs `ts-node-dev index.ts`
        - `npm test`: runs mocha test suite
        - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.ts` script.
- `tsconfig.json`: TypeScript configuration file


## Deployment

This project includes a GitHub Actions CI/CD pipeline that automatically tests, builds, and deploys to an Ubuntu server with NGINX.

### Prerequisites

#### On your Ubuntu server:

1. **Install Node.js 20+**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2 globally**
   ```bash
   sudo npm install -g pm2
   ```

3. **Setup PM2 to start on boot**
   ```bash
   pm2 startup systemd
   # Follow the instructions from the output
   ```

4. **Install and configure NGINX**
   ```bash
   sudo apt-get install -y nginx
   ```

5. **Create app directory**
   ```bash
   sudo mkdir -p /var/www/colyseus-server
   sudo chown -R $USER:$USER /var/www/colyseus-server
   ```

6. **Setup SSH key authentication**
   - Generate an SSH key pair (locally): `ssh-keygen -t ed25519 -C "github-actions"`
   - Add the public key to `~/.ssh/authorized_keys` on your server
   - Keep the private key for GitHub secrets

### NGINX Configuration

Create `/etc/nginx/sites-available/colyseus`:

```nginx
server {
    listen 80;
    server_name your.domain.com;

    # WebSocket and HTTP upgrade support
    location / {
        proxy_pass http://127.0.0.1:2567;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout
        proxy_read_timeout 86400;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/colyseus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret | Description | Example |
|--------|-------------|---------|
| `SSH_PRIVATE_KEY` | Private SSH key for server access | Contents of your private key file |
| `SSH_HOST` | Server IP or domain | `123.45.67.89` or `server.domain.com` |
| `SSH_USER` | SSH username | `ubuntu` or `deploy` |
| `SSH_PORT` | SSH port (optional, defaults to 22) | `22` |
| `APP_PATH` | Deployment directory on server | `/var/www/colyseus-server` |
| `ENV_PRODUCTION` | Production environment variables (optional) | `ADMIN_PASSWORD=secretpass` |

### Environment Variables

Create a `.env.production` file on your server at `$APP_PATH/.env.production`:

```bash
NODE_ENV=production
ADMIN_PASSWORD=your_secure_password_here
```

Or include it as the `ENV_PRODUCTION` GitHub secret (multiline):
```
NODE_ENV=production
ADMIN_PASSWORD=your_secure_password_here
```

### SSL/HTTPS Setup (Recommended)

Use Certbot for free SSL certificates:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your.domain.com
```

Follow the prompts to automatically configure NGINX with SSL.

### How It Works

1. **On Push to `main`**: 
   - Runs tests (`npm test`)
   - Builds the project (`npm run build`)
   - Uploads build artifacts

2. **Deploy Job**:
   - Downloads build artifacts
   - Syncs files to server via rsync over SSH
   - Installs production dependencies only
   - Reloads PM2 with zero-downtime deployment

### Manual Deployment

If you need to deploy manually:

```bash
# On your local machine
npm run build
rsync -avz -e "ssh -p 22" build package.json package-lock.json ecosystem.config.cjs user@server:/var/www/colyseus-server/

# On the server
cd /var/www/colyseus-server
npm ci --omit=dev
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save
```

### Monitoring

View logs and status:
```bash
pm2 status
pm2 logs colyseus-app
pm2 monit
```

### Troubleshooting

- **Port already in use**: Check what's running on port 2567 with `sudo lsof -i :2567`
- **PM2 not found**: Ensure PM2 is in the PATH for non-interactive SSH sessions
- **NGINX 502 Bad Gateway**: Check if the app is running with `pm2 status` and logs with `pm2 logs`
- **WebSocket connection fails**: Verify NGINX WebSocket upgrade headers are configured correctly

## License

MIT
