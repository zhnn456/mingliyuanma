/**
 * 类型同步脚本 - 确保 Prisma Schema 变更后 TypeScript 类型定义同步
 * 
 * 功能：
 * 1. 从 Prisma schema 提取模型定义
 * 2. 自动生成/更新 src/types/index.ts 中的类型
 * 3. 确保类型与数据库 Schema 一致
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'prisma', 'schema.prisma');
const TYPES_PATH = path.join(ROOT, 'src', 'types', 'index.ts');

function parseSchema(schemaPath) {
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const models = [];
  
  // 匹配 model 块
  const modelRegex = /model\s+(\w+)\s+{([^}]+)}/g;
  let match;
  
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    const fields = parseFields(modelBody);
    models.push({ name: modelName, fields });
  }
  
  return models;
}

function parseFields(body) {
  const fields = [];
  const lines = body.trim().split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@') || trimmed.startsWith('@')) {
      continue;
    }
    
    // 解析字段: fieldName Type @default(...) @unique etc.
    const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)(\[\])?\s*(@\w+(?:\([^)]*\))?\s*)*$/);
    if (fieldMatch) {
      const name = fieldMatch[1];
      const prismaType = fieldMatch[2];
      const isArray = fieldMatch[3] === '[]';
      const modifiers = trimmed.match(/@\w+(?:\([^)]*\))?/g) || [];
      
      const isOptional = modifiers.some(m => m.startsWith('@optional'));
      const isRequired = modifiers.some(m => m.startsWith('@required'));
      
      fields.push({
        name,
        prismaType,
        isArray,
        isOptional,
        isRequired,
        modifiers,
      });
    }
  }
  
  return fields;
}

function prismaToTypeScript(prismaType, isArray) {
  const typeMap = {
    'String': 'string',
    'Int': 'number',
    'Float': 'number',
    'Decimal': 'number',
    'Boolean': 'boolean',
    'DateTime': 'Date',
    'Json': 'Record<string, unknown>',
    'Bytes': 'Buffer',
    'BigInt': 'bigint',
  };
  
  const tsType = typeMap[prismaType] || prismaType;
  return isArray ? `${tsType}[]` : tsType;
}

function generateInterface(model) {
  const lines = [];
  lines.push(`export interface ${model.name} {`);
  
  for (const field of model.fields) {
    const tsType = prismaToTypeScript(field.prismaType, field.isArray);
    const optionalMark = field.isOptional ? '?' : '';
    lines.push(`  ${field.name}${optionalMark}: ${tsType};`);
  }
  
  lines.push('}');
  lines.push('');
  
  return lines.join('\n');
}

function generateTypesFile(models) {
  const header = `/**
 * 自动生成的类型定义 - 请勿手动修改数据库类型部分
 * 运行 npm run sync:types 来更新数据库类型
 * 
 * 数据库类型基于 Prisma Schema 生成，与数据库 Schema 保持一致
 * 业务类型（如八字类型、API类型、更新日志类型）请在其他文件中定义并在此处导出
 */

// 重新导出业务类型
export * from './bazi';
export * from './api';
export * from './update-log';

`;

  const separator = `
// ============================================
// 数据库模型类型（由 sync:types 自动生成）
// ============================================

`;

  const interfaces = models.map(generateInterface).join('\n');
  
  // 生成常用的辅助类型
  const helpers = `
// ============================================
// 通用辅助类型
// ============================================

// API 响应通用类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 查询参数
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// 时间戳
export type Timestamp = string;

// ID 类型
export type ID = string;
`;

  return header + separator + interfaces + helpers;
}

function main() {
  console.log('🔄 开始类型同步...');
  console.log('📖 读取 Prisma Schema:', SCHEMA_PATH);
  
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error('❌ Prisma Schema 文件不存在:', SCHEMA_PATH);
    process.exit(1);
  }
  
  const models = parseSchema(SCHEMA_PATH);
  console.log(`📊 解析到 ${models.length} 个模型:`, models.map(m => m.name).join(', '));
  
  const typesContent = generateTypesFile(models);
  
  // 确保目录存在
  const typesDir = path.dirname(TYPES_PATH);
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  fs.writeFileSync(TYPES_PATH, typesContent, 'utf-8');
  console.log('✅ 类型定义已更新:', TYPES_PATH);
  
  console.log('\n📋 同步完成摘要:');
  console.log(`   - 模型数量: ${models.length}`);
  console.log(`   - 输出文件: src/types/index.ts`);
  console.log('   - 下一步: 运行 npm run prisma:generate 更新 Prisma Client');
}

main();
