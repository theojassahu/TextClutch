import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ReplyItem {
  tag: string;
  text: string;
}

interface ApiResponsePayload {
  detected_context: string;
  detected_language: string;
  replies: ReplyItem[];
}

function getPersonaDirective(persona: string): string {
  switch ((persona || "").toLowerCase()) {
    case "cold":
      return `MANDATORY PERSONA - COLD & SAVAGE:
- Unbothered, aloof, witty, dry comeback, zero desperation.
- Strictly keep emotional detachment and high frame.
- Set unshakeable boundaries with sharp wit. Never double-text energy.`;
    case "caring":
      return `MANDATORY PERSONA - CARING & WHOLESOME:
- Empathetic, warm, thoughtful, genuine, emotionally mature.
- Offer reassuring perspective and authentic support without sounding clinical.
- Make the recipient feel deeply heard, valued, and safe.`;
    case "playful":
      return `MANDATORY PERSONA - PLAYFUL BANTER:
- Sarcastic, teasing push-pull dynamic, lighthearted roasts.
- High fun factor, witty hooks, playful arrogance or banter.
- Never take things too seriously; turn tension into a playful game.`;
    case "tactical":
      return `MANDATORY PERSONA - TACTICAL & STRATEGIC:
- Subtle frame control, low emotional investment, intrigue-building.
- Leave them guessing, curious, and eager to know more.
- Masterful pacing, non-reactive, keeping conversational leverage.`;
    case "rizz":
    default:
      return `MANDATORY PERSONA - RIZZ & CHARM:
- Smooth, charismatic, flirty, magnetic, self-assured, bold.
- Spark attraction and playful tension without being creepy or try-hard.
- Confident eye-level energy with effortless charm.`;
  }
}

