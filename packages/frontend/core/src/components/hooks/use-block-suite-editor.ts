import type React from 'react';
import type { SetStateAction } from 'jotai';
import { atom, useAtom } from 'jotai';

import type { YunkeEditorContainer } from '../../blocksuite/block-suite-editor';

const activeEditorContainerAtom = atom<YunkeEditorContainer | null>(null);

export function useActiveBlocksuiteEditor(): [
  YunkeEditorContainer | null,
  React.Dispatch<SetStateAction<YunkeEditorContainer | null>>,
] {
  const [editorContainer, setEditorContainer] = useAtom(
    activeEditorContainerAtom
  );

  return [editorContainer, setEditorContainer];
}
