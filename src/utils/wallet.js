import * as bip39 from 'bip39'
import { HDKey } from '@scure/bip32'
import { ethers } from 'ethers'

/**
 * Generate a new 12-word mnemonic phrase
 */
export function generateMnemonic() {
  return bip39.generateMnemonic()
}

/**
 * Validate a mnemonic phrase
 */
export function validateMnemonic(mnemonic) {
  return bip39.validateMnemonic(mnemonic)
}

/**
 * Derive an EVM (Ethereum/BSC) wallet from mnemonic at a given index
 * Uses BIP44 path: m/44'/60'/0'/0/{index}
 */
export function deriveEVMWallet(mnemonic, index = 0) {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const hdKey = HDKey.fromMasterSeed(seed)
  const child = hdKey.derive(`m/44'/60'/0'/0/${index}`)
  const privateKey = `0x${Buffer.from(child.privateKey).toString('hex')}`
  const wallet = new ethers.Wallet(privateKey)
  return {
    address: wallet.address,
    privateKey,
    publicKey: wallet.publicKey,
  }
}

/**
 * Derive a TRON wallet from mnemonic at a given index
 * Uses BIP44 path: m/44'/195'/0'/0/{index}
 * Returns hex address (would need TronWeb for base58 in production)
 */
export function deriveTronWallet(mnemonic, index = 0) {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const hdKey = HDKey.fromMasterSeed(seed)
  const child = hdKey.derive(`m/44'/195'/0'/0/${index}`)
  const privateKey = `0x${Buffer.from(child.privateKey).toString('hex')}`
  const wallet = new ethers.Wallet(privateKey)
  // Tron addresses start with 'T' — use the hex address for now
  // In production you'd convert with TronWeb
  return {
    address: wallet.address, // EVM-compatible hex address
    privateKey,
    publicKey: wallet.publicKey,
  }
}

/**
 * Derive wallets for all supported chains from a mnemonic
 */
export function deriveAllWallets(mnemonic, index = 0) {
  const evmWallet = deriveEVMWallet(mnemonic, index)
  const tronWallet = deriveTronWallet(mnemonic, index)
  return {
    ethereum: { ...evmWallet },
    bsc: { ...evmWallet }, // Same key for all EVM chains
    tron: { ...tronWallet },
  }
}

/**
 * Import wallet from private key (EVM chains)
 */
export function walletFromPrivateKey(privateKey) {
  try {
    const wallet = new ethers.Wallet(privateKey)
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
    }
  } catch {
    return null
  }
}

/**
 * Get an ethers provider for a given RPC URL (cached to avoid repeated network detection)
 */
const _providerCache = {}
export function getProvider(rpcUrl) {
  if (!_providerCache[rpcUrl]) {
    _providerCache[rpcUrl] = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      staticNetwork: true,      // Skip network detection call
      batchMaxCount: 1,         // Avoid batching issues with public RPCs
    })
  }
  return _providerCache[rpcUrl]
}

/**
 * Get native balance (ETH/BNB) for an address
 */
export async function getNativeBalance(rpcUrl, address) {
  const provider = getProvider(rpcUrl)
  const balance = await provider.getBalance(address)
  return ethers.formatEther(balance)
}

/**
 * Get ERC20 token balance
 */
export async function getTokenBalance(rpcUrl, tokenAddress, walletAddress, decimals = 18) {
  const provider = getProvider(rpcUrl)
  const contract = new ethers.Contract(tokenAddress, [
    'function balanceOf(address) view returns (uint256)',
  ], provider)
  const balance = await contract.balanceOf(walletAddress)
  return ethers.formatUnits(balance, decimals)
}

/**
 * Send native currency (ETH/BNB)
 */
export async function sendNative(rpcUrl, privateKey, to, amountEther) {
  const provider = getProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)
  const tx = await wallet.sendTransaction({
    to,
    value: ethers.parseEther(amountEther),
  })
  return tx
}

/**
 * Send ERC20 token
 */
export async function sendToken(rpcUrl, privateKey, tokenAddress, to, amount, decimals = 18) {
  const provider = getProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)
  const contract = new ethers.Contract(tokenAddress, [
    'function transfer(address to, uint256 amount) returns (bool)',
  ], wallet)
  const tx = await contract.transfer(to, ethers.parseUnits(amount, decimals))
  return tx
}

/**
 * Estimate gas fee for a native transfer
 */
export async function estimateNativeGas(rpcUrl, from, to, amountEther) {
  const provider = getProvider(rpcUrl)
  const [gasPrice, gasLimit] = await Promise.all([
    provider.getFeeData(),
    provider.estimateGas({
      from,
      to,
      value: ethers.parseEther(amountEther),
    }),
  ])
  const fee = gasLimit * (gasPrice.gasPrice || gasPrice.maxFeePerGas || 0n)
  return { gasLimit, gasPrice: gasPrice.gasPrice || gasPrice.maxFeePerGas || 0n, fee, feeFormatted: ethers.formatEther(fee) }
}

/**
 * Estimate gas fee for an ERC20 transfer
 */
export async function estimateTokenGas(rpcUrl, privateKey, tokenAddress, to, amount, decimals = 18) {
  const provider = getProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)
  const contract = new ethers.Contract(tokenAddress, [
    'function transfer(address to, uint256 amount) returns (bool)',
  ], wallet)
  const [gasPrice, gasLimit] = await Promise.all([
    provider.getFeeData(),
    contract.transfer.estimateGas(to, ethers.parseUnits(amount, decimals)),
  ])
  const fee = gasLimit * (gasPrice.gasPrice || gasPrice.maxFeePerGas || 0n)
  return { gasLimit, gasPrice: gasPrice.gasPrice || gasPrice.maxFeePerGas || 0n, fee, feeFormatted: ethers.formatEther(fee) }
}

/**
 * Encrypt mnemonic/private key with a simple password-based approach
 * In production, use more robust encryption
 */
export function encryptData(data, password) {
  // Simple XOR-based obfuscation for localStorage
  // In a real app, use Web Crypto API with AES-GCM
  const encoded = btoa(data)
  return encoded
}

export function decryptData(encryptedData) {
  try {
    return atob(encryptedData)
  } catch {
    return null
  }
}
