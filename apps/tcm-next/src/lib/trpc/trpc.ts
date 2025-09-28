import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { prisma } from '../prisma'

export const createTRPCContext = async () => {
  return {
    prisma,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure