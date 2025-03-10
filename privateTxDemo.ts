import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config();

import { 
    itString, Provider, Wallet, 
    Interface, ContractFactory, BytesLike, BaseWallet,
    getAccountBalance, CotiNetwork, getDefaultProvider, 
    isProviderConnected, printAccountDetails, printNetworkDetails, 
    validateAddress
} from "@coti-io/coti-ethers";

const GAS_LIMIT = 12000000;

async function deploy(abi: Interface, bytecode: BytesLike, wallet: BaseWallet, args: any[]): Promise<any> {
    const contractFactory = new ContractFactory(abi, bytecode, wallet);
    const contract = await contractFactory.deploy(...args, { gasLimit: 15000000 });
    await contract.waitForDeployment();
    return contract;
}

function getWallet(provider: Provider) {
    if (!process.env.SIGNING_KEY) {
        const wallet = Wallet.createRandom(provider);
        setEnvValue("SIGNING_KEY", `${wallet.privateKey}`);
        console.log("Created new account ", wallet.address, " and saved into .env file");
        throw new Error(`Please use faucet to fund account ${wallet.address}`);
    }
    return new Wallet(process.env.SIGNING_KEY, provider);
}

function setEnvValue(key: string, value: string) {
    fs.appendFileSync("./.env", `\n${key}=${value}`, "utf8");
}

function validateTxStatus(tx: any) {
    return tx?.status === 1;
}

async function setupAccount(provider: Provider) {
    const wallet = getWallet(provider);
    if (await getAccountBalance(wallet.address, provider) === BigInt("0")) {
        throw new Error(`Please use faucet to fund account ${wallet.address}`);
    }
    
    const toAccount = async (wallet: Wallet, userKey: string | undefined) => {
        if (userKey) {
            wallet.setAesKey(userKey);
            return wallet;
        }
        console.log("Onboarding user ", wallet.address);
        await wallet.generateOrRecoverAes();
        setEnvValue("USER_KEY", wallet.getUserOnboardInfo()?.aesKey!);
        return wallet;
    };
    
    return toAccount(wallet, process.env.USER_KEY);
}

async function getDataOnChainContract(user: Wallet): Promise<any> {
    console.log("Deploying DataOnChain contract...");
    const dataOnChainFilePath = path.join(
        "node_modules", "@coti-io", "coti-contracts-examples", "artifacts", 
        "contracts", "DataOnChain.sol", "DataOnChain.json"
    );

    const dataOnChainArtifacts: any = JSON.parse(fs.readFileSync(dataOnChainFilePath, "utf8"));
    const contract = await deploy(dataOnChainArtifacts["abi"], dataOnChainArtifacts["bytecode"], user, []);
    
    console.log("Contract deployed successfully!");
    return contract;
}

async function testUserEncryptedString(contract: any, user: Wallet) {
    console.log("Encrypting user data...");
    const testString = 'Hello World! I am a garbled message on COTI';
    const func = contract.setSomeEncryptedStringEncryptedInput;
    const encryptedString = await user.encryptValue(testString, await contract.getAddress(), func.fragment.selector) as itString;
    console.log("Encrypted string:", encryptedString.ciphertext.value);

    console.log("Sending encrypted string transaction...");
    let tx1 = await contract.setSomeEncryptedStringEncryptedInput(encryptedString, { gasLimit: GAS_LIMIT });
    console.log(`Transaction sent! Hash: ${tx1.hash}`);
    let response = await tx1.wait();
    if (!validateTxStatus(response)) throw Error("Transaction failed: setSomeEncryptedStringEncryptedInput");
    console.log(`Transaction confirmed! Hash: ${response?.hash}`);

    console.log("Setting user encrypted string...");
    let tx2 = await contract.setUserSomeEncryptedStringEncryptedInput({ gasLimit: GAS_LIMIT });
    console.log(`Transaction sent! Hash: ${tx2.hash}`);
    response = await tx2.wait();
    if (!validateTxStatus(response)) throw Error("Transaction failed: setUserSomeEncryptedStringEncryptedInput");
    console.log(`Transaction confirmed! Hash: ${response?.hash}`);

    console.log("Fetching and decrypting stored encrypted data...");
    const userEncData = await contract.getUserSomeEncryptedStringEncryptedInput();
    const decryptedUserString = await user.decryptValue(userEncData);
    if (testString !== decryptedUserString) {
        throw new Error(`Expected "${testString}", but got "${decryptedUserString}"`);
    }
    console.log(`User data decrypted successfully - Value: "${decryptedUserString}"`);
}

async function main() {
    console.log("Initializing provider...");
    const provider = getDefaultProvider(CotiNetwork.Testnet);
    if (!await isProviderConnected(provider)) throw Error("Provider not connected");
    console.log("Provider connected successfully!");
    await printNetworkDetails(provider);
    
    console.log("Setting up user account...");
    const owner = await setupAccount(provider);
    await printAccountDetails(provider, owner.address);
    console.log(`User Address: ${owner.address}`);
    
    console.log("Validating user address...");
    const validAddress = await validateAddress(owner.address);
    if (!validAddress.valid) throw Error("Invalid address");
    console.log("Address is valid!");
    
    console.log("Executing DataOnChain contract interactions...");
    const contract = await getDataOnChainContract(owner);
    await testUserEncryptedString(contract, owner);
}

main().catch(console.error);
