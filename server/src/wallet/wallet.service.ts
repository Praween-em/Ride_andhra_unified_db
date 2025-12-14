import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  /**
   * Get or create wallet for a user
   */
  async getOrCreateWallet(userId: string): Promise<Wallet> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let wallet = await this.walletRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!wallet) {
      // Create new wallet for user
      wallet = this.walletRepository.create({
        user,
        balance: 0,
      });
      await this.walletRepository.save(wallet);
    }

    return wallet;
  }

  /**
   * Get wallet balance and recent transactions
   */
  async getWalletBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    // Get recent transactions (last 20)
    const transactions = await this.transactionRepository.find({
      where: { wallet: { id: wallet.id } },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      balance: parseFloat(wallet.balance.toString()),
      referralBalance: 0, // TODO: Implement referral balance logic
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type === TransactionType.CREDIT ? 'credit' : 'debit',
        amount: parseFloat(t.amount.toString()),
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * Add funds to wallet (credit transaction)
   */
  async addFunds(userId: string, amount: number, description: string = 'Funds added') {
    const wallet = await this.getOrCreateWallet(userId);

    // Create credit transaction
    const transaction = this.transactionRepository.create({
      wallet,
      amount,
      type: TransactionType.CREDIT,
    });
    await this.transactionRepository.save(transaction);

    // Update wallet balance
    wallet.balance = parseFloat(wallet.balance.toString()) + amount;
    await this.walletRepository.save(wallet);

    return {
      message: `₹${amount} added to wallet successfully`,
      newBalance: parseFloat(wallet.balance.toString()),
    };
  }

  /**
   * Deduct funds from wallet (debit transaction)
   */
  async deductFunds(userId: string, amount: number, description: string = 'Funds deducted') {
    const wallet = await this.getOrCreateWallet(userId);

    if (parseFloat(wallet.balance.toString()) < amount) {
      throw new Error('Insufficient balance');
    }

    // Create debit transaction
    const transaction = this.transactionRepository.create({
      wallet,
      amount,
      type: TransactionType.DEBIT,
    });
    await this.transactionRepository.save(transaction);

    // Update wallet balance
    wallet.balance = parseFloat(wallet.balance.toString()) - amount;
    await this.walletRepository.save(wallet);

    return {
      message: `₹${amount} deducted from wallet successfully`,
      newBalance: parseFloat(wallet.balance.toString()),
    };
  }
}
