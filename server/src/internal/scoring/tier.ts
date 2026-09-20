export function Tier(ovr: number): string {
  switch (true) {
    case ovr >= 95:
      return "Legendary Developer";
    case ovr >= 85:
      return "Elite Developer";
    case ovr >= 75:
      return "Advanced Developer";
    case ovr >= 65:
      return "Solid Developer";
    case ovr >= 55:
      return "Developing Developer";
    default:
      return "Rookie Developer";
  }
}