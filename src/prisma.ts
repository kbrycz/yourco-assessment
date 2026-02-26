import { PrismaClient, Prisma } from "@prisma/client";

export type TransactionClient = Prisma.TransactionClient;

const prisma = new PrismaClient();

export default prisma;

export async function getBalance(
  client: PrismaClient | TransactionClient,
  userId: string
): Promise<number> {
  const result = await client.ledgerEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}
