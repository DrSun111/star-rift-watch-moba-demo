import { AbilityDefinition, HeroArchetype, HeroDefinition, HeroId } from "../game/core/types";

const abilityText: Record<HeroArchetype, Array<Omit<AbilityDefinition, "name" | "shortName" | "description">>> = {
  warrior: [
    { key: "Q", cooldown: 7, range: 7.2, radius: 1.8, damage: 92, damageType: "physical", targeting: "direction", icon: "blade" },
    { key: "W", cooldown: 8.5, range: 0, radius: 3.1, damage: 82, damageType: "physical", targeting: "self", icon: "spin" },
    { key: "E", cooldown: 12, range: 0, radius: 0, damage: 0, damageType: "true", targeting: "self", icon: "guard" },
    { key: "R", cooldown: 30, range: 0, radius: 0, damage: 46, damageType: "physical", targeting: "self", icon: "nova" }
  ],
  mage: [
    { key: "Q", cooldown: 6, range: 10.5, radius: 1.1, damage: 96, damageType: "magic", targeting: "direction", icon: "orb" },
    { key: "W", cooldown: 10, range: 8.5, radius: 3.2, damage: 26, damageType: "magic", targeting: "area", icon: "vines" },
    { key: "E", cooldown: 13, range: 6.2, radius: 0.8, damage: 0, damageType: "true", targeting: "direction", icon: "blink" },
    { key: "R", cooldown: 34, range: 8.2, radius: 4.4, damage: 42, damageType: "magic", targeting: "area", icon: "storm" }
  ],
  tank: [
    { key: "Q", cooldown: 8.5, range: 6, radius: 2, damage: 74, damageType: "physical", targeting: "direction", icon: "charge" },
    { key: "W", cooldown: 13, range: 0, radius: 0, damage: 0, damageType: "true", targeting: "self", icon: "shield" },
    { key: "E", cooldown: 12, range: 0, radius: 3.4, damage: 64, damageType: "magic", targeting: "self", icon: "quake" },
    { key: "R", cooldown: 32, range: 0, radius: 6, damage: 0, damageType: "true", targeting: "self", icon: "domain" }
  ]
};

const wuxiangAbilities: AbilityDefinition[] = [
  {
    key: "Q",
    name: "全域星裁",
    shortName: "星裁",
    description: "以黄金星令攻击全场敌对与中立单位，能量水晶不会受到影响。",
    cooldown: 8,
    range: 0,
    radius: 120,
    damage: 128,
    damageType: "magic",
    targeting: "self",
    icon: "nova"
  },
  {
    key: "W",
    name: "无相律场",
    shortName: "律场",
    description: "展开不可侵犯的星律场，震慑附近敌人并造成范围伤害。",
    cooldown: 10,
    range: 0,
    radius: 4.8,
    damage: 92,
    damageType: "magic",
    targeting: "self",
    icon: "domain"
  },
  {
    key: "E",
    name: "天隙折跃",
    shortName: "折跃",
    description: "向目标方向瞬移，并在起点和终点留下金色轨迹。",
    cooldown: 7,
    range: 8.2,
    radius: 0.8,
    damage: 0,
    damageType: "true",
    targeting: "direction",
    icon: "blink"
  },
  {
    key: "R",
    name: "终末天判",
    shortName: "天判",
    description: "降下全域裁决，对全场敌对与中立单位造成重击，不伤害能量水晶。",
    cooldown: 26,
    range: 0,
    radius: 140,
    damage: 260,
    damageType: "true",
    targeting: "self",
    icon: "storm"
  }
];

