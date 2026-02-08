export type SourceType = "weekly_strategy" | "stock_strategy" | "trading_note" | "external_review";

export function getSourceUrl(sourceType: SourceType, sourceId: number): string {
  switch (sourceType) {
    case "weekly_strategy":
      return `/reports/${sourceId}`;
    case "stock_strategy":
      return `/stock-strategies/${sourceId}`;
    case "trading_note":
      return `/me#note-${sourceId}`;
    case "external_review":
      return `/external-reviews/${sourceId}`;
    default:
      return "/";
  }
}
