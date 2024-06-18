import { common } from '@ckb-lumos/common-scripts';
import {
  TransactionSkeletonType,
  parseAddress,
} from '@ckb-lumos/lumos/helpers';
import { SporeDataProps, SporeConfig, createSpore } from '@spore-sdk/core';

export async function constructCreateSporeTx(
  minterAddress: string,
  sporeDataProps: SporeDataProps,
  options: {
    sporeConfig: SporeConfig;
    feePayment?: {
      amount: string;
      recipient: string;
    };
  },
): Promise<TransactionSkeletonType> {
  const minterLock = parseAddress(minterAddress, {
    config: options.sporeConfig.lumos,
  });

  let { txSkeleton } = await createSpore({
    data: sporeDataProps,
    fromInfos: [minterAddress],
    toLock: minterLock,
    config: options.sporeConfig,
  });

  if (options.feePayment) {
    txSkeleton = await common.transfer(
      txSkeleton,
      [minterAddress],
      options.feePayment.recipient,
      options.feePayment.amount,
      undefined,
      undefined,
      {
        config: options.sporeConfig.lumos,
      },
    );
    txSkeleton = await common.payFeeByFeeRate(
      txSkeleton,
      [minterAddress],
      1000,
      undefined,
      { config: options.sporeConfig.lumos },
    );
  }

  return txSkeleton;
}
