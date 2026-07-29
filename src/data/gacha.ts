import type { AbilityDefinition, AbilityKey } from "../game/core/types";

export type GachaRarity = "common" | "elite" | "rare" | "ultra";

export interface GachaCard {
  id: string;
  serial: number;
  name: string;
  subtitle: string;
  rarity: GachaRarity;
  slot: AbilityKey;
  ability: AbilityDefinition;
  art: string;
  weight: number;
  flavor: string;
}

export const GACHA_DRAW_COST = 280;
export const GACHA_TEN_DRAW_COST = 2500;

export const rarityLabels: Record<GachaRarity, string> = {
  common: "初级技能",
  elite: "精良技能",
  rare: "稀有技能",
  ultra: "超稀有技能"
};

function skill(card: Omit<GachaCard, "ability"> & { ability: Omit<AbilityDefinition, "key"> }): GachaCard {
  return {
    ...card,
    ability: {
      ...card.ability,
      key: card.slot
    }
  };
}

export const gachaCards: GachaCard[] = [
  skill({
    id: "skill-q-star-cut",
    serial: 1,
    name: "星痕突切",
    subtitle: "Q · 方向突进",
    rarity: "common",
    slot: "Q",
    art: "/gacha/cards/card-01.svg",
    weight: 58,
    flavor: "短距离切入并在终点撕开星痕。",
    ability: { name: "星痕突切", shortName: "突切", description: "向目标方向突进或释放直线冲击，造成稳定伤害。", cooldown: 6.8, range: 7.0, radius: 1.55, damage: 108, damageType: "physical", targeting: "direction", icon: "blade" }
  }),
  skill({
    id: "skill-q-vine-bolt",
    serial: 2,
    name: "森辉灵弹",
    subtitle: "Q · 远程弹体",
    rarity: "common",
    slot: "Q",
    art: "/gacha/cards/card-02.svg",
    weight: 54,
    flavor: "青绿色能量弹命中后会拖慢目标步伐。",
    ability: { name: "森辉灵弹", shortName: "灵弹", description: "发射自然能量弹，命中敌人造成魔法伤害。", cooldown: 6.2, range: 10.8, radius: 1.08, damage: 116, damageType: "magic", targeting: "direction", icon: "orb" }
  }),
  skill({
    id: "skill-q-shield-rush",
    serial: 3,
    name: "玄盾破阵",
    subtitle: "Q · 冲撞控制",
    rarity: "common",
    slot: "Q",
    art: "/gacha/cards/card-03.svg",
    weight: 52,
    flavor: "能量盾沿直线推进，撞散敌方阵型。",
    ability: { name: "玄盾破阵", shortName: "破阵", description: "向前冲撞，命中敌人造成伤害并短暂压制。", cooldown: 8.0, range: 6.2, radius: 1.95, damage: 94, damageType: "physical", targeting: "direction", icon: "charge" }
  }),
  skill({
    id: "skill-q-frost-lance",
    serial: 4,
    name: "青霜贯星",
    subtitle: "Q · 高伤直线",
    rarity: "elite",
    slot: "Q",
    art: "/gacha/cards/card-04.svg",
    weight: 30,
    flavor: "霜色枪芒穿过战线，留下晶亮裂纹。",
    ability: { name: "青霜贯星", shortName: "贯星", description: "向前释放高伤害直线技能，适合先手消耗。", cooldown: 7.8, range: 9.0, radius: 1.25, damage: 146, damageType: "magic", targeting: "direction", icon: "orb" }
  }),
  skill({
    id: "skill-q-red-feather",
    serial: 5,
    name: "赤羽贯日",
    subtitle: "Q · 爆发切入",
    rarity: "rare",
    slot: "Q",
    art: "/gacha/cards/card-05.svg",
    weight: 14,
    flavor: "高温羽刃将切入路径点燃成红线。",
    ability: { name: "赤羽贯日", shortName: "贯日", description: "更远距离突进，对路径敌人造成高额物理伤害。", cooldown: 8.4, range: 8.4, radius: 1.8, damage: 168, damageType: "physical", targeting: "direction", icon: "blade" }
  }),
  skill({
    id: "skill-w-rotating-ring",
    serial: 6,
    name: "回天霜环",
    subtitle: "W · 近身范围",
    rarity: "common",
    slot: "W",
    art: "/gacha/cards/card-06.svg",
    weight: 52,
    flavor: "霜环自脚下铺开，迫使近身敌人退后。",
    ability: { name: "回天霜环", shortName: "霜环", description: "对周围敌人造成范围伤害。", cooldown: 8.0, range: 0, radius: 3.25, damage: 92, damageType: "physical", targeting: "self", icon: "spin" }
  }),
  skill({
    id: "skill-w-vine-field",
    serial: 7,
    name: "缠星藤域",
    subtitle: "W · 区域减速",
    rarity: "common",
    slot: "W",
    art: "/gacha/cards/card-07.svg",
    weight: 48,
    flavor: "藤蔓从星尘中生长，拖住敌人的脚步。",
    ability: { name: "缠星藤域", shortName: "藤域", description: "在目标区域生成持续减速和伤害区域。", cooldown: 9.5, range: 8.2, radius: 3.45, damage: 32, damageType: "magic", targeting: "area", icon: "vines" }
  }),
  skill({
    id: "skill-w-star-rain",
    serial: 8,
    name: "小型星瀑",
    subtitle: "W · 持续区域",
    rarity: "elite",
    slot: "W",
    art: "/gacha/cards/card-08.svg",
    weight: 30,
    flavor: "星屑在短暂延迟后连续落下。",
    ability: { name: "小型星瀑", shortName: "星瀑", description: "在区域内持续造成魔法伤害。", cooldown: 10.0, range: 8.6, radius: 3.8, damage: 40, damageType: "magic", targeting: "area", icon: "storm" }
  }),
  skill({
    id: "skill-w-crystal-guard",
    serial: 9,
    name: "赤晶壁环",
    subtitle: "W · 防护技能",
    rarity: "elite",
    slot: "W",
    art: "/gacha/cards/card-09.svg",
    weight: 26,
    flavor: "赤晶碎片围绕英雄旋转，吸收一次猛烈进攻。",
    ability: { name: "赤晶壁环", shortName: "壁环", description: "展开近身壁环，提供防护或近身压迫。", cooldown: 12.0, range: 0, radius: 3.1, damage: 54, damageType: "magic", targeting: "self", icon: "shield" }
  }),
  skill({
    id: "skill-e-flash",
    serial: 10,
    name: "折光闪现",
    subtitle: "E · 位移",
    rarity: "common",
    slot: "E",
    art: "/gacha/cards/card-10.svg",
    weight: 50,
    flavor: "以一道折光越过战场缝隙。",
    ability: { name: "折光闪现", shortName: "闪现", description: "向指定方向快速位移。", cooldown: 11.0, range: 7.0, radius: 0.8, damage: 0, damageType: "true", targeting: "direction", icon: "blink" }
  }),
  skill({
    id: "skill-e-guard-step",
    serial: 11,
    name: "星步护幕",
    subtitle: "E · 护盾加速",
    rarity: "common",
    slot: "E",
    art: "/gacha/cards/card-11.svg",
    weight: 48,
    flavor: "星步展开一层薄盾，让撤退和追击更顺滑。",
    ability: { name: "星步护幕", shortName: "护幕", description: "获得短暂护盾与移动速度。", cooldown: 10.8, range: 0, radius: 0, damage: 0, damageType: "true", targeting: "self", icon: "guard" }
  }),
  skill({
    id: "skill-e-earth-quake",
    serial: 12,
    name: "地脉震鸣",
    subtitle: "E · 近身控制",
    rarity: "elite",
    slot: "E",
    art: "/gacha/cards/card-12.svg",
    weight: 28,
    flavor: "能量沿古石道路传导，击晕近身敌人。",
    ability: { name: "地脉震鸣", shortName: "震鸣", description: "震击地面，短暂控制周围敌人。", cooldown: 12.0, range: 0, radius: 3.8, damage: 78, damageType: "magic", targeting: "self", icon: "quake" }
  }),
  skill({
    id: "skill-e-wind-shift",
    serial: 13,
    name: "流风换位",
    subtitle: "E · 短冷却位移",
    rarity: "rare",
    slot: "E",
    art: "/gacha/cards/card-13.svg",
    weight: 14,
    flavor: "风痕替身留在原地，本体已抵达侧翼。",
    ability: { name: "流风换位", shortName: "换位", description: "冷却更短的中距离位移技能。", cooldown: 8.8, range: 6.4, radius: 0.7, damage: 0, damageType: "true", targeting: "direction", icon: "blink" }
  }),
  skill({
    id: "skill-r-star-vine",
    serial: 14,
    name: "星藤风暴",
    subtitle: "R · 范围爆发",
    rarity: "elite",
    slot: "R",
    art: "/gacha/cards/card-14.svg",
    weight: 24,
    flavor: "巨型星藤从裂隙中展开，持续绞碎敌阵。",
    ability: { name: "星藤风暴", shortName: "风暴", description: "召唤持续范围伤害区域。", cooldown: 32.0, range: 8.6, radius: 4.8, damage: 48, damageType: "magic", targeting: "area", icon: "storm" }
  }),
  skill({
    id: "skill-r-domain",
    serial: 15,
    name: "镇域穹顶",
    subtitle: "R · 团队防护",
    rarity: "elite",
    slot: "R",
    art: "/gacha/cards/card-15.svg",
    weight: 22,
    flavor: "穹顶锁住阵地，让友方获得一段安全推进窗口。",
    ability: { name: "镇域穹顶", shortName: "穹顶", description: "展开大型防护领域，降低友方受到的伤害。", cooldown: 32.0, range: 0, radius: 7.0, damage: 0, damageType: "true", targeting: "self", icon: "domain" }
  }),
  skill({
    id: "skill-r-star-blade",
    serial: 16,
    name: "曜刃临界",
    subtitle: "R · 强化普攻",
    rarity: "elite",
    slot: "R",
    art: "/gacha/cards/card-16.svg",
    weight: 22,
    flavor: "刀锋进入临界相位，普攻拖出远程剑气。",
    ability: { name: "曜刃临界", shortName: "临界", description: "进入强化状态，提升普攻并生成额外能量伤害。", cooldown: 30.0, range: 0, radius: 0, damage: 58, damageType: "physical", targeting: "self", icon: "nova" }
  }),
  skill({
    id: "skill-r-spirit-tide",
    serial: 17,
    name: "万象灵潮",
    subtitle: "R · 稀有持续爆发",
    rarity: "rare",
    slot: "R",
    art: "/gacha/cards/card-17.svg",
    weight: 10,
    flavor: "灵潮翻卷成涡，敌人越久不走越危险。",
    ability: { name: "万象灵潮", shortName: "灵潮", description: "强力持续范围技能，适合团战中心释放。", cooldown: 34.0, range: 9.0, radius: 5.0, damage: 58, damageType: "magic", targeting: "area", icon: "storm" }
  }),
  skill({
    id: "skill-r-crimson-domain",
    serial: 18,
    name: "赤霄镇界",
    subtitle: "R · 稀有防线",
    rarity: "rare",
    slot: "R",
    art: "/gacha/cards/card-18.svg",
    weight: 9,
    flavor: "赤晶防线从地面升起，将正面战场钉住。",
    ability: { name: "赤霄镇界", shortName: "镇界", description: "展开更大范围的防护领域。", cooldown: 35.0, range: 0, radius: 7.6, damage: 0, damageType: "true", targeting: "self", icon: "domain" }
  }),
  skill({
    id: "skill-w-mirror-storm",
    serial: 19,
    name: "镜月天瀑",
    subtitle: "W · 稀有区域",
    rarity: "rare",
    slot: "W",
    art: "/gacha/cards/card-19.svg",
    weight: 10,
    flavor: "镜面光雨从上空落下，将敌方阵型逼散。",
    ability: { name: "镜月天瀑", shortName: "天瀑", description: "稀有区域技能，拥有更大的覆盖范围。", cooldown: 11.5, range: 9.2, radius: 4.15, damage: 48, damageType: "magic", targeting: "area", icon: "storm" }
  }),
  skill({
    id: "skill-r-golden-decree",
    serial: 20,
    name: "天衡金令",
    subtitle: "R · 金色终式",
    rarity: "ultra",
    slot: "R",
    art: "/gacha/cards/card-20.svg",
    weight: 2,
    flavor: "超稀有金色技能卡。星核敕令落下时，整片战场短暂归于天衡。",
    ability: { name: "天衡金令", shortName: "金令", description: "金色终式技能，拥有最高的范围、伤害和战场压制力。", cooldown: 38.0, range: 9.5, radius: 5.7, damage: 76, damageType: "magic", targeting: "area", icon: "storm" }
  })
];

