import {
  useMutateQueryResource,
  useMutation,
} from '@yunke/admin/use-mutation';
import { useQuery } from '@yunke/admin/use-query';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
// import { getPromptsQuery, updatePromptMutation } from '@yunke/graphql';

// Temporary placeholders to replace @yunke/graphql imports
const getPromptsQuery = {
  id: 'getPrompts',
  query: 'query GetPrompts { listCopilotPrompts { name messages } }',
};

const updatePromptMutation = {
  id: 'updatePrompt',
  query: 'mutation UpdatePrompt($name: String!, $messages: [MessageInput!]!) { updatePrompt(name: $name, messages: $messages) { success } }',
};

import { toast } from 'sonner';

import type { Prompt } from './prompts';

export const usePrompt = () => {
  const { data } = useQuery({
    query: getPromptsQuery,
  });

  const { trigger } = useMutation({
    mutation: updatePromptMutation,
  });

  const revalidate = useMutateQueryResource();

  const updatePrompt = useAsyncCallback(
    async ({
      name,
      messages,
    }: {
      name: string;
      messages: Prompt['messages'];
    }) => {
      await trigger({
        name,
        messages,
      })
        .then(async () => {
          await revalidate(getPromptsQuery);
          toast.success('提示更新成功');
        })
        .catch(e => {
          toast(e.message);
          console.error(e);
        });
    },
    [revalidate, trigger]
  );

  return {
    prompts: data.listCopilotPrompts,
    updatePrompt,
  };
};