function getLanguageDirective(language: string): string {
  switch ((language || "").toLowerCase()) {
    case "hinglish":
      return `CRITICAL LANGUAGE REQUIREMENT - HINGLISH:
- You MUST write all 3 replies strictly in conversational Hinglish (Latin-script Hindi + English blend).
- Use natural Indian texting vernacular and slang (e.g., "thoda chill kar", "scene sorted hai", "bata na", "kya scene hai", "load mat le", "sahi hai", "chal theek hai").
- Do NOT output pure English or Devanagari script. Keep it authentic to modern Indian texting slang.`;
    case "hindi":
      return `CRITICAL LANGUAGE REQUIREMENT - HINDI:
- You MUST write all 3 replies strictly in natural, conversational Hindi using the DEVANAGARI script (e.g., "शांत रहो, सब ठीक हो जाएगा।").
- Must feel culturally natural, emotionally accurate, and grammatically authentic.`;
    case "english":
      return `CRITICAL LANGUAGE REQUIREMENT - ENGLISH:
- You MUST write all 3 replies strictly in modern, natural conversational English.
- Use natural Gen-Z / Millennial texting vernacular (lowercase vibe, witty, concise, zero boomer phrasing).`;
    case "auto":
    default:
      return `LANGUAGE REQUIREMENT - AUTO-DETECT:
- Carefully analyze the conversation log/screenshot to detect the participants' actual texting language and dialect (English, Hinglish, or Hindi).
- Match that exact detected language and slang for all 3 generated replies.
- If the chat is in Hinglish (e.g. "kya kar raha hai"), reply strictly in Hinglish!
- If the chat is in Hindi Devanagari, reply in Hindi Devanagari!
- If the chat is in English, reply in English!`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let persona = "rizz";
    let language = "auto";
    let text = "";
    let extraContext = "";
    let images: { mimeType: string; base64: string }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      persona = (formData.get("persona") as string) || "rizz";
      language = (formData.get("language") as string) || "auto";
      text =
        (formData.get("text") as string) ||
        (formData.get("message") as string) ||
        "";
      extraContext = (formData.get("extraContext") as string) || "";

      // Extract image files from form data
      const files = formData.getAll("images") as File[];
      for (const file of files) {
        if (file && typeof file.arrayBuffer === "function") {
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          images.push({
            mimeType: file.type || "image/webp",
            base64,
          });
        }
      }
    } else {
      const body = await req.json();
      persona = body.persona || "rizz";
      language = body.language || "auto";
      // Support both text/extraContext and message/image/userId signatures
      text = body.text || body.message || "";
      extraContext = body.extraContext || "";

      if (body.image) {
        const rawImg = body.image;
        if (typeof rawImg === "string") {
          let b64 = rawImg;
          let mime = "image/webp";
          if (b64.startsWith("data:")) {
            const matches = b64.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
            if (matches) {
              mime = matches[1];
              b64 = matches[2];
            }
          }
          images.push({ mimeType: mime, base64: b64 });
        } else if (typeof rawImg === "object" && rawImg.base64) {
          images.push({
            mimeType: rawImg.mimeType || "image/webp",
            base64: rawImg.base64,
          });
        }
      }

      if (Array.isArray(body.images)) {
        images = body.images.map(
          (img: { mimeType?: string; base64?: string; data?: string }) => {
            let b64 = img.base64 || img.data || "";
            let mime = img.mimeType || "image/webp";
            if (b64.startsWith("data:")) {
              const matches = b64.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
              if (matches) {
                mime = matches[1];
                b64 = matches[2];
              }
            }
            return { mimeType: mime, base64: b64 };
          }
        );
      }
    }

    const token = process.env.GEMINI_API_KEY;

    if (!token) {
      console.warn("Missing GEMINI_API_KEY, falling back to smart engine");
      const fallback = generateSmartFallbackReply(
        persona,
        language,
        text,
        extraContext,
        images.length > 0
      );
      return NextResponse.json(fallback);
    }

    // Determine auth mechanism:
    // If token starts with 'AQ.', treat as an OAuth Bearer token
    // If token starts with 'AIzaSy' or other standard key, use query param ?key=
    const isBearer = token.startsWith("AQ.");
    const url = isBearer
      ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${token}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isBearer) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const personaDirective = getPersonaDirective(persona);
    const languageDirective = getLanguageDirective(language);

    const systemPrompt = `You are the TextClutch Intelligence Engine, an elite social dynamics and texting strategist specialized in real-time communication across dating, friendships, and casual banter.

${languageDirective}

${personaDirective}

Analyze the chat screenshot or conversation log:
1. Identify the participants, who the user is, and who sent the last message.
2. Detect tone, unspoken subtext, hesitation, or tension.
3. Generate 3 distinct response suggestions strictly matching the requested Persona and Language specifications:
   - Option 1 (Safe & Casual): Low-risk, nonchalant, easy reply.
   - Option 2 (Bold & Direct): Punchy, high-impact, clear frame.
   - Option 3 (Playful / Wildcard): Unexpected angle, witty hook, intriguing tease.

Return the response STRICTLY as valid JSON in this exact structure:
{
  "detected_context": "Short summary of the current conversation dynamic",
  "detected_language": "English | Hinglish | Hindi",
  "replies": [
    {
      "tag": "Safe & Casual",
      "text": "The reply string"
    },
    {
      "tag": "Bold & Direct",
      "text": "The reply string"
    },
    {
      "tag": "Playful / Wildcard",
      "text": "The reply string"
    }
  ]
}`;

    let userPromptText = `Target Persona: ${persona.toUpperCase()}\nTarget Language: ${language}\n`;
    if (extraContext.trim()) {
      userPromptText += `User's Unspoken Context: "${extraContext.trim()}"\n`;
    }
    if (text.trim()) {
      userPromptText += `Chat Conversation Context:\n"""\n${text.trim()}\n"""\n`;
    }
    if (images.length > 0) {
      userPromptText += `Attached: ${images.length} screenshot/video keyframe(s) of the chat.\n`;
    }
    userPromptText += `\nGenerate 3 distinct clutch replies following the persona and language directives strictly in JSON.`;

    const parts: any[] = [{ text: `${systemPrompt}\n\n${userPromptText}` }];

    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    }

    const body = {
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.85,
        responseMimeType: "application/json",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Gemini API returned error:", response.status, errText);

      // Gracefully fall back to local smart generator if quota/auth fails
      const fallback = generateSmartFallbackReply(
        persona,
        language,
        text,
        extraContext,
        images.length > 0
      );
      fallback.detected_context += ` (⚡ Note: Gemini API [${response.status}]. Served via TextClutch Smart Engine)`;
      return NextResponse.json(fallback);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      const fallback = generateSmartFallbackReply(
        persona,
        language,
        text,
        extraContext,
        images.length > 0
      );
      return NextResponse.json(fallback);
    }

    const parsed = parseAndSanitizeResponse(rawText);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("TextClutch API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function parseAndSanitizeResponse(rawText: string): ApiResponsePayload {
  try {
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.replies) &&
      parsed.replies.length > 0
    ) {
      return {
        detected_context:
          parsed.detected_context || "Chat conversation analyzed",
        detected_language: parsed.detected_language || "English",
        replies: parsed.replies.map((r: any, idx: number) => ({
          tag:
            r.tag ||
            (idx === 0
              ? "Safe & Casual"
              : idx === 1
              ? "Bold & Direct"
              : "Playful / Wildcard"),
          text: typeof r === "string" ? r : r.text || "",
        })),
      };
    }
  } catch (e) {
    console.error("Failed to parse JSON from LLM output:", e);
  }

  throw new Error("Unable to parse structured JSON from LLM output");
}

