import { router } from './trpc'
import { markerRouter } from './routers/marker'

export const appRouter = router({
  marker: markerRouter,
})

export type AppRouter = typeof appRouter