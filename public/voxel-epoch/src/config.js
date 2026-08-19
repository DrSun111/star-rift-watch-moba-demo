export const GAME = {
  chunkSize: 16,
  renderDistance: 3,
  blockSize: 1,
  seaLevel: 3,
  worldLimit: 360,
  gravity: 24,
  jumpVelocity: 8.2,
  walkSpeed: 4.8,
  sprintSpeed: 7.2,
  rideSpeed: 9.0,
  interactionRange: 4.4,
  buildRange: 6.0,
  playerHeight: 1.72,
  autosaveSeconds: 7,
};

export const BIOMES = {
  forest: {
    name: '森林', center:[0,0], radius:165,
    top:'grass', under:'dirt', accent:'#5a9a65', sky:'#90cbd7', fog:'#a8d0cc',
    task:'采集 12 木材与 8 石料，制作石剑。',
  },
  snow: {
    name:'雪地', center:[-180,-175], radius:150,
    top:'snow', under:'stone', accent:'#dcecf4', sky:'#b9d7ec', fog:'#d7e9ef',
    task:'制作雪地皮衣，避免持续失温。',
  },
  ocean: {
    name:'海洋', center:[-225,110], radius:165,
    top:'sand', under:'stone', accent:'#347fac', sky:'#89bfd4', fog:'#8dc1d0',
    task:'打造小船或潜艇，安全进入深海。',
  },
  tropical: {
    name:'热带', center:[-45,235], radius:165,
    top:'tropicalGrass', under:'dirt', accent:'#419866', sky:'#92d4ad', fog:'#a8d4b4',
    task:'打造热带长矛，击败毒藤兽。',
  },
  desert: {
    name:'沙漠', center:[225,-20], radius:165,
    top:'sand', under:'sandstone', accent:'#d2b66d', sky:'#dec98f', fog:'#d8c79c',
    task:'打造沙漠猎弩，击败沙蝎。',
  },
  wasteland: {
    name:'荒野', center:[195,205], radius:165,
    top:'dryGrass', under:'stone', accent:'#8f6d48', sky:'#b9a17e', fog:'#b4a487',
    task:'建造水井，解决持续缺水。',
  },
};

export const RESOURCES = {
  wood:{name:'木材',icon:'🪵'}, stone:{name:'石料',icon:'🪨'}, soil:{name:'土方',icon:'🟫'}, sand:{name:'砂料',icon:'🟨'}, fiber:{name:'纤维',icon:'🌿'},
  hide:{name:'兽皮',icon:'🧶'}, iron:{name:'铁矿',icon:'⛓️'}, crystal:{name:'晶核',icon:'💎'},
  obsidian:{name:'黑曜石',icon:'⬛'}, water:{name:'净水',icon:'💧'}, fruit:{name:'灵果',icon:'🍈'},
  scale:{name:'鳞片',icon:'🔷'},
};

export const BLOCKS = {
  grass:{name:'草方块',icon:'🟩',resource:'soil',buildResource:'soil',buildCost:1},
  dirt:{name:'泥土',icon:'🟫',resource:'soil',buildResource:'soil',buildCost:1},
  stone:{name:'石方块',icon:'⬜',resource:'stone',buildResource:'stone',buildCost:1},
  sand:{name:'沙方块',icon:'🟨',resource:'sand',buildResource:'sand',buildCost:1},
  sandstone:{name:'砂岩',icon:'🟧',resource:'sand',buildResource:'sand',buildCost:1},
  snow:{name:'雪方块',icon:'⬜',resource:'fiber',buildResource:'fiber',buildCost:1},
  tropicalGrass:{name:'热带草方块',icon:'🟩',resource:'soil',buildResource:'soil',buildCost:1},
  dryGrass:{name:'荒草方块',icon:'🟫',resource:'soil',buildResource:'soil',buildCost:1},
  wood:{name:'木方块',icon:'🪵',resource:'wood',buildResource:'wood',buildCost:1},
  leaves:{name:'树叶',icon:'🌿',resource:'fiber',buildResource:'fiber',buildCost:1},
  cactus:{name:'仙人掌',icon:'🌵',resource:'fiber',buildResource:'fiber',buildCost:1},
  ironOre:{name:'铁矿石',icon:'⛓️',resource:'iron',buildResource:'iron',buildCost:1},
  crystalOre:{name:'晶矿',icon:'💎',resource:'crystal',buildResource:'crystal',buildCost:1},
  obsidian:{name:'黑曜石',icon:'🟪',resource:'obsidian',buildResource:'obsidian',buildCost:1},
  glow:{name:'星辉方块',icon:'✨',resource:'crystal',buildResource:'crystal',buildCost:1},
  ice:{name:'寒晶方块',icon:'🧊',resource:'crystal',buildResource:'crystal',buildCost:2},
  water:{name:'水',icon:'💧',resource:'water',buildResource:null,buildCost:0},
  fruit:{name:'树果',icon:'🍎',resource:'fruit',buildResource:null,buildCost:0},
  basalt:{name:'暗域玄武岩',icon:'⬛',resource:'obsidian',buildResource:'obsidian',buildCost:1},
  ember:{name:'熔火晶块',icon:'🔥',resource:'crystal',buildResource:'crystal',buildCost:1},
};

export const HOTBAR = ['grass','wood','stone','sand','glow','obsidian','ice'];

