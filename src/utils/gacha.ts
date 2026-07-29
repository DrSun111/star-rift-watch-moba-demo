import { gachaCards, type GachaCard } from "../data/gacha";

export function drawGachaCard(random = Math.random): GachaCard {
  const totalWeight = gachaCards.reduce((sum, card) => sum + card.weight, 0);
  let cursor = random() * totalWeight;
  for (const card of gachaCards) {
    cursor -= card.weight;
    if (cursor <= 0) return card;
  }
  return gachaCards[gachaCards.length - 1];
}

export function drawGachaCards(count: number): GachaCard[] {
  return Array.from({ length: Math.max(1, count) }, () => drawGachaCard());
}
