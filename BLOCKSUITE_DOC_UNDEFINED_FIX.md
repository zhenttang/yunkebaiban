# BlockSuite Doc undefined 错误修复

## 问题描述

用户点击新创建的文档时，出现以下错误：
```
Cannot read properties of undefined (reading 'blockSuiteDoc')
TypeError: Cannot read properties of undefined (reading 'blockSuiteDoc')
    at new Doc (http://localhost:8081/js/index.js:957169:129)
```

## 根本原因

在 `Doc` 类中，`yDoc` 和 `blockSuiteDoc` 被定义为类属性，它们在类定义时就被初始化，**在构造函数执行之前**：

```typescript
// 问题代码
public readonly yDoc = this.scope.props.blockSuiteDoc.spaceDoc;
public readonly blockSuiteDoc = this.scope.props.blockSuiteDoc;
```

当 `Doc` 类被实例化时：
1. TypeScript/JavaScript 会先初始化类属性（第55-56行）
2. 此时 `this.scope.props.blockSuiteDoc` 可能还是 `undefined`
3. 访问 `undefined.spaceDoc` 会导致错误
4. 构造函数中的防御性检查（第20-22行）还没有执行

## 修复方案

将 `yDoc` 和 `blockSuiteDoc` 从类属性改为 **getter 方法**，确保在访问时才评估：

```typescript
// 修复后的代码
public get yDoc() {
  if (!this.scope.props.blockSuiteDoc) {
    throw new Error(`DocScope blockSuiteDoc is undefined for doc ${this.scope.props.docId}`);
  }
  return this.scope.props.blockSuiteDoc.spaceDoc;
}

public get blockSuiteDoc() {
  if (!this.scope.props.blockSuiteDoc) {
    throw new Error(`DocScope blockSuiteDoc is undefined for doc ${this.scope.props.docId}`);
  }
  return this.scope.props.blockSuiteDoc;
}
```

## 修改的文件

1. **`packages/frontend/core/src/modules/doc/entities/doc.ts`**
   - 将 `yDoc` 和 `blockSuiteDoc` 从类属性改为 getter 方法
   - 在 getter 中添加防御性检查

2. **`packages/frontend/core/src/modules/doc/services/docs.ts`**
   - 在 `open` 方法中添加更详细的错误日志
   - 确保在创建 `DocScope` 之前 `blockSuiteDoc` 已经验证

## 为什么这样修复有效

1. **延迟评估**：Getter 方法在访问时才执行，而不是在类定义时
2. **防御性检查**：每次访问都会检查 `blockSuiteDoc` 是否存在
3. **更好的错误信息**：如果 `blockSuiteDoc` 未定义，会抛出清晰的错误信息

## 测试建议

1. 创建新文档并立即打开
2. 检查控制台是否有相关错误日志
3. 验证文档可以正常编辑

## 相关代码路径

- `Doc` 类：`packages/frontend/core/src/modules/doc/entities/doc.ts`
- `DocsService.open`：`packages/frontend/core/src/modules/doc/services/docs.ts`
- `DocsStore.getBlockSuiteDoc`：`packages/frontend/core/src/modules/doc/stores/docs.ts`

