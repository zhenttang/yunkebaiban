import { atom } from 'jotai';

// 通过atom控制页面历史记录，以便在CMDK中更容易使用
export const pageHistoryModalAtom = atom({
  open: false,
  pageId: '',
});
