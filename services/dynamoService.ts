import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';

const region =
  process.env.VITE_AWS_REGION ||
  process.env.AWS_REGION ||
  'eu-north-1';

const accessKeyId =
  process.env.VITE_AWS_ACCESS_KEY_ID ||
  process.env.AWS_ACCESS_KEY_ID;

const secretAccessKey =
  process.env.VITE_AWS_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET_ACCESS_KEY;

const USERS_TABLE =
  process.env.VITE_DYNAMODB_USERS_TABLE ||
  process.env.DYNAMODB_USERS_TABLE ||
  'users';

const TRANSACTIONS_TABLE =
  process.env.VITE_DYNAMODB_TRANSACTIONS_TABLE ||
  process.env.DYNAMODB_TRANSACTIONS_TABLE ||
  'transactions';

let docClient: DynamoDBDocumentClient | null = null;

function getDocClient(): DynamoDBDocumentClient | null {
  if (docClient) return docClient;

  try {
    const clientConfig: any = { region };

    if (
      accessKeyId &&
      secretAccessKey &&
      !accessKeyId.includes('your_aws') &&
      !secretAccessKey.includes('your_aws')
    ) {
      clientConfig.credentials = {
        accessKeyId,
        secretAccessKey
      };
    }

    const client = new DynamoDBClient(clientConfig);
    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true }
    });
    return docClient;
  } catch (err) {
    console.warn('[DynamoDB Init Warning]:', err);
    return null;
  }
}

export interface DynamoUserItem {
  userId: string;
  name: string;
  email: string;
  password?: string;
  createdAt: string;
  [key: string]: any;
}

export interface DynamoTransactionItem {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  status: string;
  createdAt: string;
  [key: string]: any;
}

export class DynamoService {
  /**
   * Insert or update a user in the `users` table matching schema:
   * { userId, name, email, password, createdAt }
   */
  static async createUser(user: {
    userId: string;
    name: string;
    email: string;
    password?: string;
    createdAt?: string;
    [key: string]: any;
  }): Promise<DynamoUserItem | null> {
    const db = getDocClient();
    if (!db) return null;

    try {
      const item: DynamoUserItem = {
        ...user,
        userId: user.userId,
        name: user.name,
        email: user.email.toLowerCase().trim(),
        password: user.password || '',
        isEmailVerified: Boolean(user.isEmailVerified),
        verificationOtp: user.verificationOtp || '',
        otpExpiresAt: Number(user.otpExpiresAt) || 0,
        createdAt: user.createdAt || new Date().toISOString(),
        role: user.role || 'candidate',
        rankTitle: user.rankTitle || '🌱 Associate Engineer',
        unlockedTemplates: user.unlockedTemplates || [
          'corporate-clean',
          'modern-tech-pro'
        ],
        hasTestPass: Boolean(user.hasTestPass)
      };

      await db.send(
        new PutCommand({
          TableName: USERS_TABLE,
          Item: item
        })
      );
      return item;
    } catch (err: any) {
      console.warn('[DynamoDB createUser Error]:', err.message || err);
      return null;
    }
  }

  /**
   * Retrieve user by userId from `users` table
   */
  static async getUserById(userId: string): Promise<DynamoUserItem | null> {
    const db = getDocClient();
    if (!db) return null;

    try {
      const result = await db.send(
        new GetCommand({
          TableName: USERS_TABLE,
          Key: { userId }
        })
      );
      return (result.Item as DynamoUserItem) || null;
    } catch (err: any) {
      console.warn('[DynamoDB getUserById Error]:', err.message || err);
      return null;
    }
  }

  /**
   * Search user by email from `users` table
   */
  /**
   * Search user by email from `users` table
   */
  static async getUserByEmail(email: string): Promise<DynamoUserItem | null> {
    const db = getDocClient();
    if (!db) return null;

    try {
      const cleanEmail = email.toLowerCase().trim();
      let lastEvaluatedKey: any = undefined;

      do {
        const result = await db.send(
          new ScanCommand({
            TableName: USERS_TABLE,
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: {
              ':email': cleanEmail
            },
            ExclusiveStartKey: lastEvaluatedKey
          })
        );

        if (result.Items && result.Items.length > 0) {
          return result.Items[0] as DynamoUserItem;
        }

        lastEvaluatedKey = result.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      return null;
    } catch (err: any) {
      console.warn('[DynamoDB getUserByEmail Error]:', err.message || err);
      return null;
    }
  }

  /**
   * Update user details in `users` table
   */
  static async updateUser(userId: string, updates: Partial<DynamoUserItem>): Promise<boolean> {
    const db = getDocClient();
    if (!db) return false;

    try {
      const existing = await this.getUserById(userId);
      if (!existing) return false;

      const merged = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await db.send(
        new PutCommand({
          TableName: USERS_TABLE,
          Item: merged
        })
      );
      return true;
    } catch (err: any) {
      console.warn('[DynamoDB updateUser Error]:', err.message || err);
      return false;
    }
  }

  /**
   * Insert transaction into `transactions` table matching schema:
   * { transactionId, userId, amount, currency, paymentMethod, status, createdAt }
   */
  static async createTransaction(tx: {
    transactionId: string;
    userId: string;
    amount: number | string;
    currency?: string;
    paymentMethod?: string;
    status?: string;
    createdAt?: string;
    [key: string]: any;
  }): Promise<DynamoTransactionItem | null> {
    const db = getDocClient();
    if (!db) return null;

    try {
      const item: DynamoTransactionItem = {
        transactionId: tx.transactionId,
        userId: tx.userId,
        amount: Number(tx.amount) || 50,
        currency: tx.currency || 'INR',
        paymentMethod: tx.paymentMethod || 'UPI',
        status: tx.status || 'SUCCESS',
        createdAt: tx.createdAt || new Date().toISOString()
      };

      if (tx.itemId) item.itemId = tx.itemId;
      if (tx.type) item.type = tx.type;
      if (tx.orderId) item.orderId = tx.orderId;

      await db.send(
        new PutCommand({
          TableName: TRANSACTIONS_TABLE,
          Item: item
        })
      );
      return item;
    } catch (err: any) {
      console.warn('[DynamoDB createTransaction Error]:', err.message || err);
      return null;
    }
  }
}
