import { ScrollArea } from '@yunke/admin/components/ui/scroll-area';
import { Separator } from '@yunke/admin/components/ui/separator';
import { Textarea } from '@yunke/admin/components/ui/textarea';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { RightPanelHeader } from '../header';
import { useRightPanel } from '../panel/context';
import type { Prompt } from './prompts';
import { usePrompt } from './use-prompt';

export function EditPrompt({
  item,
  setCanSave,
}: {
  item: Prompt;
  setCanSave: (changed: boolean) => void;
}) {
  const { closePanel } = useRightPanel();

  const [messages, setMessages] = useState(item.messages);
  const { updatePrompt } = usePrompt();

  const disableSave = useMemo(
    () => JSON.stringify(messages) === JSON.stringify(item.messages),
    [item.messages, messages]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
      const newMessages = [...messages];
      newMessages[index] = {
        ...newMessages[index],
        content: e.target.value,
      };
      setMessages(newMessages);
      setCanSave(!disableSave);
    },
    [disableSave, messages, setCanSave]
  );
  const handleClose = useCallback(() => {
    setMessages(item.messages);
    closePanel();
  }, [closePanel, item.messages]);

  const onConfirm = useCallback(() => {
    if (!disableSave) {
      updatePrompt({ name: item.name, messages });
    }
    handleClose();
  }, [disableSave, handleClose, item.name, messages, updatePrompt]);

  useEffect(() => {
    setMessages(item.messages);
  }, [item.messages]);

  return (
    <div className="flex flex-col h-full gap-1">
      <RightPanelHeader
        title="编辑提示"
        handleClose={handleClose}
        handleConfirm={onConfirm}
        canSave={!disableSave}
      />
      <ScrollArea>
        <div className="grid">
          <div className="px-5 py-4 overflow-y-auto space-y-[10px] flex flex-col gap-5">
            <div className="flex flex-col">
              <div className="text-sm font-medium">名称</div>
              <div className="text-sm font-normal text-zinc-500">
                {item.name}
              </div>
            </div>
            {item.action ? (
              <div className="flex flex-col">
                <div className="text-sm font-medium">操作</div>
                <div className="text-sm font-normal text-zinc-500">
                  {item.action}
                </div>
              </div>
            ) : null}
            <div className="flex flex-col">
              <div className="text-sm font-medium">模型</div>
              <div className="text-sm font-normal text-zinc-500">
                {item.model}
              </div>
            </div>
            {item.config ? (
              <div className="flex flex-col border rounded p-3">
                <div className="text-sm font-medium">配置</div>
                {Object.entries(item.config).map(([key, value], index) => (
                  <div key={key} className="flex flex-col">
                    {index !== 0 && <Separator />}
                    <span className="text-sm font-normal">{key}</span>
                    <span className="text-sm font-normal text-zinc-500">
                      {value?.toString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="px-5 py-4 overflow-y-auto space-y-[10px] flex flex-col">
            <div className="text-sm font-medium">消息</div>
            {messages.map((message, index) => (
              <div key={message.content} className="flex flex-col gap-3">
                {index !== 0 && <Separator />}
                <div>
                  <div className="text-sm font-normal">角色</div>
                  <div className="text-sm font-normal text-zinc-500">
                    {message.role}
                  </div>
                </div>

                {message.params ? (
                  <div>
                    <div className="text-sm font-medium">参数</div>
                    {Object.entries(message.params).map(
                      ([key, value], index) => (
                        <div key={key} className="flex flex-col">
                          {index !== 0 && <Separator />}
                          <span className="text-sm font-normal">{key}</span>
                          <span
                            className="text-sm font-normal text-zinc-500"
                            style={{ overflowWrap: 'break-word' }}
                          >
                            {value.toString()}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : null}
                <div className="text-sm font-normal">内容</div>
                <Textarea
                  className=" min-h-48"
                  value={message.content}
                  onChange={e => handleChange(e, index)}
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
