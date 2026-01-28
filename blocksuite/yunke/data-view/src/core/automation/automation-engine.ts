/**
 * 自动化规则引擎
 */

export interface AutomationRule {
  /** 规则 ID */
  id: string;
  /** 规则名称 */
  name: string;
  /** 规则描述 */
  description?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 触发条件 */
  trigger: AutomationTrigger;
  /** 条件（可选，满足时才执行动作） */
  conditions?: AutomationCondition[];
  /** 执行动作 */
  actions: AutomationAction[];
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 最后执行时间 */
  lastRunAt?: number;
  /** 执行次数 */
  runCount: number;
}

/**
 * 触发器类型
 */
export type TriggerType =
  | 'row-created'        // 行创建时
  | 'row-updated'        // 行更新时
  | 'row-deleted'        // 行删除时
  | 'cell-updated'       // 单元格更新时
  | 'field-matches'      // 字段值匹配时
  | 'scheduled';         // 定时触发

export interface AutomationTrigger {
  type: TriggerType;
  /** 监听的属性 ID（可选，仅某些触发类型需要） */
  propertyId?: string;
  /** 定时配置（仅 scheduled 类型） */
  schedule?: {
    cron?: string;
    interval?: number; // 毫秒
  };
}

/**
 * 条件类型
 */
export type ConditionOperator =
  | 'equals'           // 等于
  | 'not-equals'       // 不等于
  | 'contains'         // 包含
  | 'not-contains'     // 不包含
  | 'greater-than'     // 大于
  | 'less-than'        // 小于
  | 'is-empty'         // 为空
  | 'is-not-empty'     // 不为空
  | 'changed-to'       // 变更为
  | 'changed-from';    // 从...变更

export interface AutomationCondition {
  /** 属性 ID */
  propertyId: string;
  /** 操作符 */
  operator: ConditionOperator;
  /** 比较值 */
  value?: unknown;
  /** 逻辑连接（与下一个条件） */
  logic?: 'and' | 'or';
}

/**
 * 动作类型
 */
export type ActionType =
  | 'set-value'        // 设置值
  | 'send-notification' // 发送通知
  | 'send-webhook'     // 发送 Webhook
  | 'send-email'       // 发送邮件
  | 'create-row'       // 创建行
  | 'update-row'       // 更新行
  | 'delete-row';      // 删除行

export interface AutomationAction {
  type: ActionType;
  /** 动作配置 */
  config: AutomationActionConfig;
}

export interface AutomationActionConfig {
  /** 目标属性 ID（set-value, update-row） */
  propertyId?: string;
  /** 设置的值 */
  value?: unknown;
  /** 使用公式计算值 */
  formula?: string;
  /** 通知/邮件接收人 */
  recipients?: string[];
  /** 通知/邮件内容模板 */
  template?: string;
  /** Webhook URL */
  webhookUrl?: string;
  /** 新行数据模板 */
  rowTemplate?: Record<string, unknown>;
}

/**
 * 自动化执行上下文
 */
export interface AutomationContext {
  viewId: string;
  rowId?: string;
  propertyId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  rowData?: Record<string, unknown>;
  triggeredBy?: string;
}

const STORAGE_KEY = 'yunke-automation-rules';

/**
 * 自动化引擎
 */