export const RECIPES = [
  {id:'stoneSword',icon:'🗡️',name:'石剑',cost:{wood:2,stone:5},desc:'近战伤害 16',gear:['weapon','石剑']},
  {id:'ironSword',icon:'⚔️',name:'铁剑',cost:{wood:2,iron:7},desc:'近战伤害 26',gear:['weapon','铁剑']},
  {id:'glowSword',icon:'✦',name:'星辉剑',cost:{iron:10,crystal:8,scale:3},desc:'最高级发光武器，伤害 45',gear:['weapon','星辉剑'],flag:'luminous'},
  {id:'leather',icon:'🧥',name:'雪地皮衣',cost:{hide:8,fiber:4},desc:'雪地不再快速失温',gear:['armor','雪地皮衣'],flag:'leather'},
  {id:'armor',icon:'🛡️',name:'晶铁战甲',cost:{iron:12,crystal:5},desc:'高级发光护甲',gear:['armor','晶铁战甲'],flag:'luminous'},
  {id:'boat',icon:'⛵',name:'探索小船',cost:{wood:12,fiber:6},desc:'进入海洋不再持续受伤',gear:['vehicle','小船'],flag:'boat'},
  {id:'sub',icon:'🛥️',name:'深潜潜艇',cost:{iron:18,crystal:7,wood:8},desc:'海洋移动加速，可深入海域',gear:['vehicle','潜艇'],flag:'sub'},
  {id:'well',icon:'⛲',name:'荒野水井',cost:{stone:14,wood:6,iron:3},desc:'完成荒野供水任务',flag:'well'},
  {id:'desertW',icon:'🏹',name:'沙漠猎弩',cost:{wood:7,iron:5,fiber:4},desc:'对沙漠怪物伤害翻倍',gear:['weapon','沙漠猎弩'],flag:'desertWeapon'},
  {id:'tropW',icon:'🔱',name:'热带长矛',cost:{wood:6,iron:6,scale:2},desc:'对热带怪物伤害翻倍',gear:['weapon','热带长矛'],flag:'tropicalWeapon'},
  {id:'portal',icon:'🌀',name:'异世界传送核心',cost:{obsidian:14,crystal:10,iron:4},desc:'激活森林祭坛的异界传送门',flag:'portal'},
];

export const PETS = [
  {name:'苔团',rank:'C',kind:'moss',variant:'sprout',mount:null,power:6,color:'#63c780'},
  {name:'露芽球',rank:'C',kind:'moss',variant:'flower',mount:null,power:7,color:'#77d38b'},
  {name:'夜萤团',rank:'C',kind:'moss',variant:'glow',mount:null,power:7,color:'#68a6a0'},
  {name:'岩角兽',rank:'B',kind:'horn',variant:'stone',mount:'run',power:10,color:'#9d805d'},
  {name:'晶角鹿灵',rank:'B',kind:'horn',variant:'crystal',mount:'run',power:11,color:'#82b5ae'},
  {name:'玄甲幼兽',rank:'B',kind:'horn',variant:'armor',mount:'run',power:12,color:'#657281'},
  {name:'砂翼蜥',rank:'A',kind:'lizard',variant:'sand',mount:'run',power:14,color:'#cf9b55'},
  {name:'赤焰棘蜥',rank:'A',kind:'lizard',variant:'ember',mount:'run',power:15,color:'#c96445'},
  {name:'幽夜狐',rank:'A',kind:'wolf',variant:'fox',mount:'run',power:16,color:'#a86c54'},
  {name:'霜牙',rank:'S',kind:'wolf',variant:'frost',mount:'run',power:19,color:'#c9e4ef'},
  {name:'雷影豹',rank:'S',kind:'wolf',variant:'panther',mount:'run',power:20,color:'#535b76'},
  {name:'潮灵',rank:'S',kind:'tide',variant:'wave',mount:'swim',power:18,color:'#5ab7dc'},
  {name:'珊瑚海灵',rank:'S',kind:'tide',variant:'coral',mount:'swim',power:20,color:'#69c4c8'},
  {name:'雷羽',rank:'SSS',kind:'bird',variant:'storm',mount:'fly',power:28,color:'#9d80f0'},
  {name:'月辉蝶灵',rank:'SSS',kind:'bird',variant:'moth',mount:'fly',power:29,color:'#c58be7'},
  {name:'苍穹狮鹫',rank:'SSS',kind:'bird',variant:'gryphon',mount:'fly',power:31,color:'#c5a865'},
  {name:'星渊龙灵',rank:'SSSS',kind:'dragon',variant:'astral',mount:'fly',power:42,color:'#e6c56d'},
  {name:'圣辉麒麟',rank:'SSSS',kind:'dragon',variant:'qilin',mount:'fly',power:45,color:'#a9e1d2'},
  {name:'虚空凤凰',rank:'SSSS',kind:'bird',variant:'phoenix',mount:'fly',power:46,color:'#e68067'},
];

export const PET_RANK_WEIGHTS = [['C',40],['B',28],['A',18],['S',9],['SSS',4],['SSSS',1]];

export const DEFAULT_STATE = {
  version:6,
  dimension:'overworld',
  x:0,z:0,y:10,
  hp:100,temp:100,water:100,
  view:'third',
  lookYaw:0,lookPitch:-.08,
  selectedBlock:0,
  resources:{wood:4,stone:2,soil:6,sand:0,fiber:2,hide:0,iron:0,crystal:0,obsidian:0,water:2,fruit:3,scale:0},
  gear:{weapon:'木剑',armor:'布衣',vehicle:'无',luminous:false,leather:false,boat:false,sub:false,well:false,desertWeapon:false,tropicalWeapon:false,portal:false},
  unlocked:{forest:true,snow:false,ocean:false,tropical:false,desert:false,wasteland:false},
  completed:{forest:false,snow:false,ocean:false,tropical:false,desert:false,wasteland:false,dragon:false},
  pets:[],activePets:[],deployedPetIds:[],mountedPet:null,
  overrides:{},
  kills:{},
  dragonHP:260,
};
