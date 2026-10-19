import type { ReactNode } from "react";
import { Text } from "react-native";

type CompleteVerseTextStyle = Record<string, unknown>;
type NativeTextStyle = Record<string, unknown>;

export const COMPLETE_VERSE_STYLE_MAP: Record<string, CompleteVerseTextStyle> = {
  classic: { color: "#111827", fontWeight: "800" },
  aarti: { color: "#9a3412", fontWeight: "800" },
  sutra: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  soft: { color: "#92400e", fontStyle: "italic", fontWeight: "800" },
  shastra: { color: "#0f172a", fontWeight: "900" },
  midnight: { color: "#1d4ed8", fontWeight: "900" },
  maroon: { color: "#7f1d1d", fontWeight: "900" },
  forest: { color: "#166534", fontWeight: "800" },
  indigo: { color: "#3730a3", fontWeight: "800" },
  graphite: { color: "#3f3f46", fontWeight: "800" },
};

export const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const stripHtmlText = (value: string) =>
  String(value || "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const decodeHtmlText = (value: string) =>
  String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const getHtmlAttribute = (tag: string, name: string) => {
  const pattern = new RegExp(
    `${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = tag.match(pattern);
  return match?.[1] || match?.[2] || match?.[3] || "";
};

const parseNativeInlineStyle = (
  tagName: string,
  tag: string,
): NativeTextStyle => {
  const style: NativeTextStyle = {};
  if (tagName === "b" || tagName === "strong") {
    style.fontWeight = "900";
  }
  if (tagName === "i" || tagName === "em") {
    style.fontStyle = "italic";
  }
  if (tagName === "u") {
    style.textDecorationLine = "underline";
  }
  if (tagName === "s" || tagName === "strike" || tagName === "del") {
    style.textDecorationLine = "line-through";
  }

  const fontColor = getHtmlAttribute(tag, "color");
  if (tagName === "font" && fontColor) {
    style.color = fontColor;
  }

  const inlineStyle = getHtmlAttribute(tag, "style");
  for (const declaration of inlineStyle.split(";")) {
    const [rawProperty, ...rawValueParts] = declaration.split(":");
    const property = rawProperty?.trim().toLowerCase();
    const value = rawValueParts.join(":").trim();
    if (!property || !value) continue;
    if (property === "color") {
      style.color = value;
    } else if (property === "font-weight") {
      const numericWeight = Number(value);
      style.fontWeight = Number.isFinite(numericWeight)
        ? String(Math.max(600, Math.min(900, numericWeight)))
        : value.includes("bold")
          ? "900"
          : style.fontWeight;
    } else if (property === "font-style" && value.includes("italic")) {
      style.fontStyle = "italic";
    } else if (property === "text-decoration") {
      if (value.includes("underline")) {
        style.textDecorationLine = "underline";
      } else if (value.includes("line-through")) {
        style.textDecorationLine = "line-through";
      }
    }
  }

  return style;
};

export const renderNativeRichText = (html: string, keyPrefix: string) => {
  const nodes: ReactNode[] = [];
  const styleStack: NativeTextStyle[] = [{}];
  let key = 0;

  const currentStyle = () =>
    Object.assign({}, ...styleStack) as NativeTextStyle;
  const pushText = (value: string) => {
    const decoded = decodeHtmlText(value);
    if (!decoded) return;
    nodes.push(
      <Text key={`${keyPrefix}-${key++}`} style={currentStyle()}>
        {decoded}
      </Text>,
    );
  };
  const pushBreak = (count = 1) => {
    pushText("\n".repeat(count));
  };

  const tokens = String(html || "").match(/<[^>]+>|[^<]+/g) || [];
  for (const token of tokens) {
    if (!token.startsWith("<")) {
      pushText(token);
      continue;
    }

    const isClosingTag = /^<\s*\//.test(token);
    const tagName = (
      token
        .replace(/^<\s*\/?\s*/, "")
        .replace(/\/?\s*>$/, "")
        .trim()
        .split(/\s+/)[0] || ""
    ).toLowerCase();

    if (!tagName) continue;
    if (tagName === "br") {
      pushBreak();
      continue;
    }
    if (isClosingTag) {
      if (["p", "div", "li"].includes(tagName)) {
        pushBreak(tagName === "li" ? 1 : 2);
      }
      if (
        [
          "b",
          "strong",
          "i",
          "em",
          "u",
          "s",
          "strike",
          "del",
          "span",
          "font",
        ].includes(tagName) &&
        styleStack.length > 1
      ) {
        styleStack.pop();
      }
      continue;
    }
    if (tagName === "li") {
      pushText("• ");
      continue;
    }
    if (tagName === "p" || tagName === "div") {
      continue;
    }
    if (
      [
        "b",
        "strong",
        "i",
        "em",
        "u",
        "s",
        "strike",
        "del",
        "span",
        "font",
      ].includes(tagName)
    ) {
      styleStack.push(parseNativeInlineStyle(tagName, token));
    }
  }

  return nodes;
};