function generateSmartFallbackReply(
  persona: string,
  language: string,
  text: string,
  extraContext: string,
  hasImages: boolean
): ApiResponsePayload {
  const combined = (text + " " + extraContext).toLowerCase();

  let detectedLang = "English";
  const hinglishTokens = [
    "yaar",
    "bata",
    "kya",
    "nahi",
    "bhai",
    "scene",
    "phaphad",
    "so",
    "baba",
    "chal",
    "kaise",
    "mera",
    "meri",
    "kuch",
    "haan",
    "abhi",
    "kar",
    "dekh",
    "tu",
    "tum",
  ];
  const hindiRegex = /[\u0900-\u097F]/;

  if (
    language === "hindi" ||
    (language === "auto" && hindiRegex.test(combined))
  ) {
    detectedLang = "Hindi";
  } else if (
    language === "hinglish" ||
    (language === "auto" && hinglishTokens.some((t) => combined.includes(t)))
  ) {
    detectedLang = "Hinglish";
  } else if (language === "english") {
    detectedLang = "English";
  }

  let contextSummary =
    "Casual 1-on-1 chat exchange with subtle push-pull dynamic.";
  if (
    combined.includes("sorry") ||
    combined.includes("late") ||
    combined.includes("busy") ||
    combined.includes("meeting")
  ) {
    contextSummary =
      "Detected: Late reply excuse • Tension: Low-to-moderate • Dynamic: Sender is seeking validation after delayed response.";
  } else if (
    combined.includes("coffee") ||
    combined.includes("hinge") ||
    combined.includes("tinder") ||
    combined.includes("date")
  ) {
    contextSummary =
      "Detected: Dating app banter • Dynamic: Flirtatious opening stage with high curiosity.";
  } else if (
    combined.includes("k") ||
    combined.includes("ok") ||
    combined.length < 15
  ) {
    contextSummary =
      "Detected: Dry / low-effort response • Dynamic: Sender withholding effort; requires frame-holding comeback.";
  } else if (
    combined.includes("interview") ||
    combined.includes("exam") ||
    combined.includes("stress") ||
    combined.includes("sad")
  ) {
    contextSummary =
      "Detected: Emotional vulnerability • Dynamic: Friend sharing raw frustration; needs comfort and perspective.";
  } else if (hasImages) {
    contextSummary =
      "Detected: Screenshot message log • Dynamic: High-engagement back-and-forth communication.";
  }

  if (detectedLang === "Hinglish") {
    switch (persona) {
      case "cold":
        return {
          detected_context: contextSummary,
          detected_language: "Hinglish",
          replies: [
            { tag: "Safe & Casual", text: "Haan theek hai, no scene. Chill karo." },
            { tag: "Bold & Direct", text: "Pura din gayab rehne ka talent seekhna padega tumse." },
            { tag: "Playful / Wildcard", text: "Acha laga dekh ke ki phone charge karna yaad aa gaya finally 😂" },
          ],
        };
      case "caring":
        return {
          detected_context: contextSummary,
          detected_language: "Hinglish",
          replies: [
            { tag: "Safe & Casual", text: "Arre tension mat lo yaar, take your time. Sab theek ho jayega." },
            { tag: "Bold & Direct", text: "Itna load mat liya karo, tumne apna best diya. Shaam ko call karti hoon agar baat karni ho toh." },
            { tag: "Playful / Wildcard", text: "Pehle ek mast chai ya coffee piyo, baaki sab secondary hai. I'm here for you ❤️" },
          ],
        };
      case "playful":
        return {
          detected_context: contextSummary,
          detected_language: "Hinglish",
          replies: [
            { tag: "Safe & Casual", text: "Acha ji, ab jaake humari yaad aayi? Bahane toh solid banate ho waise." },
            { tag: "Bold & Direct", text: "Late aane ka fine lagega ab, cold coffee tumhari taraf se pending hai." },
            { tag: "Playful / Wildcard", text: "Maine toh assume kar liya tha ki Himalayan retreat pe nikal gaye bina bataye 🏔️" },
          ],
        };
      case "tactical":
        return {
          detected_context: contextSummary,
          detected_language: "Hinglish",
          replies: [
            { tag: "Safe & Casual", text: "All good. Thoda busy hoon abhi, baad me ping karta hoon." },
            { tag: "Bold & Direct", text: "Haha busy bees allowed nahi hain. Shaam ko free hokar batao scene kya hai." },
            { tag: "Playful / Wildcard", text: "Interesting... tell me more when you're actually paying attention ;)" },
          ],
        };
      case "rizz":
      default:
        return {
          detected_context: contextSummary,
          detected_language: "Hinglish",
          replies: [
            { tag: "Safe & Casual", text: "Haha koi na, par apology aise free me accept nahi hogi... date decide karo ab 😉" },
            { tag: "Bold & Direct", text: "Itna miss karwane ki zaroorat nahi thi, direct bol dete ki meet karna hai." },
            { tag: "Playful / Wildcard", text: "Tumhara phone safe custody me rakhwana padega, warning signs are clear 🚩 (just kidding, free kab ho?)" },
          ],
        };
    }
  } else if (detectedLang === "Hindi") {
    switch (persona) {
      case "cold":
        return {
          detected_context: contextSummary,
          detected_language: "Hindi",
          replies: [
            { tag: "Safe & Casual", text: "कोई बात नहीं, जब फुर्सत मिले तब बात करना।" },
            { tag: "Bold & Direct", text: "इतने लंबे इंतज़ार की आदत नहीं है मुझे।" },
            { tag: "Playful / Wildcard", text: "लगता है आपका समय सिर्फ खास लोगों के लिए आरक्षित है।" },
          ],
        };
      case "caring":
        return {
          detected_context: contextSummary,
          detected_language: "Hindi",
          replies: [
            { tag: "Safe & Casual", text: "ज़्यादा परेशान मत हो, सब ठीक हो जाएगा। अपना ध्यान रखो।" },
            { tag: "Bold & Direct", text: "मैं हमेशा तुम्हारे साथ हूँ, जब भी दिल हल्का करना हो फोन कर लेना।" },
            { tag: "Playful / Wildcard", text: "चलो गहरी सांस लो और एक कप गरम चाय पियो, बाकी सब बाद में देखेंगे।" },
          ],
        };
      case "playful":
      case "rizz":
      default:
        return {
          detected_context: contextSummary,
          detected_language: "Hindi",
          replies: [
            { tag: "Safe & Casual", text: "इतनी देर बाद याद आई हमारी? जुर्माना लगेगा अब!" },
            { tag: "Bold & Direct", text: "अगर इतना इंतज़ार करवाओगे तो हम भी भाव खाना शुरू कर देंगे 😉" },
            { tag: "Playful / Wildcard", text: "मुस्कुराओ, क्योंकि तुम्हारी यह ख़ामोशी बहुत सता रही थी।" },
          ],
        };
    }
  }

  // English fallback
  switch (persona) {
    case "cold":
      return {
        detected_context: contextSummary,
        detected_language: "English",
        replies: [
          { tag: "Safe & Casual", text: "all good, don't sweat it." },
          { tag: "Bold & Direct", text: "matching that 24-hour energy right now." },
          { tag: "Playful / Wildcard", text: "glad your phone found its way out of airplane mode ✈️" },
        ],
      };
    case "caring":
      return {
        detected_context: contextSummary,
        detected_language: "English",
        replies: [
          { tag: "Safe & Casual", text: "Hey take a deep breath. One off day doesn't define how capable you are." },
          { tag: "Bold & Direct", text: "You're being way too hard on yourself. Proud of you for showing up. Call me if you want to vent." },
          { tag: "Playful / Wildcard", text: "Emergency ice cream protocol initiated 🍦 venting session starts whenever you're ready." },
        ],
      };
    case "playful":
      return {
        detected_context: contextSummary,
        detected_language: "English",
        replies: [
          { tag: "Safe & Casual", text: "look who decided to grace us with their presence haha" },
          { tag: "Bold & Direct", text: "bold of you to assume I was waiting by my phone (I was only refreshing every 3 minutes)" },
          { tag: "Playful / Wildcard", text: "you owe me a coffee and a very convincing 3-part presentation explaining yourself" },
        ],
      };
    case "tactical":
      return {
        detected_context: contextSummary,
        detected_language: "English",
        replies: [
          { tag: "Safe & Casual", text: "no worries at all. caught up with something right now, I'll catch you later." },
          { tag: "Bold & Direct", text: "sounds hectic. let's catch up when you're actually free to talk properly." },
          { tag: "Playful / Wildcard", text: "mystery solved. was starting to think you got drafted into covert operations." },
        ],
      };
    case "rizz":
    default:
      return {
        detected_context: contextSummary,
        detected_language: "English",
        replies: [
          { tag: "Safe & Casual", text: "apology accepted on one condition: you pick the spot next time." },
          { tag: "Bold & Direct", text: "if making me wait was part of your master plan to stay on my mind, it worked." },
          { tag: "Playful / Wildcard", text: "you're lucky you're cute enough to get away with a delay like that 😉" },
        ],
      };
  }
}