export const ultraRareCard = gachaCards.find((card) => card.rarity === "ultra") ?? gachaCards[gachaCards.length - 1];

export function getGachaCost(count: number): number {
  return count >= 10 ? GACHA_TEN_DRAW_COST : GACHA_DRAW_COST * Math.max(1, count);
}

export function findGachaCard(cardId?: string): GachaCard | undefined {
  return cardId ? gachaCards.find((card) => card.id === cardId) : undefined;
}

export function buildEquippedAbilities(equipped: Partial<Record<AbilityKey, string>>): Partial<Record<AbilityKey, AbilityDefinition>> {
  return Object.fromEntries(
    (Object.entries(equipped) as Array<[AbilityKey, string | undefined]>)
      .map(([key, cardId]) => [key, findGachaCard(cardId)?.ability] as const)
      .filter((entry): entry is readonly [AbilityKey, AbilityDefinition] => Boolean(entry[1]))
  ) as Partial<Record<AbilityKey, AbilityDefinition>>;
}

export function getGachaRateSummary() {
  const total = gachaCards.reduce((sum, card) => sum + card.weight, 0);
  const byRarity = gachaCards.reduce<Record<GachaRarity, number>>(
    (acc, card) => {
      acc[card.rarity] += card.weight;
      return acc;
    },
    { common: 0, elite: 0, rare: 0, ultra: 0 }
  );

  return (Object.keys(byRarity) as GachaRarity[]).map((rarity) => ({
    rarity,
    label: rarityLabels[rarity],
    percent: ((byRarity[rarity] / total) * 100).toFixed(2)
  }));
}
