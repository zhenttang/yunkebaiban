import type React from 'react';

export type NodeOperation = {
  index: number;
  view: React.ReactNode;
  inline?: boolean;
};
