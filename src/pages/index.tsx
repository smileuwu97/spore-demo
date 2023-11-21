import ClusterGrid from '@/components/ClusterGrid';
import Layout from '@/components/Layout';
import SporeGrid from '@/components/SporeGrid';
import { useInfiniteSporesQuery } from '@/hooks/query/useInfiniteSporesQuery';
import { useTopClustersQuery } from '@/hooks/query/useTopClustersQuery';
import { isImageMIMEType, isTextMIMEType } from '@/utils/mime';
import {
  Box,
  Button,
  Container,
  Flex,
  Group,
  Image,
  Loader,
  MediaQuery,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Cluster, Spore } from 'spore-graphql';
import { useStyles } from './index.style';

enum SporeContentType {
  All = 'All',
  Image = 'Image',
  Text = 'Text',
}

export default function HomePage() {
  const { classes, cx } = useStyles();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const [contentType, setContentType] = useState(SporeContentType.All);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);

  const { data: topClustersData, isLoading: isTopClustersLoading } =
    useTopClustersQuery();
  const {
    data: sporesData,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
  } = useInfiniteSporesQuery();

  useEffect(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchNextPage();
      }
    });
    if (loadMoreButtonRef.current) {
      observer.observe(loadMoreButtonRef.current);
    }
    return () => observer.disconnect();
  }, [fetchNextPage, isFetchingNextPage, hasNextPage]);

  const topClusters = useMemo(() => {
    if (!topClustersData) {
      return [] as Cluster[];
    }
    const { topClusters } = topClustersData;
    return (topClusters?.filter((c) => !!c) ?? []) as Cluster[];
  }, [topClustersData]);

  const spores = useMemo(() => {
    if (!sporesData) {
      return [] as Spore[];
    }
    const { pages } = sporesData;
    const spores = pages?.flatMap(
      (page) => page?.spores?.filter((s) => s !== null) ?? [],
    );
    return (spores ?? []) as Spore[];
  }, [sporesData]);

  const filteredSpores = useMemo(() => {
    if (contentType === SporeContentType.All) {
      return spores;
    }
    if (contentType === SporeContentType.Image) {
      return spores.filter((spore) =>
        isImageMIMEType(spore.contentType as any),
      );
    }
    if (contentType === SporeContentType.Text) {
      return spores.filter((spore) => isTextMIMEType(spore.contentType as any));
    }
    return spores;
  }, [spores, contentType]);

  const header = (
    <Flex align="center" className={classes.banner}>
      <Container size="xl" className={classes.container}>
        <MediaQuery
          query={`(max-width: ${theme.breakpoints.lg})`}
          styles={{ display: 'none' }}
        >
          <Image
            className={classes.illus}
            src="/svg/spore-demo-illus.svg"
            width="339"
            height="315"
            alt="Spore Demo Illus"
          />
        </MediaQuery>
        <Flex direction="column" justify="center" align="center" gap="32px">
          <Box>
            <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
              <Image
                src={'/images/demo-title.png'}
                width="630"
                height="60"
                alt="Spore Demo"
              />
            </MediaQuery>
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Image
                src={'/images/demo-title.mobile.png'}
                width={isMobile ? '213' : '331'}
                height={isMobile ? '96' : '136'}
                alt="Spore Demo"
              />
            </MediaQuery>
          </Box>

          <Text size="xl" align="center">
            Connect your wallet, mint a spore, start your cluster – all
            on-chain!
          </Text>
        </Flex>
      </Container>
    </Flex>
  );

  return (
    <Layout header={header}>
      <Box bg="background.0">
        <Container py="48px" size="xl">
          <ClusterGrid
            title={
              <Flex justify="space-between">
                <Title order={3}>Discover Clusters</Title>
                <Link href="/cluster" style={{ textDecoration: 'none' }}>
                  <Text color="brand.1" weight="600">
                    See all
                  </Text>
                </Link>
              </Flex>
            }
            clusters={topClusters}
            isLoading={isTopClustersLoading}
            disablePlaceholder
          />
        </Container>
      </Box>
      <Container py="48px" size="xl">
        <SporeGrid
          title="Explore All Spores"
          spores={filteredSpores}
          filter={
            <Group mt="16px">
              {[
                SporeContentType.All,
                SporeContentType.Image,
                SporeContentType.Text,
              ].map((type) => {
                return (
                  <Flex
                    key={type}
                    align="center"
                    className={cx(classes.type, {
                      [classes.active]: type === contentType,
                    })}
                    onClick={() => setContentType(type)}
                  >
                    <Text>{type}</Text>
                  </Flex>
                );
              })}
            </Group>
          }
          isLoading={isFetching}
          disablePlaceholder
        />
        <Group position="center" mt="48px">
          {hasNextPage &&
            (isFetchingNextPage ? (
              <Loader color="brand.1" />
            ) : (
              <Button
                ref={loadMoreButtonRef}
                className={classes.more}
                onClick={() => fetchNextPage()}
              >
                Load More
              </Button>
            ))}
        </Group>
      </Container>
    </Layout>
  );
}
