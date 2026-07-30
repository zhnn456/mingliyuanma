/**
 * 紫微斗数 · 飞星四化飞化规则
 * 
 * 飞星派核心：每宫天干四化，飞入他宫形成动态关联
 * 飞化层级：生年四化 → 大限四化 → 流年四化 → 流月四化
 * 权重递减，高阶可压制低阶
 */

import type { FlyingStarResult, CausalChain, ChainNode, MutagenType, Palace, ZiweiChart } from '../../interfaces/chart';
import { getSihuaForStem } from './tables';

/**
 * 计算单宫的飞化结果
 */
export function calculatePalaceFlyingStars(
  palace: Palace,
  palaces: Palace[],
  level: 'birth' | 'decade' | 'year' | 'month' = 'birth'
): FlyingStarResult {
  const stem = palace.heavenlyStem;
  const sihua = getSihuaForStem(stem);
  
  const result: FlyingStarResult = {
    sourcePalace: palace.name,
    sourceStem: stem,
    luFlying: findFlyingTarget(sihua.lu, palaces, palace.name),
    quanFlying: findFlyingTarget(sihua.quan, palaces, palace.name),
    keFlying: findFlyingTarget(sihua.ke, palaces, palace.name),
    jiFlying: findFlyingTarget(sihua.ji, palaces, palace.name),
    selfTransformations: checkSelfTransformations(palace, sihua),
    collisions: [],
  };
  
  // 计算冲会
  result.collisions = calculateCollisions(result, palaces);
  
  return result;
}

/**
 * 查找飞化目标宫
 */
function findFlyingTarget(starName: string, palaces: Palace[], sourcePalaceName: string) {
  const targetPalace = palaces.find(p =>
    p.majorStars.some(s => s.name === starName) ||
    p.minorStars.some(s => s.name === starName)
  );
  
  if (!targetPalace) {
    return { star: starName, targetPalace: '无', isSelf: false };
  }
  
  const isSelf = targetPalace.name === sourcePalaceName;
  return {
    star: starName,
    targetPalace: targetPalace.name,
    isSelf,
  };
}

/**
 * 检查自化（四化星落回本宫）
 */
function checkSelfTransformations(palace: Palace, sihua: { lu: string; quan: string; ke: string; ji: string }) {
  const allStars = [
    ...palace.majorStars.map(s => s.name),
    ...palace.minorStars.map(s => s.name),
  ];
  
  return {
    lu: allStars.includes(sihua.lu),
    quan: allStars.includes(sihua.quan),
    ke: allStars.includes(sihua.ke),
    ji: allStars.includes(sihua.ji),
  };
}

/**
 * 计算冲会（化出之星冲对宫）
 */
function calculateCollisions(flying: FlyingStarResult, palaces: Palace[]) {
  const collisions: FlyingStarResult['collisions'] = [];
  type FlyingKey = 'luFlying' | 'quanFlying' | 'keFlying' | 'jiFlying';
  const mutagenTypes: { key: FlyingKey; type: MutagenType }[] = [
    { key: 'luFlying', type: '化禄' },
    { key: 'quanFlying', type: '化权' },
    { key: 'keFlying', type: '化科' },
    { key: 'jiFlying', type: '化忌' },
  ];

  for (const { key, type } of mutagenTypes) {
    const flyingInfo = flying[key];
    if (flyingInfo.targetPalace && flyingInfo.targetPalace !== '无' && !flyingInfo.isSelf) {
      // 找到目标宫的对宫
      const targetPalace = palaces.find(p => p.name === flyingInfo.targetPalace);
      if (targetPalace) {
        const oppositeIndex = (targetPalace.index + 6) % 12;
        const oppositePalace = palaces.find(p => p.index === oppositeIndex);
        if (oppositePalace) {
          collisions.push({
            mutagen: type,
            star: flyingInfo.star,
            collidedPalace: oppositePalace.name,
          });
        }
      }
    }
  }

  return collisions;
}

/**
 * 计算四化因果链
 * 例：命宫忌→事业宫→事业宫禄→财帛宫
 */
