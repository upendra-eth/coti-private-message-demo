# COTI Chain Private Message Demo

This project demonstrates how to deploy a smart contract on the **COTI Chain** and handle encrypted user data using COTI's SDK.

## Overview
The demo includes:
- Setting up a wallet on COTI Testnet  
- Deploying a `DataOnChain` smart contract  
- Encrypting and sending user data to the contract  
- Decrypting and verifying stored encrypted data  

## Requirements
- **Node.js** v18+  
- **npm** or **yarn**  
- A **COTI Testnet account** (funded with test tokens)  

## Setup
1. Clone the repository:
```bash
git clone https://github.com/your-repo/coti-private-message-demo.git
cd coti-private-message-demo
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Add the following keys to `.env`:
```
SIGNING_KEY=<your-private-key>
USER_KEY=<your-user-key> # Leave empty if setting up for the first time
```

5. Fund your account using the COTI Testnet faucet.

## Usage
To run the demo:
```bash
npm run start
```

### Key Functions:
- **deploy** – Deploys the `DataOnChain` contract  
- **testUserEncryptedString** – Encrypts and sends user data, then decrypts and verifies it  
- **setupAccount** – Sets up a wallet and handles onboarding  

## Expected Output
- The contract is deployed successfully  
- The encrypted data is stored and retrieved successfully  
- The decrypted data matches the original input  

## Notes
- Make sure the wallet is funded before deploying the contract.  
- If no `SIGNING_KEY` is provided, a new wallet will be created and stored in `.env`.  
- If the transaction fails, check the gas limit and network connection.  

## License
This project is licensed under the **MIT License**.