const skillNames: Record<HeroId, Array<[string, string, string]>> = {
  lingxiao: [
    ["星痕突斩", "突斩", "向目标方向突进，对路径末端附近敌人造成物理伤害。"],
    ["回天双环", "双环", "旋转双刃切割周围敌人，命中多个目标时产生明亮刀环。"],
    ["星步护势", "护势", "获得短暂护盾和移动速度，适合切入或撤退。"],
    ["曜刃临界", "临界", "进入星刃状态，强化普攻并释放飞行剑气。"]
  ],
  yanque: [
    ["赤羽掠影", "掠影", "化作赤羽向前穿刺，在落点撕开高温剑痕。"],
    ["焰羽回旋", "回旋", "以环形火羽扫击周围敌人。"],
    ["燃锋护息", "护息", "点燃护身羽纹，获得护盾与速度。"],
    ["赤霄开阵", "开阵", "进入赤羽爆发状态，普攻带出灼热剑气。"]
  ],
  moxuan: [
    ["墨影断潮", "断潮", "以墨色短刃突进，切开一条暗流伤口。"],
    ["双墨圆舞", "圆舞", "双刃旋舞，在近身范围留下墨痕。"],
    ["玄墨遁步", "遁步", "借墨影护体，短暂加速并获得护盾。"],
    ["墨星无界", "无界", "释放墨星刃势，强化普攻和飞刃。"]
  ],
  qingshuang: [
    ["青霜破阵", "破阵", "踏霜突进并在终点斩击敌人。"],
    ["霜轮双切", "双切", "挥出冰青刀轮，伤害周围敌人。"],
    ["寒锋守心", "守心", "凝霜成盾，提升移动能力。"],
    ["霜天星刃", "星刃", "进入霜刃姿态，普攻附带远程剑气。"]
  ],
  yunting: [
    ["云庭疾锋", "疾锋", "御风突进，斩击沿线敌人。"],
    ["流云回刃", "回刃", "云纹双刃环绕切割近身目标。"],
    ["风庭护步", "护步", "展开风盾并获得加速。"],
    ["天阙云斩", "云斩", "召来云阙星势，强化普攻。"]
  ],
  liyue: [
    ["森辉星弹", "星弹", "发射可碰撞的自然能量球，对首个敌人造成魔法伤害并减速。"],
    ["缠星藤阵", "藤阵", "在指定区域生成藤蔓，持续伤害并减速敌人。"],
    ["叶影折跃", "折跃", "向指定方向闪现一段距离，并留下青色残影。"],
    ["星藤风暴", "风暴", "召唤星藤风暴，持续对区域内敌人造成范围魔法伤害。"]
  ],
  chenyao: [
    ["晨曜光核", "光核", "发射晨曜能量弹，命中后灼亮目标。"],
    ["日冕花阵", "花阵", "在目标区域展开日冕花纹，持续造成魔法伤害。"],
    ["曦光折跃", "折跃", "化为光粒向前闪现。"],
    ["昼星洪流", "洪流", "召唤昼星洪流覆盖区域。"]
  ],
  suixu: [
    ["碎虚星砾", "星砾", "投射碎虚晶弹，命中后降低目标速度。"],
    ["虚藤裂区", "裂区", "在区域内生成虚藤裂纹，持续伤害敌人。"],
    ["虚步换相", "换相", "短距离换相闪现。"],
    ["碎界星雨", "星雨", "召唤碎界星雨持续轰击区域。"]
  ],
  baize: [
    ["白泽灵珠", "灵珠", "驱使灵珠飞行，命中首个敌人。"],
    ["灵纹禁域", "禁域", "布下灵纹区域，减速并伤害敌人。"],
    ["泽影挪移", "挪移", "借灵纹向前闪现一段距离。"],
    ["万象灵潮", "灵潮", "召唤灵潮风暴持续爆发。"]
  ],
  lanshu: [
    ["岚书青卷", "青卷", "抛出青卷能量弹，命中后爆出风纹。"],
    ["卷云藤域", "藤域", "在目标区域铺开卷云藤阵。"],
    ["书影瞬移", "瞬移", "以书页残影闪现。"],
    ["岚卷天瀑", "天瀑", "召来岚卷天瀑造成持续魔法伤害。"]
  ],
  zhongshan: [
    ["玄岳冲锋", "冲锋", "举盾冲撞，伤害并击退路径上的敌人。"],
    ["重甲星壁", "星壁", "生成厚重护盾并短暂降低受到的伤害。"],
    ["裂地回响", "回响", "震击地面，使周围敌人短暂眩晕并受到魔法伤害。"],
    ["镇域玄阵", "玄阵", "展开大型防护领域，范围内友方受到伤害降低。"]
  ],
  yeguang: [
    ["夜光壁冲", "壁冲", "举起夜光壁垒向前冲撞。"],
    ["星壳护幕", "护幕", "展开星壳护幕吸收伤害。"],
    ["沉夜震击", "震击", "震碎地面光纹，短暂眩晕周围敌人。"],
    ["夜幕守域", "守域", "展开夜幕防护领域，降低友方所受伤害。"]
  ],
  huanyin: [
    ["幻银盾袭", "盾袭", "以幻银重盾冲入战线并击退敌人。"],
    ["银纹甲阵", "甲阵", "生成银纹护盾和减伤。"],
    ["镜地回声", "回声", "震出镜面波纹，眩晕近身敌人。"],
    ["幻银穹顶", "穹顶", "展开大型穹顶，保护范围内友方。"]
  ],
  xuanji: [
    ["玄机星撞", "星撞", "以机关盾推进，撞散敌阵。"],
    ["机枢护壁", "护壁", "启动机枢护壁吸收伤害。"],
    ["地轴震鸣", "震鸣", "触发地轴震鸣，短暂控制附近敌人。"],
    ["天机护域", "护域", "布下天机护域，降低友方承伤。"]
  ],
  wuxiang: [
    ["全域星裁", "星裁", "以黄金星令攻击全场敌对与中立单位，能量水晶不会受到影响。"],
    ["无相律场", "律场", "展开不可侵犯的星律场，震慑附近敌人并造成范围伤害。"],
    ["天隙折跃", "折跃", "向目标方向瞬移，并在起点和终点留下金色轨迹。"],
    ["终末天判", "天判", "降下全域裁决，对全场敌对与中立单位造成重击，不伤害能量水晶。"]
  ],
  chixiao: [
    ["赤霄重撞", "重撞", "携赤霄巨盾向前撞击。"],
    ["赤晶壁垒", "壁垒", "赤晶装甲展开，获得护盾和减伤。"],
    ["熔地震波", "震波", "熔地震波震晕周围敌人。"],
    ["赤霄镇界", "镇界", "展开赤霄镇界领域，保护友方。"]
  ]
};

