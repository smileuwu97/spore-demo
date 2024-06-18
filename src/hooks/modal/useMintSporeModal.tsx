import { SporeDataProps, bytifyRawString, createSpore } from '@spore-sdk/core';
import { useCallback, useEffect, useState } from 'react';
import { useDisclosure, useId, useMediaQuery } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { useConnect } from '../useConnect';
import MintSporeModal from '@/components/MintSporeModal';
import { sendTransaction } from '@/utils/transaction';
import { useMutation } from '@tanstack/react-query';
import { showSuccess } from '@/utils/notifications';
import { useRouter } from 'next/router';
import { useMantineTheme } from '@mantine/core';
import { getMIMETypeByName } from '@/utils/mime';
import { BI, Cell, commons, config } from '@ckb-lumos/lumos';
import { useSporesByAddressQuery } from '../query/useSporesByAddressQuery';
import { useClusterSporesQuery } from '../query/useClusterSporesQuery';
import { useMintableClustersQuery } from '../query/useMintableClusters';
import { useClustersByAddressQuery } from '../query/useClustersByAddress';
import { sporeConfig } from '@/config';
import { RPC, Transaction } from '@ckb-lumos/lumos';
import { common } from '@ckb-lumos/common-scripts';
import { constructCreateSporeTx } from '../../spore';

export default function useMintSporeModal(id?: string) {
  const theme = useMantineTheme();
  const router = useRouter();
  const modalId = useId();
  const [opened, { open, close }] = useDisclosure(false);
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const { address, lock, signTransaction } = useConnect();
  const clusterId = router.pathname.startsWith('/cluster/')
    ? (router.query.id as string)
    : undefined;
  const { refresh: refreshClusterSpores } = useClusterSporesQuery(clusterId, false);
  const { refresh: refreshSporesByAddress } = useSporesByAddressQuery(address, false);
  const { refresh: refreshClustersByAddress } = useClustersByAddressQuery(address, false);
  const { data: mintableClusters = [] } = useMintableClustersQuery(address, opened);

  const addSpore = useCallback(
    async (...args: Parameters<typeof createSpore>) => {
      let { txSkeleton, outputIndex } = await createSpore(...args);
      const signedTx = await signTransaction(txSkeleton);
      await sendTransaction(signedTx);
      const outputs = txSkeleton.get('outputs');
      const spore = outputs.get(outputIndex);
      return spore;
    },
    [signTransaction],
  );

  const addSporeMutation = useMutation({
    mutationFn: addSpore,
    onSuccess: async (_: Cell | undefined) => {
      await Promise.all([
        refreshClusterSpores(),
        refreshSporesByAddress(),
        refreshClustersByAddress(),
      ]);
    },
  });

  const handleSubmit = useCallback(
    async (content: Blob | null, clusterId: string | undefined, useCapacityMargin?: boolean) => {
      if (!content || !address || !lock) {
        return;
      }
      // config.initializeConfig(sporeConfig.lumos);
      const contentBuffer = await content.arrayBuffer();
      const contentType = content.type || getMIMETypeByName(content.name);
      const sporeCell = await addSporeMutation.mutateAsync({
        data: {
          contentType,
          content: new Uint8Array(contentBuffer),
          clusterId,
        },
        fromInfos: [address],
        toLock: lock,
        config: sporeConfig,
        // @ts-ignore
        capacityMargin: useCapacityMargin ? BI.from(100_000_000) : BI.from(0),
      });
    
      showSuccess('Spore minted!', () => {
        router.push(`/spore/${sporeCell?.cellOutput.type?.args}`);
      });
      close();
    },
    [address, lock, addSporeMutation, close, router],
  );

  const handleTestMint = useCallback(
    async () => {
      console.log('handleTestMint');
      const feeRecipient = 'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqt7flvttxlkc6demckpu7waxp7ped6ekaga6suuq';

      let txSkeleton = await constructCreateSporeTx(
        address,
        {
          contentType: 'text/plain',
          content: bytifyRawString('Hello, Spore!'),
          clusterId:
            '0x263c43cc9f3969564a5e6f381665c9f38210820af3b03b861dfdcdf464559900',
        },
        {
          feePayment: {
            amount: '10000000000',
            recipient: feeRecipient,
          },
          sporeConfig,
        },
      );

      const res = await signTransaction(txSkeleton)
      console.log(JSON.stringify(res, null, 2))
    },
    [address, signTransaction]
  )

  useEffect(() => {
    if (opened) {
      modals.open({
        modalId,
        title: 'Add New Spore',
        onClose: close,
        styles: {
          content: {
            minWidth: isMobile ? 'auto' : '680px',
            minHeight: isMobile ? 'auto' : '525px',
          },
        },
        closeOnEscape: !addSporeMutation.isPending,
        withCloseButton: !addSporeMutation.isPending,
        closeOnClickOutside: !addSporeMutation.isPending,
        children: (
          <MintSporeModal
            defaultClusterId={id!}
            clusters={mintableClusters}
            onSubmit={handleSubmit}
            onTestMint={handleTestMint}
          />
        ),
      });
    } else {
      modals.close(modalId);
    }
  }, [
    isMobile,
    modalId,
    addSporeMutation.isPending,
    mintableClusters,
    handleSubmit,
    opened,
    close,
    id,
  ]);

  return {
    open,
    close,
  };
}
