import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

export const markerRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.marker.findMany({
      orderBy: {
        distanceKm: 'asc'
      }
    })
  }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.marker.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })
  }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      latitude: z.number(),
      longitude: z.number(),
      distanceKm: z.number().min(0),
      raceTime: z.string().optional(),
      note: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.marker.create({
        data: input
      })
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.marker.delete({
        where: { id: input.id }
      })
    })
})