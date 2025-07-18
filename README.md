# Authentify: A QR Code-based Anti-Counterfeit System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Authentify is a cutting-edge, QR code-based anti-counterfeit system designed to ensure product authenticity and supply chain integrity. It leverages a unique combination of **custom cryptography**, **steganography**, and a **blockchain-inspired ledger** to provide a robust and secure verification process.

## Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Security Features](#security-features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Generating a Product QR Code](#generating-a-product-qr-code)
  - [Verifying a Product](#verifying-a-product)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
  - [POST /api/generate](#post-apigenerate)
  - [POST /api/verify](#post-apiverify)

---

## About The Project

Counterfeit products pose a significant threat to consumers and businesses alike. Authentify addresses this problem by providing a multi-layered security system that is difficult to forge.

Here's how it works:
1.  **Generation**: When a new product is registered, the system generates a unique **Product QR Code**. This QR code contains encrypted product details and a digital signature. Simultaneously, a secret key is hidden within a user-provided cover image using steganography, creating a **Secret Key Image**.
2.  **Ledger Entry**: A new block is added to a blockchain-like ledger, containing a hash of the product details, the signature, and a reference to the previous block. This creates an immutable and tamper-evident record of the product. A Proof-of-Work (PoW) mechanism is used to secure the ledger.
3.  **Verification**: To verify a product, the user scans the Product QR Code and uploads the corresponding Secret Key Image. The system then uses the secret key to decrypt the product details, verifies the digital signature, and checks the ledger to ensure the product has not been previously marked as verified.

This process ensures that only authentic products with their corresponding secret key images can be successfully verified.

---

## Key Features

- **QR Code Generation**: Creates unique QR codes for each product.
- **Steganography**: Hides the secret key within a cover image for secure distribution.
- **Blockchain Ledger**: Creates a tamper-evident record of all registered products.
- **Proof-of-Work**: Secures the blockchain ledger by requiring computational effort to add new blocks.
- **Two-Factor Verification**: Requires both the Product QR code and the Secret Key Image for successful verification.
- **User-Friendly Interface**: Simple and intuitive interface for generating and verifying products.

---

## Security Features

Authentify employs a custom-built cryptographic library and a blockchain-inspired ledger to ensure the highest level of security.

### Custom Cryptography

- **Advanced Quantum-Hardened Cryptography (advancedQHC)**: A custom encryption algorithm used to protect the product details. It uses a combination of XOR, rotational ciphers, and nibble swapping over multiple rounds to create a strong and efficient encryption scheme.
- **Advanced Quantum Digital Signature (advancedQDS)**: A custom digital signature algorithm used to verify the integrity and authenticity of the encrypted data. The signature is generated based on a hash of the encrypted data and the secret key.

### Blockchain Ledger

The system uses a blockchain-inspired ledger to maintain a tamper-evident record of all products. Each block in the ledger contains:
- A timestamp
- A hash of the product details
- The digital signature
- The hash of the previous block
- A nonce (for Proof-of-Work)

The ledger is stored in a MongoDB database and managed using Prisma. When a product is verified, the system checks the ledger to see if the product has been verified before. This prevents the same QR code from being used for multiple products.

---

## Technologies Used

This project is built with a modern, robust, and scalable tech stack:

- **[Next.js](https://nextjs.org/)**: A React framework for building full-stack web applications.
- **[React](https://reactjs.org/)**: A JavaScript library for building user interfaces.
- **[TypeScript](https://www.typescriptlang.org/)**: A typed superset of JavaScript that compiles to plain JavaScript.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development.
- **[Prisma](https://www.prisma.io/)**: A next-generation ORM for Node.js and TypeScript.
- **[MongoDB](https://www.mongodb.com/)**: A NoSQL database for modern applications.

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18.18.0 or later)
- npm, yarn, or pnpm

### Installation

1.  Clone the repo
    ```sh
    git clone [https://github.com/harenimuthu/authentify.git](https://github.com/harenimuthu/authentify.git)
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Set up your environment variables by creating a `.env` file in the root of the project. You will need to add your MongoDB connection string:
    ```
    DATABASE_URL="mongodb+srv://<user>:<password>@<cluster-url>/<database-name>"
    ```
4. Run the development server:
   ```bash
   npm run dev
