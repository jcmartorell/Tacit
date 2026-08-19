/** Hugeicons icon node: [tag, attrs] */
type IconNode = readonly [string, Record<string, string | number>];

function attrName(key: string): string {
  if (key === "strokeLinecap") return "stroke-linecap";
  if (key === "strokeLinejoin") return "stroke-linejoin";
  if (key === "strokeWidth") return "stroke-width";
  if (key === "fillRule") return "fill-rule";
  if (key === "clipRule") return "clip-rule";
  return key.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
}

/** Serialize a Hugeicons icon into an SVG data URL for canvas / <img>. */
export function hugeiconToDataUrl(
  icon: readonly IconNode[],
  color: string,
  strokeWidth = 1.75,
): string {
  const parts = icon
    .map(([tag, attrs]) => {
      const bits: string[] = [];
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "key") continue;
        let val = v;
        if (k === "stroke" && v === "currentColor") val = color;
        if (k === "fill" && v === "currentColor") val = color;
        if (k === "strokeWidth") val = strokeWidth;
        bits.push(`${attrName(k)}="${val}"`);
      }
      if (!("fill" in attrs)) bits.push('fill="none"');
      return `<${tag} ${bits.join(" ")}/>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">${parts}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
