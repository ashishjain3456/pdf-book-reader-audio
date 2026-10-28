export function getActiveBookSpreadMode({
  isFullScreen,
  requestedMode,
  allowDoubleSpread,
}: {
  isFullScreen: boolean;
  requestedMode: "single" | "double";
  allowDoubleSpread: boolean;
}): "single" | "double" {
  return isFullScreen && allowDoubleSpread && requestedMode === "double"
    ? "double"
    : "single";
}