export class AutomationEngine {
  private static instance: AutomationEngine;
  private rules: AutomationRule[] = [];
  private listeners: Map<string, Set<(context: AutomationContext) => void>> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.rules = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load automation rules:', e);
      this.rules = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.rules));
    } catch (e) {
      console.warn('Failed to save automation rules:', e);
    }
  }

  /**
   * 获取所有规则
   */
  getRules(): AutomationRule[] {
    return [...this.rules];
  }

  /**
   * 获取单个规则
   */
  getRule(id: string): AutomationRule | undefined {
    return this.rules.find(r => r.id === id);
  }

  /**
   * 添加规则
   */
  addRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      runCount: 0,
    };
    this.rules.push(newRule);
    this.saveToStorage();
    return newRule;
  }

  /**
   * 更新规则
   */
  updateRule(id: string, updates: Partial<AutomationRule>): boolean {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.rules[index] = {
      ...this.rules[index],
      ...updates,
      updatedAt: Date.now(),
    };
    this.saveToStorage();
    return true;
  }

  /**
   * 删除规则
   */
  deleteRule(id: string): boolean {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.rules.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * 触发自动化
   */
  async trigger(triggerType: TriggerType, context: AutomationContext): Promise<void> {
    const matchingRules = this.rules.filter(
      r => r.enabled && r.trigger.type === triggerType
    );

    for (const rule of matchingRules) {
      try {
        // 检查条件
        if (rule.conditions && !this.evaluateConditions(rule.conditions, context)) {
          continue;
        }

        // 执行动作
        await this.executeActions(rule, context);

        // 更新执行统计
        this.updateRule(rule.id, {
          lastRunAt: Date.now(),
          runCount: rule.runCount + 1,
        });
      } catch (e) {
        console.error(`Automation rule ${rule.name} failed:`, e);
      }
    }
  }

  /**
   * 评估条件
   */
  private evaluateConditions(
    conditions: AutomationCondition[],
    context: AutomationContext
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    let result = true;
    let logic: 'and' | 'or' = 'and';

    for (const condition of conditions) {
      const fieldValue = context.rowData?.[condition.propertyId];
      const conditionResult = this.evaluateSingleCondition(condition, fieldValue, context);

      if (logic === 'and') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      logic = condition.logic || 'and';
    }

    return result;
  }

  /**
   * 评估单个条件
   */
  private evaluateSingleCondition(
    condition: AutomationCondition,
    fieldValue: unknown,
    context: AutomationContext
  ): boolean {
    const { operator, value } = condition;

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not-equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'not-contains':
        return !String(fieldValue).includes(String(value));
      case 'greater-than':
        return Number(fieldValue) > Number(value);
      case 'less-than':
        return Number(fieldValue) < Number(value);
      case 'is-empty':
        return fieldValue == null || fieldValue === '';
      case 'is-not-empty':
        return fieldValue != null && fieldValue !== '';
      case 'changed-to':
        return context.newValue === value;
      case 'changed-from':
        return context.oldValue === value;
      default:
        return false;
    }
  }

  /**
   * 执行动作
   */
  private async executeActions(
    rule: AutomationRule,
    context: AutomationContext
  ): Promise<void> {
    for (const action of rule.actions) {
      await this.executeAction(action, context);
    }
  }

  /**
   * 执行单个动作
   */
  private async executeAction(
    action: AutomationAction,
    context: AutomationContext
  ): Promise<void> {
    const { type, config } = action;

    switch (type) {
      case 'set-value':
        // 设置值的逻辑需要由外部实现
        this.notifyListeners('set-value', {
          ...context,
          propertyId: config.propertyId,
          newValue: config.value,
        });
        break;

      case 'send-notification':
        // 发送通知
        console.log('Sending notification:', config.template, 'to', config.recipients);
        break;

      case 'send-webhook':
        if (config.webhookUrl) {
          await fetch(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rule: rule.name,
              context,
              timestamp: Date.now(),
            }),
          }).catch(console.error);
        }
        break;

      case 'send-email':
        // 邮件发送需要后端支持
        console.log('Would send email to:', config.recipients);
        break;

      default:
        console.log('Unknown action type:', type);
    }
  }

  /**
   * 添加动作监听器
   */
  addListener(
    actionType: string,
    listener: (context: AutomationContext) => void
  ): () => void {
    if (!this.listeners.has(actionType)) {
      this.listeners.set(actionType, new Set());
    }
    this.listeners.get(actionType)!.add(listener);
    return () => this.listeners.get(actionType)?.delete(listener);
  }

  private notifyListeners(actionType: string, context: AutomationContext): void {
    this.listeners.get(actionType)?.forEach(listener => listener(context));
  }
}

/**
 * 获取自动化引擎实例
 */
export function getAutomationEngine(): AutomationEngine {
  return AutomationEngine.getInstance();
}

/**
 * 触发器类型标签
 */
export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  'row-created': '行创建时',
  'row-updated': '行更新时',
  'row-deleted': '行删除时',
  'cell-updated': '单元格更新时',
  'field-matches': '字段值匹配时',
  'scheduled': '定时触发',
};

/**
 * 动作类型标签
 */
export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  'set-value': '设置字段值',
  'send-notification': '发送通知',
  'send-webhook': '发送 Webhook',
  'send-email': '发送邮件',
  'create-row': '创建行',
  'update-row': '更新行',
  'delete-row': '删除行',
};

/**
 * 条件操作符标签
 */
export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  'equals': '等于',
  'not-equals': '不等于',
  'contains': '包含',
  'not-contains': '不包含',
  'greater-than': '大于',
  'less-than': '小于',
  'is-empty': '为空',
  'is-not-empty': '不为空',
  'changed-to': '变更为',
  'changed-from': '从...变更',
};
