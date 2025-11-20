/**
 * 主题变量说明映射
 * 用于在主题编辑器中显示每个变量的用途说明
 */

export interface ThemeVariableMetadata {
  description: string;
  preview?: string; // 预览图片的 URL (相对于 public 目录)
  context?: string; // 使用上下文的文字描述
}

export const variableMetadata: Record<string, ThemeVariableMetadata> = {
  // AI功能相关
  'aI': { description: 'AI功能相关 - 控制AI功能相关的UI样式，包括AI应用操作、文本高亮、错误提示等' },
  'aI/applyBackground': { description: 'AI应用操作的背景色' },
  'aI/applyDeleteHighlight': { description: '删除高亮背景色' },
  'aI/applyTextHighlight': { description: '文本高亮颜色' },
  'aI/applyTextHighlightBackground': { description: '文本高亮背景色' },
  'aI/errorBackground': { description: '错误背景色' },
  'aI/errorDetailBackground': { description: '错误详情背景色' },
  'aI/errorText': { description: '错误文本颜色' },
  'aI/thinkingOutputBackground': { description: 'AI思考输出背景色' },
  'aI/thinkingOutputText': { description: 'AI思考输出文本颜色' },
  'aI/userTextBackground': { description: '用户文本背景色' },

  // 文档块相关
  'block': { description: '文档块相关 - 控制文档中各种块元素的样式，包括代码块、标注块、列表等' },
  'block/callout': {
    description: '标注块 - 支持多种颜色的标注块背景和图标',
    context: '用于文档中的强调说明区域，通常包含一个图标和背景色。',
    preview: '/theme-previews/block-callout.svg'
  },
  'block/callout/background': { description: '标注块背景色（支持多种颜色：blue/green/grey/magenta/orange/purple/red/teal/yellow）' },
  'block/callout/icon': { description: '标注块图标颜色（支持多种颜色）' },
  'block/code': { description: '代码块 - 控制代码块的样式' },
  'block/code/lineNum': { description: '代码块行号颜色' },
  'block/comment': { description: '评论相关 - 控制评论功能的高亮和激活状态' },
  'block/comment/hanelActive': { description: '激活状态背景' },
  'block/comment/highlightActive': { description: '激活高亮' },
  'block/comment/highlightDefault': { description: '默认高亮' },
  'block/comment/highlightUnderline': { description: '下划线高亮' },
  'block/divider': { description: '分割线 - 控制分割线的颜色' },
  'block/divider/divider': { description: '分割线颜色' },
  'block/footnote': { description: '脚注 - 控制脚注的样式' },
  'block/footnote/numberBg': { description: '脚注数字背景色' },
  'block/footnote/numberBgHover': { description: '悬停时脚注数字背景色' },
  'block/list': { description: '列表 - 控制列表的样式' },
  'block/list/header': { description: '列表头颜色' },
  'block/notSupportedBlock': { description: '不支持的块 - 控制不支持块的显示样式' },
  'button/grabber': { description: '抓取器 - 控制拖拽抓取器的样式' },

  // 标签/芯片组件
  'chip': { description: '标签/芯片组件 - 控制标签和芯片组件的样式' },
  'chip/label': { description: '标签背景色 - 用于标签组件的背景（支持多种颜色：blue/green/grey/magenta/orange/purple/red/teal/yellow/white）' },
  'chip/tag': { description: '标签背景色 - 用于标签组件的背景（支持多种颜色：blue/green/grey/orange/purple/red/teal/yellow）' },

  // 无边界画布
  'edgeless': { description: '无边界画布 - 控制无边界画布模式下的所有元素样式' },
  'edgeless/alignment': { description: '对齐辅助线 - 控制对齐时的引导线颜色' },
  'edgeless/frame': { description: '框架/容器 - 控制画布中框架的背景、边框和字体颜色' },
  'edgeless/frame/background': { description: '框架背景色（支持多种颜色：black/blue/green/grey/magenta/orange/purple/red/teal/white/yellow）' },
  'edgeless/frame/border': { description: '框架边框（active激活状态，default默认状态）' },
  'edgeless/frame/fontColor': { description: '框架字体颜色' },
  'edgeless/group': { description: '组合/分组 - 控制组合元素的背景、边框和字体颜色' },
  'edgeless/group/background': { description: '组合背景色' },
  'edgeless/group/border': { description: '组合边框（active激活状态，hover悬停状态，borderHint边框提示）' },
  'edgeless/group/fontColor': { description: '组合字体颜色（active激活状态，default默认状态，hover悬停状态，rename重命名状态）' },
  'edgeless/line': { description: '线条 - 控制画布中线条的颜色（支持多种颜色）' },
  'edgeless/lock': { description: '锁定状态 - 控制锁定元素的颜色' },
  'edgeless/mindMap': { description: '思维导图 - 控制思维导图的线条颜色' },
  'edgeless/note': { description: '便签 - 控制便签的背景色（支持多种颜色）' },
  'edgeless/palette': { description: '调色板 - 控制画布中使用的颜色调色板（heavy深色系，light浅色系，medium中等色系）' },
  'edgeless/selection': { description: '选择框 - 控制选择框的背景和边框颜色' },
  'edgeless/shape': { description: '形状 - 控制形状的颜色（支持多种颜色）' },
  'edgelessToolbar': { description: '工具栏 - 控制无边界画布工具栏的各种工具样式' },

  // 图标相关
  'icon': { description: '图标相关 - 控制图标的各种状态和颜色' },
  'icon/activated': { description: '图标激活状态的颜色' },
  'icon/disable': { description: '图标禁用状态的颜色' },
  'icon/primary': { description: '主要图标颜色 - 用于重要的图标' },
  'icon/secondary': { description: '次要图标颜色 - 用于次要的图标' },
  'icon/tertiary': { description: '第三级图标颜色 - 用于不重要的图标' },
  'icon/fileIconColors': { description: '文件图标颜色 - 根据文件类型显示不同颜色（支持多种颜色：blue/green/grey/magenta/purple/red/yellow）' },

  // 输入框相关
  'input': { description: '输入框相关 - 控制输入框的背景、边框和滚动条样式' },
  'input/background': { description: '输入框背景色' },
  'input/border': { description: '输入框边框（active激活状态，default默认状态，error错误状态）' },
  'input/scrollBar': { description: '滚动条样式' },

  // 图层/背景
  'layer': { description: '图层/背景 - 控制应用的整体背景和图层样式' },
  'layer/background': { description: '背景色 - 包括primary主背景、secondary次背景、tertiary第三级背景，以及modal模态框、hoverOverlay悬停遮罩等' },
  'layer/background/primary': { description: '主背景色' },
  'layer/background/secondary': { description: '次背景色' },
  'layer/background/tertiary': { description: '第三级背景色' },
  'layer/background/modal': { description: '模态框背景' },
  'layer/background/hoverOverlay': { description: '悬停遮罩背景' },
  'layer/background/codeBlock': { description: '代码块背景' },
  'layer/background/edgelessGrid': { description: '无边界画布网格背景' },
  'layer/insideBorder': { description: '内部边框 - 控制各种内部边框的颜色' },

  // 文本相关
  'text': { description: '文本相关 - 控制文本的各种状态和颜色' },
  'text/primary': { description: '主要文本颜色 - 用于主要内容文本' },
  'text/secondary': { description: '次要文本颜色 - 用于次要内容文本' },
  'text/tertiary': { description: '第三级文本颜色 - 用于辅助说明文本' },
  'text/disable': { description: '禁用状态文本颜色' },
  'text/link': { description: '链接文本颜色 - 用于可点击的链接' },
  'text/emphasis': { description: '强调文本颜色 - 用于需要强调的文本' },
  'text/placeholder': { description: '占位符文本颜色 - 用于输入框提示文字' },
  'text/highlight': { description: '文本高亮 - 控制文本高亮的背景和前景色（支持多种颜色）' },

  // 表格相关
  'table': { description: '表格相关 - 控制表格的边框、背景和文本样式' },
  'table/border': { description: '表格边框颜色' },
  'table/focusBackground': { description: '聚焦背景' },
  'table/focusBorder': { description: '聚焦边框' },
  'table/headerBackground': { description: '表头背景（支持多种颜色：blue/green/grey/orange/purple/red/teal/yellow/default）' },
  'table/indicator': { description: '指示器 - 控制表格指示器的各种状态' },

  // 标签页
  'tab': { description: '标签页 - 控制标签页的背景、字体和图标颜色' },
  'tab/tabBackground': { description: '标签背景（active激活状态，default默认状态，hover悬停状态）' },
  'tab/fontColor': { description: '标签字体颜色' },
  'tab/iconColor': { description: '标签图标颜色' },
  'tab/divider': { description: '分割线和指示器颜色' },

  // 开关/切换
  'toggle': { description: '开关/切换 - 控制开关组件的背景和前景色' },
  'toggle/background': { description: '开关激活时的背景色' },
  'toggle/backgroundDisable': { description: '开关禁用时的背景色' },
  'toggle/backgroundOff': { description: '开关关闭状态时的背景色' },
  'toggle/foreground': { description: '开关按钮的前景色' },
  'switch': { description: '开关组件 - 控制开关组件的详细样式' },
  'switch/buttonBackground': { description: '开关按钮背景 - 控制开关按钮的背景色（active激活状态，hover悬停状态）' },
  'switch/buttonBackground/active': { description: '开关按钮激活状态的背景色' },
  'switch/buttonBackground/hover': { description: '开关按钮悬停状态的背景色' },
  'switch/fontColor': { description: '开关字体颜色 - 控制开关组件中的文字颜色（primary主色，secondary次色，tertiary第三级）' },
  'switch/fontColor/primary': { description: '开关主文字颜色' },
  'switch/fontColor/secondary': { description: '开关次要文字颜色' },
  'switch/fontColor/tertiary': { description: '开关第三级文字颜色' },
  'switch/iconColor': { description: '开关图标颜色 - 控制开关组件中的图标颜色（active激活状态，default默认状态）' },
  'switch/iconColor/active': { description: '开关图标激活状态颜色' },
  'switch/iconColor/default': { description: '开关图标默认状态颜色' },
  'switch/switchBackground': { description: '开关背景 - 控制开关本身的背景色' },
  'switch/switchBackground/background': { description: '开关背景色' },

  // 其他分类
  'adjustmentHandle': { description: '调整手柄 - 控制调整手柄的背景和边框颜色' },
  'backlinks': { description: '反向链接 - 控制反向链接块的背景、边框和悬停状态' },
  'badge': { description: '徽章 - 控制徽章的颜色（believer信徒，free免费，pro专业版）' },
  'calendar': { description: '日历 - 控制日历的颜色（支持多种颜色）' },
  'centerPeek': { description: '中央预览 - 控制中央预览的背景、按钮和遮罩颜色' },
  'chatBlock': { description: '聊天块 - 控制聊天块的背景、边框、图标和文本颜色' },
  'database': { description: '数据库 - 控制数据库的边框、按钮、卡片悬停和聚焦状态' },
  'dialog': { description: '对话框 - 控制对话框的背景色' },
  'integrations': { description: '集成 - 控制集成功能的图标背景' },
  'loading': { description: '加载状态 - 控制加载状态的背景、前景和图片加载样式' },
  'pagelist': { description: '页面列表 - 控制页面列表的悬停边框' },
  'portrait': { description: '头像 - 控制头像的背景色' },
  'radio': { description: '单选按钮 - 控制单选按钮的禁用和激活状态' },
  'readwise': { description: 'Readwise集成 - 控制引用背景和分割线' },
  'segment': { description: '分段 - 控制分段的背景和按钮颜色' },
  'skeleton': { description: '骨架屏 - 控制骨架屏的颜色' },
  'slashMenu': { description: '斜杠菜单 - 控制斜杠菜单的背景色' },
  'status': { description: '状态 - 控制状态的颜色（error错误，success成功）' },
  'toast': { description: '提示消息 - 控制提示消息的卡片层、图标状态和遮罩' },
  'tooltips': { description: '工具提示 - 控制工具提示的背景和前景色' },
  'workspacePicker': { description: '工作区选择器 - 控制工作区选择器的边框和背景' },
  'tableOfContent': { description: '目录 - 控制目录的背景色' },
};