function buildAbilities(id: HeroId, archetype: HeroArchetype): AbilityDefinition[] {
  if (id === "wuxiang") return wuxiangAbilities;
  return abilityText[archetype].map((ability, index) => {
    const [name, shortName, description] = skillNames[id][index];
    return { ...ability, name, shortName, description };
  });
}

function hero(def: Omit<HeroDefinition, "abilities">): HeroDefinition {
  return { ...def, abilities: buildAbilities(def.id, def.archetype) };
}

export const heroes: HeroDefinition[] = [
  hero({
    id: "lingxiao",
    name: "曜刃·凌霄",
    title: "裂隙巡刃",
    role: "战士",
    archetype: "warrior",
    difficulty: 3,
    tagline: "以星火淬刃，于一息之间斩开战线。",
    lore: "凌霄曾是星门卫队的前锋，双刃融合古阵步法与量子驱动。",
    palette: { primary: "#62f1ff", secondary: "#245ecf", accent: "#f8d26b", metal: "#8da2c9" },
    stats: { maxHp: 980, attack: 76, defense: 36, speed: 5.6, attackRange: 2.35, attackCooldown: 0.82, regen: 4.2 },
    radar: { damage: 82, durability: 60, control: 45, mobility: 86, utility: 48 }
  }),
  hero({
    id: "yanque",
    name: "炎雀·朱羽",
    title: "赤羽先锋",
    role: "战士",
    archetype: "warrior",
    difficulty: 3,
    tagline: "用高温羽刃撕开敌方前排。",
    lore: "朱羽的羽刃由赤晶熔炉锻造，擅长突进和近身爆发。",
    palette: { primary: "#ff8b56", secondary: "#8a2330", accent: "#ffe08a", metal: "#9d6155" },
    stats: { maxHp: 940, attack: 82, defense: 32, speed: 5.75, attackRange: 2.25, attackCooldown: 0.86, regen: 4.0 },
    radar: { damage: 86, durability: 52, control: 42, mobility: 84, utility: 40 }
  }),
  hero({
    id: "moxuan",
    name: "墨玄·无咎",
    title: "暗潮双刃",
    role: "战士",
    archetype: "warrior",
    difficulty: 4,
    tagline: "墨影越深，刀锋越快。",
    lore: "无咎将古墨阵纹刻入双刃，在战场上留下无法预判的暗潮轨迹。",
    palette: { primary: "#9b8cff", secondary: "#20213f", accent: "#efce83", metal: "#797991" },
    stats: { maxHp: 900, attack: 86, defense: 30, speed: 5.95, attackRange: 2.2, attackCooldown: 0.78, regen: 3.8 },
    radar: { damage: 88, durability: 46, control: 38, mobility: 92, utility: 36 }
  }),
  hero({
    id: "qingshuang",
    name: "青霜·镜寒",
    title: "霜刃行者",
    role: "战士",
    archetype: "warrior",
    difficulty: 3,
    tagline: "踏霜入阵，出刃无声。",
    lore: "镜寒以青霜晶驱动轻甲，擅长在边线切入并快速脱离。",
    palette: { primary: "#a7f6ff", secondary: "#2f6c88", accent: "#f6f0b2", metal: "#97adbd" },
    stats: { maxHp: 1010, attack: 72, defense: 40, speed: 5.45, attackRange: 2.4, attackCooldown: 0.9, regen: 4.6 },
    radar: { damage: 74, durability: 64, control: 50, mobility: 78, utility: 45 }
  }),
  hero({
    id: "yunting",
    name: "云庭·白衡",
    title: "风庭剑使",
    role: "战士",
    archetype: "warrior",
    difficulty: 2,
    tagline: "云纹所至，战线随风改向。",
    lore: "白衡出身云庭铸剑台，剑式稳健，能在推进战中持续压迫。",
    palette: { primary: "#d9f7ff", secondary: "#4d78a8", accent: "#ffd98c", metal: "#b7c6d8" },
    stats: { maxHp: 1040, attack: 70, defense: 42, speed: 5.35, attackRange: 2.45, attackCooldown: 0.92, regen: 4.9 },
    radar: { damage: 70, durability: 66, control: 46, mobility: 70, utility: 56 }
  }),
  hero({
    id: "liyue",
    name: "森语·璃月",
    title: "星藤咏者",
    role: "法师",
    archetype: "mage",
    difficulty: 4,
    tagline: "让星核听见森林的低语。",
    lore: "璃月守护裂隙边缘的浮生林，以自然晶核梳理失控能流。",
    palette: { primary: "#5dffc7", secondary: "#2fa37d", accent: "#d6f58a", metal: "#9adfc8" },
    stats: { maxHp: 760, attack: 58, defense: 22, speed: 5.25, attackRange: 7.4, attackCooldown: 1.02, regen: 3.4 },
    radar: { damage: 88, durability: 38, control: 78, mobility: 72, utility: 64 }
  }),
  hero({
    id: "chenyao",
    name: "晨曜·曦和",
    title: "日冕术士",
    role: "法师",
    archetype: "mage",
    difficulty: 3,
    tagline: "她把晨光压缩成可爆裂的星弹。",
    lore: "曦和研究日冕裂变术，擅长远距离消耗和范围压制。",
    palette: { primary: "#ffe37a", secondary: "#d98235", accent: "#fff4ba", metal: "#c99b62" },
    stats: { maxHp: 720, attack: 62, defense: 20, speed: 5.2, attackRange: 7.6, attackCooldown: 1.0, regen: 3.1 },
    radar: { damage: 92, durability: 34, control: 62, mobility: 68, utility: 52 }
  }),
  hero({
    id: "suixu",
    name: "碎虚·澜生",
    title: "虚晶解构师",
    role: "法师",
    archetype: "mage",
    difficulty: 5,
    tagline: "以碎晶重写敌人的位置和速度。",
    lore: "澜生能解构裂隙虚晶，使目标在星砾风暴中寸步难行。",
    palette: { primary: "#c08cff", secondary: "#513a88", accent: "#9df7ff", metal: "#9382b7" },
    stats: { maxHp: 700, attack: 64, defense: 18, speed: 5.35, attackRange: 7.8, attackCooldown: 0.98, regen: 3.0 },
    radar: { damage: 90, durability: 30, control: 86, mobility: 70, utility: 58 }
  }),
  hero({
    id: "baize",
    name: "白泽·灵栖",
    title: "灵纹策士",
    role: "法师",
    archetype: "mage",
    difficulty: 3,
    tagline: "灵纹落地，敌阵便被重新排序。",
    lore: "灵栖以白泽古卷牵引星核灵纹，擅长控制地形。",
    palette: { primary: "#f4fff1", secondary: "#78a783", accent: "#c7f28c", metal: "#d2dbc7" },
    stats: { maxHp: 780, attack: 54, defense: 24, speed: 5.15, attackRange: 7.2, attackCooldown: 1.08, regen: 3.6 },
    radar: { damage: 76, durability: 40, control: 82, mobility: 62, utility: 76 }
  }),
  hero({
    id: "lanshu",
    name: "岚书·青简",
    title: "风卷学士",
    role: "法师",
    archetype: "mage",
    difficulty: 2,
    tagline: "翻开青卷，风暴便开始书写。",
    lore: "青简将风阵藏在书页中，能够稳定地制造区域压力。",
    palette: { primary: "#8ff2da", secondary: "#386c72", accent: "#f1e18a", metal: "#91b8af" },
    stats: { maxHp: 800, attack: 52, defense: 26, speed: 5.0, attackRange: 7.1, attackCooldown: 1.1, regen: 3.7 },
    radar: { damage: 72, durability: 42, control: 72, mobility: 58, utility: 84 }
  }),
  hero({
    id: "zhongshan",
    name: "玄甲·重山",
    title: "玄阵壁垒",
    role: "坦克",
    archetype: "tank",
    difficulty: 2,
    tagline: "一面盾，一座山，一道不退的星门。",
    lore: "重山的玄甲由古代镇星碑重铸而成，盾面展开时整片战线随之稳定。",
    palette: { primary: "#8bd4ff", secondary: "#51606f", accent: "#ffe29a", metal: "#374454" },
    stats: { maxHp: 1320, attack: 62, defense: 58, speed: 4.75, attackRange: 2.25, attackCooldown: 1.03, regen: 6.2 },
    radar: { damage: 50, durability: 92, control: 72, mobility: 42, utility: 76 }
  }),
  hero({
    id: "yeguang",
    name: "夜光·玄灯",
    title: "夜幕守卫",
    role: "坦克",
    archetype: "tank",
    difficulty: 2,
    tagline: "夜色越深，盾墙越亮。",
    lore: "玄灯以夜光晶石驱动重盾，在黑暗中为队友点亮安全边界。",
    palette: { primary: "#7da7ff", secondary: "#26305f", accent: "#d9c776", metal: "#5c647e" },
    stats: { maxHp: 1280, attack: 58, defense: 62, speed: 4.82, attackRange: 2.2, attackCooldown: 1.08, regen: 6.0 },
    radar: { damage: 46, durability: 90, control: 76, mobility: 44, utility: 78 }
  }),
  hero({
    id: "huanyin",
    name: "幻银·镜吾",
    title: "镜盾执掌",
    role: "坦克",
    archetype: "tank",
    difficulty: 3,
    tagline: "镜盾映出敌人的冲动，也挡下它。",
    lore: "镜吾的幻银盾能折射能量冲击，在团战中制造稳定前排。",
    palette: { primary: "#dbe8ff", secondary: "#67758f", accent: "#b3f5ff", metal: "#aeb8c8" },
    stats: { maxHp: 1240, attack: 60, defense: 56, speed: 4.95, attackRange: 2.25, attackCooldown: 1.02, regen: 5.8 },
    radar: { damage: 52, durability: 84, control: 70, mobility: 50, utility: 72 }
  }),
  hero({
    id: "xuanji",
    name: "玄机·天枢",
    title: "机关镇守",
    role: "坦克",
    archetype: "tank",
    difficulty: 4,
    tagline: "一枚机枢，锁住半片战场。",
    lore: "天枢把古机关和星核驱动结合，擅长控制敌方阵型。",
    palette: { primary: "#8ef0ff", secondary: "#37485a", accent: "#ffd06f", metal: "#4f6574" },
    stats: { maxHp: 1180, attack: 64, defense: 54, speed: 5.0, attackRange: 2.3, attackCooldown: 1.0, regen: 5.6 },
    radar: { damage: 56, durability: 78, control: 86, mobility: 52, utility: 70 }
  }),
  hero({
    id: "chixiao",
    name: "赤霄·岩铠",
    title: "熔岩壁垒",
    role: "坦克",
    archetype: "tank",
    difficulty: 2,
    tagline: "赤晶熔铠让他像移动的城墙。",
    lore: "岩铠由赤霄矿脉改造重甲，在正面推进中拥有极高承伤。",
    palette: { primary: "#ff745d", secondary: "#68343a", accent: "#ffd184", metal: "#775d58" },
    stats: { maxHp: 1400, attack: 56, defense: 66, speed: 4.55, attackRange: 2.15, attackCooldown: 1.12, regen: 6.8 },
    radar: { damage: 42, durability: 96, control: 68, mobility: 36, utility: 74 }
  }),
  hero({
    id: "wuxiang",
    name: "无相·天裁",
    title: "黄金天判",
    role: "法师",
    archetype: "mage",
    difficulty: 1,
    tagline: "以黄金星律俯瞰战场，裁定所有敌对存在。",
    lore: "天裁并非凡人守望者，而是星核自我防卫协议凝成的无相化身。它不会被普通伤害击倒，所有裁决也会绕开双方能量水晶。",
    palette: { primary: "#ffd76a", secondary: "#4a3720", accent: "#fff3b0", metal: "#caa85e" },
    stats: { maxHp: 9999, attack: 188, defense: 999, speed: 6.2, attackRange: 8.8, attackCooldown: 0.68, regen: 999 },
    radar: { damage: 100, durability: 100, control: 86, mobility: 92, utility: 100 }
  })
];

export const heroById = Object.fromEntries(heroes.map((entry) => [entry.id, entry])) as Record<HeroId, HeroDefinition>;
