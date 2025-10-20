import { SurfaceBlockSchema } from '@blocksuite/yunke/blocks/surface';
import { ConnectorElementRendererExtension } from '@blocksuite/yunke/gfx/connector';
import {
  MindmapElementRendererExtension,
  MindMapView,
} from '@blocksuite/yunke/gfx/mindmap';
import { ShapeElementRendererExtension } from '@blocksuite/yunke/gfx/shape';
import { TextElementRendererExtension } from '@blocksuite/yunke/gfx/text';
import { RootBlockSchema } from '@blocksuite/yunke/model';
import {
  DocModeService,
  ThemeService,
} from '@blocksuite/yunke/shared/services';
import { BlockViewExtension, FlavourExtension } from '@blocksuite/yunke/std';
import type { BlockSchema, ExtensionType } from '@blocksuite/yunke/store';
import { literal } from 'lit/static-html.js';
import type { z } from 'zod';

import { MindmapService } from './mindmap-service.js';
import { MindmapSurfaceBlockService } from './surface-service.js';

export const MiniMindmapSpecs: ExtensionType[] = [
  DocModeService,
  ThemeService,
  FlavourExtension('yunke:page'),
  MindmapService,
  BlockViewExtension('yunke:page', literal`mini-mindmap-root-block`),
  FlavourExtension('yunke:surface'),
  MindMapView,
  MindmapSurfaceBlockService,
  BlockViewExtension('yunke:surface', literal`mini-mindmap-surface-block`),
  TextElementRendererExtension,
  MindmapElementRendererExtension,
  ShapeElementRendererExtension,
  ConnectorElementRendererExtension,
];

export const MiniMindmapSchema: z.infer<typeof BlockSchema>[] = [
  RootBlockSchema,
  SurfaceBlockSchema,
];