export function calculateCausalChain(
  palaces: Palace[],
  startPalaceName: string,
  maxDepth: number = 5
): CausalChain {
  const startPalace = palaces.find(p => p.name === startPalaceName);
  const nodes: ChainNode[] = [];
  const visitedPalaces = new Set<string>([startPalaceName]);
  
  if (!startPalace) {
    return { startPalace: startPalaceName, nodes: [], depth: 0 };
  }
  
  let currentPalace = startPalace;
  let depth = 0;
  
  while (depth < maxDepth) {
    const flying = calculatePalaceFlyingStars(currentPalace, palaces);
    
    // 优先追踪化忌的路径
    const target = flying.jiFlying;
    if (target.targetPalace === '无' || target.isSelf || visitedPalaces.has(target.targetPalace)) {
      // 如果化忌无路，尝试化禄
      const luTarget = flying.luFlying;
      if (luTarget.targetPalace === '无' || luTarget.isSelf || visitedPalaces.has(luTarget.targetPalace)) {
        break;
      }
      nodes.push({
        palace: currentPalace.name,
        mutagen: '化禄',
        star: luTarget.star,
        targetPalace: luTarget.targetPalace,
        assessment: luTarget.isSelf ? '中性' : '吉',
      });
      visitedPalaces.add(luTarget.targetPalace);
      const nextPalace = palaces.find(p => p.name === luTarget.targetPalace);
      if (!nextPalace) break;
      currentPalace = nextPalace;
    } else {
      nodes.push({
        palace: currentPalace.name,
        mutagen: '化忌',
        star: target.star,
        targetPalace: target.targetPalace,
        assessment: target.isSelf ? '凶' : pathAssessment(flying, palaces),
      });
      visitedPalaces.add(target.targetPalace);
      const nextPalace = palaces.find(p => p.name === target.targetPalace);
      if (!nextPalace) break;
      currentPalace = nextPalace;
    }
    
    depth++;
  }
  
  return {
    startPalace: startPalaceName,
    nodes,
    depth,
  };
}

/**
 * 判断路径吉凶
 */
function pathAssessment(flying: FlyingStarResult, palaces: Palace[]): '吉' | '凶' | '中性' {
  // 如果化禄飞入，则为吉
  if (!flying.luFlying.isSelf && flying.luFlying.targetPalace !== '无') {
    return '吉';
  }
  // 如果有冲会，则为凶
  if (flying.collisions.length > 0) {
    return '凶';
  }
  return '中性';
}

/**
 * 计算命盘所有宫的飞化
 */
export function calculateAllFlyingStars(palaces: Palace[]): FlyingStarResult[] {
  return palaces.map(palace => calculatePalaceFlyingStars(palace, palaces));
}

/**
 * 查找关键飞化
 */
export function findKeyFlying(palaces: Palace[], chart: ZiweiChart) {
  const keyFlying: {
    fromPalace: string;
    toPalace: string;
    mutagen: MutagenType;
    meaning: string;
  }[] = [];
  
  const importantPalaces = ['命宫', '财帛宫', '官禄宫', '夫妻宫', '迁移宫'];
  
  for (const palace of palaces) {
    if (!importantPalaces.includes(palace.name)) continue;
    
    const flying = calculatePalaceFlyingStars(palace, palaces);
    
    // 化忌飞入他宫是关键飞化
    if (!flying.jiFlying.isSelf && flying.jiFlying.targetPalace !== '无') {
      keyFlying.push({
        fromPalace: palace.name,
        toPalace: flying.jiFlying.targetPalace,
        mutagen: '化忌',
        meaning: `${palace.name}化忌入${flying.jiFlying.targetPalace}，需重点关注`,
      });
    }
    
    // 化禄飞入他宫也是关键
    if (!flying.luFlying.isSelf && flying.luFlying.targetPalace !== '无') {
      keyFlying.push({
        fromPalace: palace.name,
        toPalace: flying.luFlying.targetPalace,
        mutagen: '化禄',
        meaning: `${palace.name}化禄入${flying.luFlying.targetPalace}，此处有贵人助力`,
      });
    }
  }
  
  return keyFlying;
}