/**
 * 获取变量或节点的元数据
 */
export const getVariableMetadata = (variableName: string, nodePath?: string): ThemeVariableMetadata | undefined => {
  // 优先使用完整路径（nodePath 格式：/block/callout/icon）
  if (nodePath) {
    const fullPath = nodePath.replace(/^\//, ''); // 去掉前导斜杠：block/callout/icon

    // 1. 首先尝试完整路径
    if (variableMetadata[fullPath]) {
      return variableMetadata[fullPath];
    }

    // 2. 尝试逐步去掉最后一部分（从最具体到最通用）
    const pathParts = fullPath.split('/');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const prefix = pathParts.slice(0, i).join('/');
      if (variableMetadata[prefix]) {
        return variableMetadata[prefix];
      }
    }

    // 3. 最后尝试根路径
    if (variableMetadata[pathParts[0]]) {
      return variableMetadata[pathParts[0]];
    }
  }

  // 如果变量名是横线分隔的（如 block-callout-icon-blue），转换为斜杠分隔
  let normalizedName = variableName;
  if (variableName.includes('-') && !variableName.includes('/')) {
    normalizedName = variableName.replace(/-/g, '/');
  }

  // 1. 尝试使用完整变量名
  if (variableMetadata[normalizedName]) {
    return variableMetadata[normalizedName];
  }

  // 2. 尝试逐步去掉最后一部分
  const parts = normalizedName.split('/');
  for (let i = parts.length - 1; i > 0; i--) {
    const prefix = parts.slice(0, i).join('/');
    if (variableMetadata[prefix]) {
      return variableMetadata[prefix];
    }
  }

  // 3. 最后尝试根路径
  if (parts.length > 0 && variableMetadata[parts[0]]) {
    return variableMetadata[parts[0]];
  }

  return undefined;
};

/**
 * 获取变量或节点的说明（兼容旧接口）
 */
export const getVariableDescription = (variableName: string, nodePath?: string): string => {
  const metadata = getVariableMetadata(variableName, nodePath);
  return metadata?.description || '';
};
