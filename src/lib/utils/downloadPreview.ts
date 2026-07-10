async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadSVGAsPNG(
  svgElement: SVGSVGElement,
  filename: string,
  width = 800,
  height = 1050,
) {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  const images = clone.querySelectorAll("image");
  for (const img of images) {
    const href = img.getAttribute("href") || img.getAttribute("xlink:href");
    if (href && href.startsWith("http")) {
      try {
        const base64 = await urlToBase64(href);
        img.setAttribute("href", base64);
        img.removeAttribute("xlink:href");
      } catch (e) {
        console.error("Error convirtiendo imagen:", e);
      }
    }
  }

  const viewBox =
    svgElement.getAttribute("viewBox") ??
    `0 0 ${svgElement.clientWidth} ${svgElement.clientHeight}`;
  clone.setAttribute("viewBox", viewBox);
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          a.click();
          URL.revokeObjectURL(a.href);
        }
        resolve();
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });
}
