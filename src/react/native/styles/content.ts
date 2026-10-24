import { StyleSheet } from "react-native";

export const contentStyles = StyleSheet.create({
  completeScroll: {
    width: "100%",
    backgroundColor: "#fafaf9",
  },
  nativeBookScroll: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fafaf9",
  },
  nativeBookOuterScrollContent: {
    flexGrow: 0,
  },
  nativeFullScreenBookScrollContent: {
    flexGrow: 1,
  },
  nativeFullScreenBookScrollContentCentered: {
    justifyContent: "center",
  },
  completeScrollContent: {
    padding: 10,
    paddingBottom: 104,
    gap: 10,
  },
  completeScrollContentCompact: {
    paddingBottom: 82,
  },
  nativeBookScrollContent: {
    padding: 10,
    paddingBottom: 104,
  },
  nativeBookScrollContentCompact: {
    paddingBottom: 82,
  },
  nativeBookPages: {
    width: "100%",
    flexDirection: "column",
    gap: 10,
  },
  nativeBookPagesDouble: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  completeVerseBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    backgroundColor: "#fff",
    paddingVertical: 30,
    paddingHorizontal: 28,
    paddingRight: 58,
    gap: 8,
    position: "relative",
    overflow: "hidden",
  },
  completeVerseOrnamentInner: {
    position: "absolute",
    top: 17,
    right: 17,
    bottom: 17,
    left: 17,
    borderWidth: 2,
    borderStyle: "dotted",
    borderColor: "#ec4899",
    borderRadius: 5,
    opacity: 0.78,
  },
  completeVerseBlockActive: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
    shadowColor: "#c2410c",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  completeVerseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  completeVerseGroup: {
    color: "#78716c",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },
  completeVerseLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  completeVerseText: {
    color: "#111827",
    textAlign: "center",
    flexShrink: 1,
    width: "100%",
  },
});
