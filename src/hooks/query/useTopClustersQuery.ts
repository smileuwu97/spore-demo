import { graphql } from '@/gql';
import request from 'graphql-request';
import { useQuery } from '@tanstack/react-query';
import { QueryCluster } from './type';

const topClustersQueryDocument = graphql(`
  query GetTopClustersQuery($first: Int) {
    topClusters(first: $first) {
      id
      name
      description
      spores {
        id
        contentType
        cell {
          cellOutput {
            capacity
          }
        }
      }
      cell {
        cellOutput {
          capacity
          lock {
            args
            codeHash
            hashType
          }
        }
      }
    }
  }
`);

export function useTopClustersQuery(limit = 4) {
  const { data, isLoading } = useQuery({
    queryKey: ['topClusters', limit],
    queryFn: async () =>
      request('/api/graphql', topClustersQueryDocument, { first: limit }),
  });
  const clusters = (data?.topClusters as QueryCluster[]) ?? [];
  return {
    data: clusters,
    isLoading,
  };
}
