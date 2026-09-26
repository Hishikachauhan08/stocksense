import { PrismaClient } from '@prisma/client'
import { seedInventory, seedUsers } from '../src/lib/demo-data'

const prisma = new PrismaClient()

async function main() {
  await seedInventory(prisma)
  await seedUsers(prisma)
  console.log('StockSense demo data loaded.')
  console.log('  Inventory Manager: m.vance@stocksense.io / manager123')
  console.log('  Warehouse Staff:   elena.r@stocksense.io / warehouse123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
