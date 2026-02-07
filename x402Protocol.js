import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

export class X402Protocol {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.NETWORK_URL);
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.usdcAddress = process.env.USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
        
        // USDC ABI for Base
        this.usdcAbi = [
            "function balanceOf(address account) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function decimals() view returns (uint8)"
        ];
        
        this.usdcContract = new ethers.Contract(this.usdcAddress, this.usdcAbi, this.signer);
    }

    async createPaymentProof(expectedAmount, recipientAddress) {
        const paymentIntent = {
            amount: ethers.parseUnits(expectedAmount.toString(), 6), // USDC uses 6 decimals
            tokenAddress: this.usdcAddress,
            recipient: recipientAddress,
            timestamp: Date.now(),
            nonce: ethers.randomBytes(32)
        };

        const message = ethers.solidityPackedKeccak256(
            ["uint256", "address", "address", "uint256", "bytes32"],
            [
                paymentIntent.amount,
                paymentIntent.tokenAddress,
                paymentIntent.recipient,
                paymentIntent.timestamp,
                paymentIntent.nonce
            ]
        );

        const signature = await this.signer.signMessage(ethers.getBytes(message));
        
        return {
            paymentIntent,
            signature,
            proof: signature
        };
    }

    async verifyPayment(proof, expectedAmount, recipientAddress) {
        try {
            const { paymentIntent, signature } = proof;
            
            if (paymentIntent.recipient !== recipientAddress) {
                throw new Error('Invalid recipient');
            }
            
            if (paymentIntent.amount !== ethers.parseUnits(expectedAmount.toString(), 6)) {
                throw new Error('Invalid amount');
            }

            const message = ethers.solidityPackedKeccak256(
                ["uint256", "address", "address", "uint256", "bytes32"],
                [
                    paymentIntent.amount,
                    paymentIntent.tokenAddress,
                    paymentIntent.recipient,
                    paymentIntent.timestamp,
                    paymentIntent.nonce
                ]
            );

            const recoveredAddress = ethers.recoverAddress(message, signature);
            return recoveredAddress.toLowerCase() === this.signer.address.toLowerCase();
        } catch (error) {
            console.error('Payment verification failed:', error);
            return false;
        }
    }

    async create402Header(expectedAmount, description = "Service Access") {
        const proof = await this.createPaymentProof(expectedAmount, this.signer.address);
        
        return {
            'X-Payment-Version': '402-0.1',
            'X-Payment-Network': 'base-mainnet',
            'X-Payment-Tokens': this.usdcAddress,
            'X-Payment-Address': this.signer.address,
            'X-Payment-Amount': expectedAmount.toString(),
            'X-Payment-Proof': JSON.stringify(proof),
            'X-Payment-Description': description,
            'WWW-Authenticate': `X-Payment-Version="402-0.1" network="base-mainnet" tokens="${this.usdcAddress}" amount="${expectedAmount}" description="${description}"`
        };
    }

    async validatePayment(signature, expectedAmount) {
        try {
            // Decode the payment proof from the Authorization header
            const proof = JSON.parse(atob(signature));
            return await this.verifyPayment(proof, expectedAmount, this.signer.address);
        } catch (error) {
            console.error('Payment validation error:', error);
            return false;
        }
    }
}