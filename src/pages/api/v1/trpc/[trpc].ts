import { createContext } from '@/server/context';
import { appRouter } from '@/server/routers';
import * as trpcNext from '@trpc/server/adapters/next';

export const maxDuration = 300;

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
  batching: {
    enabled: true,
  },
  responseMeta: (opts) => {
    const { errors, type } = opts;
    const allOk = errors.length === 0;
    const isQuery = type === 'query';

    if (allOk && isQuery) {
      return {
        headers: {
          'cache-control': `s-maxage=1, stale-while-revalidate`,
        },
      };
    }
    return {};
  },
});
