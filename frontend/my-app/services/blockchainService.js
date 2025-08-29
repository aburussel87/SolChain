/**
 * Blockchain Service
 *
 * Web3 integration for blockchain interactions
 *
 * @author Team GreyDevs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../assets/config';

class BlockchainService {
  constructor() {
    this.isInitialized = false;
    this.userAddress = null;
  }

  /**
   * Initialize Web3 connection
   */
  async initializeWeb3() {
    try {
      // In React Native, we'll use our backend API instead of direct Web3
      console.log('Initializing blockchain service via backend API');
      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Connect to Web3 wallet (via backend)
   */
  async connectWallet() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${config.API_BASE_URL}/wallet`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        this.userAddress = data.address;
        return { success: true, address: data.address };
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get SolarToken balance
   */
  async getBalance() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/wallet`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        return { 
          success: true, 
          balance: data.balance.solarToken,
          ethBalance: data.balance.eth 
        };
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send blockchain transaction
   */
  async sendTransaction(toAddress, amount) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/transactions/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toAddress,
          amount
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Call smart contract methods
   */
  async callSmartContract(contractAddress, method, params) {
    try {
      // This would be implemented based on specific contract calls needed
      console.log('Smart contract call:', { contractAddress, method, params });
      return { success: true, result: 'Method called successfully' };
    } catch (error) {
      console.error('Failed to call smart contract:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    try {
      // This would query the blockchain for transaction details
      console.log('Getting transaction receipt for:', txHash);
      return { 
        success: true, 
        receipt: { 
          blockNumber: '12345',
          gasUsed: '21000',
          status: 'success'
        } 
      };
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current energy price
   */
  async getCurrentEnergyPrice() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/energy`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success && data.data.blockchain) {
        return { 
          success: true, 
          price: data.data.blockchain.currentEnergyPrice 
        };
      } else {
        return { success: true, price: '0.25' }; // Fallback price
      }
    } catch (error) {
      console.error('Failed to get energy price:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create energy sell offer
   */
  async createSellOffer(energyAmount, pricePerKwh, duration = 24) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/energy/sell`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          energyAmount,
          pricePerKwh,
          duration
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to create sell offer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active energy offers
   */
  async getActiveOffers() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/buy`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get active offers:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;