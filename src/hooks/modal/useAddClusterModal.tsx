import { createCluster, predefinedSporeConfigs } from '@spore-sdk/core';
import { Script } from '@ckb-lumos/lumos';
import { useCallback, useEffect } from 'react';
import { useMutation } from 'wagmi';
import { useQueryClient } from 'react-query';
import { useDisclosure, useId } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { isNotEmpty, useForm } from '@mantine/form';
import { Button, Checkbox, Group, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import useWalletConnect from '../useWalletConnect';
import { sendTransaction } from '@/utils/transaction';
import { getScript } from '@/utils/script';

export default function useAddClusterModal() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const { address, lock, signTransaction } = useWalletConnect();
  const modalId = useId();

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      public: false,
    },

    validate: {
      name: isNotEmpty('Name cannot be empty'),
      description: isNotEmpty('description cannot be empty'),
    },
  });

  const addCluster = useCallback(
    async (...args: Parameters<typeof createCluster>) => {
      const { txSkeleton } = await createCluster(...args);
      const signedTx = await signTransaction(txSkeleton);
      const hash = sendTransaction(signedTx);
      return hash;
    },
    [signTransaction],
  );

  const addClusterMutation = useMutation(addCluster, {
    onSuccess: () => {
      queryClient.invalidateQueries('clusters');
    },
  });
  const loading = addClusterMutation.isLoading;

  const handleSubmit = useCallback(
    async (values: { name: string; description: string; public: boolean }) => {
      if (!address || !lock) {
        return;
      }
      try {
        let toLock = lock;
        if (values.public) {
          const anyoneCanPayScript = getScript('ANYONE_CAN_PAY');
          toLock = {
            codeHash: anyoneCanPayScript.CODE_HASH,
            hashType: anyoneCanPayScript.HASH_TYPE,
            args: '0x' + lock.args.slice(4, -2),
          } as Script;
        }

        await addClusterMutation.mutateAsync({
          data: {
            name: values.name,
            description: values.description,
          },
          fromInfos: [address],
          toLock,
          config: predefinedSporeConfigs.Aggron4,
        });

        notifications.show({
          color: 'green',
          title: 'Congratulations!',
          message: 'Your cluster has been created.',
        });
        close();
      } catch (e) {
        notifications.show({
          color: 'red',
          title: 'Error!',
          message: (e as Error).message,
        });
      }
    },
    [address, lock, addClusterMutation, close],
  );

  useEffect(() => {
    if (opened) {
      modals.open({
        modalId,
        title: 'Add New Cluster',
        onClose: close,
        closeOnEscape: !addClusterMutation.isLoading,
        closeOnClickOutside: !addClusterMutation.isLoading,
        withCloseButton: !addClusterMutation.isLoading,
        children: (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              withAsterisk
              label="Name"
              {...form.getInputProps('name')}
            />

            <TextInput
              withAsterisk
              label="Description"
              {...form.getInputProps('description')}
            />

            <Checkbox
              mt="md"
              label="Make the cluster public so that others can create it."
              {...form.getInputProps('public', { type: 'checkbox' })}
            />

            <Group position="right" mt="md">
              <Button type="submit" loading={addClusterMutation.isLoading}>
                Submit
              </Button>
            </Group>
          </form>
        ),
      });
    } else {
      modals.close(modalId);
    }
  }, [
    modalId,
    addClusterMutation.isLoading,
    form,
    handleSubmit,
    opened,
    close,
  ]);

  return {
    open,
    close,
    loading,
  };
}