# DLM Frontend - Distributed Logistics Dashboard

![React](https://img.shields.io/badge/React-18.x-cyan)
![Vite](https://img.shields.io/badge/Vite-5.x-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind](https://img.shields.io/badge/Styling-Glassmorphism-black)

This is the standalone **React + Vite Frontend Repository** for the Distributed Logistics & Warehouse Management System (DLM).

---

## ⚙️ Production Architecture & CI/CD Pipeline

```text
Push to production branch (or workflow_dispatch)
      ↓
npm ci
      ↓
npm run build
      ↓
Build Docker image (tagged latest & SHA)
      ↓
Push SHA-tagged image to GHCR (ghcr.io)
      ↓
SSH to VPS (/opt/dlm-frontend)
      ↓
Pull exact SHA image
      ↓
Deploy via Docker Compose (--no-build --force-recreate)
      ↓
Health check (PRODUCTION_HEALTH_URL)
      │
      ├── PASS → Deployment Successful ✅ & Image Pruning
      │
      └── FAIL → Automatic Rollback to previous container image & Workflow Exit 1 ❌
```

---

## 🔒 Required GitHub Repository Secrets

Configure the following secrets in GitHub Repository Settings -> **Secrets and variables** -> **Actions**:

| Secret Name | Description | Example / Usage |
| :--- | :--- | :--- |
| `SSH_HOST` | Production VPS IP address or domain | `192.0.2.1` / `frontend.dlm.com` |
| `SSH_USER` | SSH user on production VPS | `root` / `ubuntu` |
| `SSH_KEY` | Private SSH key for production VPS | `-----BEGIN OPENSSH PRIVATE KEY-----` |
| `GHCR_USERNAME` | Production GitHub / GHCR username | `your-github-username` |
| `GHCR_TOKEN` | Production-scoped Personal Access Token (read:packages) | `ghp_xxxxxxxxxxxx` |
| `PRODUCTION_HEALTH_URL` | Live URL for automated health verification | `https://dlm.yourdomain.com` (Returns 200 OK) |

---

## 📂 Expected Production Server Directory Setup

On your production VPS server:

```bash
# Strict production directory
/opt/dlm-frontend/
├── docker-compose.yml
```

### Production `docker-compose.yml` Template (`/opt/dlm-frontend/docker-compose.yml`):

```yaml
version: '3.8'

services:
  frontend:
    image: ghcr.io/your-github-username/dlm-frontend:${IMAGE_TAG:-latest}
    container_name: dlm-frontend-app
    restart: always
    ports:
      - "5001:5001"
    environment:
      - VITE_API_URL=http://localhost:5000/api/v1
```

---

## 🚀 Running Locally

```bash
npm install
npm run dev     # Starts Vite dev server on http://localhost:5001
```

### Trigger Production Sync & Deploy
```bash
npm run live    # Syncs main branch to production branch and triggers GitHub Actions CI/CD
```
