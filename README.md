# TenantBots 🤖

![Deploy Status](https://github.com/eddndev/tenantbots/actions/workflows/deploy.yml/badge.svg)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)
![Fastify](https://img.shields.io/badge/Fastify-v4-black?logo=fastify)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)

**TenantBots** is a robust, scalable, and multitenant WhatsApp chatbot solution designed for businesses. It empowers you to create, manage, and deploy complex conversational flows with ease using a visual dashboard.

Built with performance and scalability in mind, TenantBots leverages the **Baileys** library for direct WhatsApp integration, **Fastify** for high-performance APIs, and **Prisma** for type-safe database interactions.

## 🚀 Key Features

-   **Multitenant Architecture**: Support multiple independent WhatsApp sessions/bots on a single server instance.
-   **Visual Command Editor**: Drag-and-drop interface to design conversation flows (Text, Image, Audio, Delays).
-   **Time-Conditional Logic**: Define different responses based on the time of day (e.g., "Good morning" vs. "Closed now").
-   **Rich Media Support**: Upload images and audio directly, with support for captions and generic file handling.
-   **Advanced Triggers**: Match commands via Exact Match, Contains, Starts With, or Regex for flexible user intent detection.
-   **Import/Export**: Clone configuration from existing bots to rapidly provision new tenants.
-   **Dockerized Deployment**: Fully containerized with Docker Compose for easy orchestration of App, DB, and Redis.

## 🛠️ Tech Stack

-   **Backend**: Node.js, Fastify, TypeScript
-   **WhatsApp Core**: @whiskeysockets/baileys
-   **Database**: MySQL, Prisma ORM
-   **Frontend**: Astro, React, TailwindCSS, Lucide Icons
-   **Infrastructure**: Docker, GitHub Actions (CI/CD)

## 📦 Getting Started

### Prerequisites

-   Node.js v20+
-   Docker & Docker Compose
-   MySQL Database

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/eddndev/tenantbots.git
    cd tenantbots
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    cd client && npm install && cd ..
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="mysql://user:password@localhost:3306/tenantbots"
    API_KEY="your-secure-api-key"
    ```

4.  **Database Migration:**
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    # In a separate terminal for frontend
    cd client && npm run dev
    ```

## 🚢 Deployment

The project includes a configured **GitHub Actions** workflow (`deploy.yml`) for automated deployment to a VPS via SSH.

To configure deployment:
1.  Set up your VPS with Docker and Nginx.
2.  Add the following **Repository Secrets** in GitHub:
    -   `HOST`, `USERNAME`, `KEY`, `PORT`: SSH Connection details.
    -   `ENV_FILE`: Complete `.env` file content for production.

Pushing to the `main` branch will automatically trigger the build and deployment pipeline.

## 📄 License

This project is licensed under the ISC License.
