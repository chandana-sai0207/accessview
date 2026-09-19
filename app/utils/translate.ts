export async function translateText(
  message: string,
  from: string,
  to: string
): Promise<string> {
  const cleanText = message.trim();

  if (!cleanText) {
    return "";
  }

  if (from === to) {
    return cleanText;
  }

  // Try Google's public translate endpoint first (real MT, no key needed)
  try {
    const googleUrl =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(cleanText)}`;

    const response = await fetch(googleUrl);

    if (response.ok) {
      const data = await response.json();
      const translated = data?.[0]
        ?.map((chunk: any) => chunk?.[0])
        .filter(Boolean)
        .join("");

      if (typeof translated === "string" && translated.trim()) {
        return translated.trim();
      }
    }
  } catch (googleError) {
    console.error("Google translate error:", googleError);
  }

  // Fallback: MyMemory
  try {
    const limitedText =
      cleanText.length > 450 ? cleanText.slice(0, 450) : cleanText;

    const url =
      `https://api.mymemory.translated.net/get` +
      `?q=${encodeURIComponent(limitedText)}` +
      `&langpair=${encodeURIComponent(`${from}|${to}`)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Translation request failed: ${response.status}`);
    }

    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    const matchQuality = data?.responseData?.match ?? 0;

    const looksBad =
      typeof translated !== "string" ||
      !translated.trim() ||
      matchQuality < 0.6 ||
      translated.toUpperCase().includes("MYMEMORY WARNING");

    if (looksBad) {
      throw new Error("Low-quality or missing translation.");
    }

    return translated.trim();
  } catch (translationError) {
    console.error("Translation error:", translationError);
    return "Translation unavailable";
  }
}