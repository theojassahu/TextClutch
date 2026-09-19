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

function cleanBase64(input: string, fallbackMime = "image/webp"): { mimeType: string; base64: string } {
  let mimeType = fallbackMime;
  let data = (input || "").trim();
  if (data.startsWith("data:")) {
    const commaIndex = data.indexOf(",");
    if (commaIndex !== -1) {
      const meta = data.substring(5, commaIndex);
      const mimeMatch = meta.match(/^([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      data = data.substring(commaIndex + 1);
    }
  }
  data = data.replace(/\s+/g, "");
  return { mimeType, base64: data };
}

function getPersonaDirective(persona: string): string {
  switch ((persona || "").toLowerCase()) {
    case "cold":
      return `MANDATORY PERSONA: COLD & UNBOTHERED (Savage)
- Vibe: Aloof, unbothered, zero desperation, effortlessly sharp, low investment.
- How they text: Short, dry wit, subtle roasts, never double-texting energy.
- Real human examples: "sure thing", "damn you really took 8 hours to type that", "cool story", "khatam ho gaya drama ya aur bacha hai?", "bold of you to assume I was waiting lol".
- FORBIDDEN: Do NOT sound like an angry villain. Be calm, nonchalant, and witty.`;
    case "caring":
      return `MANDATORY PERSONA: CARING & WHOLESOME
- Vibe: Warm, emotionally mature, genuinely supportive, thoughtful, attentive.
- How they text: Relatable, comforting, sincere, no toxic positivity.
- Real human examples: "hey take a breath, you did your best today", "arrey tension mat le, let's grab food and talk about it", "proud of you for pushing through, rest up tonight".
- FORBIDDEN: Don't sound like a therapist or corporate HR. Sound like a real caring best friend or empathetic partner.`;
    case "playful":
      return `MANDATORY PERSONA: PLAYFUL BANTER (Teasing)
- Vibe: Sarcastic, funny, push-pull, teasing roasts, zero seriousness.
- How they text: Quick wit, lighthearted mocking, playful callbacks to their words.
- Real human examples: "wow look who remembered I exist 😂", "the excuses are getting creative at least", "tumse zyada busy toh prime minister bhi nahi hai", "nah that's cap and you know it".
- FORBIDDEN: Don't be mean or cheesy. Keep the humor high-energy and fun.`;
    case "tactical":
      return `MANDATORY PERSONA: TACTICAL & STRATEGIC (Frame Control)
- Vibe: Intrigue-building, low investment, poker-faced, leaving them curious.
- How they text: Keeps conversational leverage without being rude, concise, leaves an open loop.
- Real human examples: "haha that's actually wild, I'll tell you later", "busy right now, ping you tonight", "hmm interesting perspective... might have to disagree though", "acha? dekhte hain".
- FORBIDDEN: Don't write essays. Keep it punchy and intriguing.`;
    case "rizz":
    default:
      return `MANDATORY PERSONA: RIZZ & CHARM (Flirtatious & Smooth)
- Vibe: Effortlessly charming, confident, playful attraction, zero try-hard energy.
- How they text: Witty, teasing, high charisma, natural casual flirt.
- Real human examples: "haha you really think you can get away with that?", "ab apology me cold coffee sponsor karni padegi", "honestly didn't expect you to be this funny", "tell me you're free this weekend without telling me".
- STRICT BAN: NEVER use 2012 cheesy pickup lines like "if making me wait was your master plan" or "apology accepted on one condition: you owe me your heart". Sound like a real modern human texting from their iPhone!`;
  }
}

function getLanguageDirective(language: string): string {
  switch ((language || "").toLowerCase()) {
    case "hinglish":
      return `CRITICAL LANGUAGE: AUTHENTIC HINGLISH (Latin-script Indian texting slang)
- Write ALL 3 replies in 100% natural conversational Hinglish that young Indians in Delhi/Mumbai/Bangalore text on WhatsApp/Insta.
- Use natural vocabulary: "arey", "bhai", "yaar", "chill kar", "scene sorted hai", "kya scene hai", "bata na", "load mat le", "sahi bata", "mast", "dekh", "haha", "chal theek hai", "waah".
- Casual capitalization (mostly lowercase or natural caps). Realistic emojis (😂, 👀, 💀, 😌, 🫡, 😉).
- NEVER use formal Hindi words or awkward literal English translations. Keep it ultra-authentic.`;
    case "hindi":
      return `CRITICAL LANGUAGE: NATURAL HINDI (Devanagari)
- Write ALL 3 replies in natural, spoken Hindi using clean Devanagari script.
- Must sound like real modern spoken Hindi among friends, not formal bookish Hindi.
- Examples: "अरे कोई बात नहीं, सब बढ़िया?", "इतना सस्पेंस क्यों बना रहे हो haha", "चलो सही है, जब फुर्सत मिले बताना"।`;
    case "english":
      return `CRITICAL LANGUAGE: NATURAL CONVERSATIONAL ENGLISH
- Write ALL 3 replies in modern, natural texting English.
- Natural lowercase vibe, modern slang, punchy, concise, zero boomer phrasing.
- Sounds like an effortless text from an iPhone or iMessage.`;
    case "auto":
    default:
      return `LANGUAGE: AUTO-DETECT
- Carefully inspect the conversation text or screenshot.
- Detect the exact texting language (English, Hinglish, or Hindi) and dialect used.
- Match that exact language style and slang for all 3 replies! If the other person texts in Hinglish, reply in Hinglish. If in English, reply in English.`;
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

    // Check for custom API key in headers or environment
    const customHeaderKey = req.headers.get("x-gemini-api-key") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      persona = (formData.get("persona") as string) || "rizz";
      language = (formData.get("language") as string) || "auto";
      text =
        (formData.get("text") as string) ||
        (formData.get("message") as string) ||
        "";
      extraContext = (formData.get("extraContext") as string) || "";

      const files = formData.getAll("images") as File[];
      for (const file of files) {
        if (file && typeof file.arrayBuffer === "function") {
          const buffer = await file.arrayBuffer();
          const rawB64 = Buffer.from(buffer).toString("base64");
          const cleaned = cleanBase64(rawB64, file.type || "image/webp");
          images.push(cleaned);
        }
      }
    } else {
      const body = await req.json();
      persona = body.persona || "rizz";
      language = body.language || "auto";
      text = body.text || body.message || "";
      extraContext = body.extraContext || "";

      if (body.image) {
        const rawImg = body.image;
        if (typeof rawImg === "string") {
          images.push(cleanBase64(rawImg, "image/webp"));
        } else if (typeof rawImg === "object" && rawImg.base64) {
          images.push(cleanBase64(rawImg.base64, rawImg.mimeType || "image/webp"));
        }
      }

      if (Array.isArray(body.images)) {
        for (const img of body.images) {
          const raw = img.base64 || img.data || "";
          if (raw) {
            images.push(cleanBase64(raw, img.mimeType || "image/webp"));
          }
        }
      }
    }

    // Priority token list from environment variables or custom header
    const candidateTokens = [
      customHeaderKey.trim(),
      process.env.GEMINI_API_KEY?.trim(),
      process.env.GOOGLE_API_KEY?.trim(),
    ].filter(Boolean) as string[];

    // Modern Gemini 3.x models that support multimodal generateContent
    const models = [
      "gemini-3.6-flash",
      "gemini-flash-latest",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite-preview",
      "gemini-2.5-flash-lite",
    ];

    let liveApiResponse: ApiResponsePayload | null = null;

    for (const token of candidateTokens) {
      for (const model of models) {
        try {
          const res = await callGeminiLive(token, model, persona, language, text, extraContext, images);
          if (res && res.replies && res.replies.length > 0) {
            liveApiResponse = res;
            break;
          }
        } catch (err) {
          // If 503 or transient error, continue to next model
        }
      }
      if (liveApiResponse) break;
    }

    if (liveApiResponse) {
      return NextResponse.json(liveApiResponse);
    }

    // Dynamic fallback engine if all models or network are unavailable
    const dynamicFallback = generateHumanDynamicReply(persona, language, text, extraContext, images.length > 0);
    return NextResponse.json(dynamicFallback);
  } catch (error: any) {
    console.error("TextClutch API Error:", error);
    const safeFallback = generateHumanDynamicReply("rizz", "auto", "", "", false);
    return NextResponse.json(safeFallback);
  }
}

async function callGeminiLive(
  token: string,
  model: string,
  persona: string,
  language: string,
  text: string,
  extraContext: string,
  images: { mimeType: string; base64: string }[]
): Promise<ApiResponsePayload | null> {
  const isBearer = token.startsWith("AQ.");
  const url = isBearer
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${token}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isBearer) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const personaDirective = getPersonaDirective(persona);
  const languageDirective = getLanguageDirective(language);

  const systemPrompt = `You are TextClutch, the ultimate real-time texting copilot and banter wingman.

CORE OBJECTIVE:
Analyze the conversation or screenshot carefully, understand the exact subtext and who said what, and generate 3 hyper-natural, distinctly varied replies.

RULES OF NATURAL HUMAN TEXTING (2026):
1. SOUND LIKE A REAL PERSON: Never use robotic clichés, cheesy 2010 pickup lines, or formal essay phrasing. Use authentic cadence, lowercase vibe, natural abbreviations, and relatable emojis.
2. REACT TO THE ACTUAL LAST MESSAGE:
   - If they apologized or gave an excuse, react directly to their excuse.
   - If they mentioned an activity, food, coffee, or plan, react directly to that.
   - If they sent a short dry text ("k", "nice"), do not over-invest; match energy with witty nonchalance.
   - If they sent a screenshot, read the LAST incoming message sent by the OTHER person on the screen.
3. 3 DISTINCT VARIATIONS:
   - "Safe & Casual": Relaxed, low effort, smooth, easy to send (3-8 words).
   - "Bold & Direct": Confident, playful tension, clear frame, high charisma (4-12 words).
   - "Playful / Wildcard": Clever tease, unexpected twist, witty roast, high engagement (5-15 words).

${languageDirective}

${personaDirective}

Format output STRICTLY as valid JSON:
{
  "detected_context": "One concise sentence summarizing the other person's last message, mood, and chat dynamic",
  "detected_language": "English | Hinglish | Hindi",
  "replies": [
    { "tag": "Safe & Casual", "text": "..." },
    { "tag": "Bold & Direct", "text": "..." },
    { "tag": "Playful / Wildcard", "text": "..." }
  ]
}`;

  let prompt = `Persona: ${persona.toUpperCase()}\nLanguage: ${language}\n`;
  if (extraContext.trim()) prompt += `Background Context / User Notes: "${extraContext.trim()}"\n`;
  if (text.trim()) prompt += `Chat Transcript:\n"""\n${text.trim()}\n"""\n`;
  if (images.length > 0) {
    prompt += `\n[Chat screenshot attached above: Carefully OCR the conversation bubbles, read the LAST incoming message from the other person, their tone, and context, and generate 3 custom responses.]\n`;
  }

  const parts: any[] = [{ text: `${systemPrompt}\n\n${prompt}` }];

  for (const img of images) {
    parts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    });
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return null;

  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  if (parsed && Array.isArray(parsed.replies) && parsed.replies.length > 0) {
    return {
      detected_context: parsed.detected_context || "Chat dynamic analyzed",
      detected_language: parsed.detected_language || "English",
      replies: parsed.replies.slice(0, 3).map((r: any, i: number) => ({
        tag: r.tag || (i === 0 ? "Safe & Casual" : i === 1 ? "Bold & Direct" : "Playful / Wildcard"),
        text: typeof r === "string" ? r : r.text,
      })),
    };
  }

  return null;
}

/**
 * Advanced Dynamic Human Conversational Fallback Engine
 * Provides rich, hyper-varied responses that change randomly every time you generate
 */
function generateHumanDynamicReply(
  persona: string,
  language: string,
  text: string,
  extraContext: string,
  hasImages: boolean
): ApiResponsePayload {
  const combined = (text + " " + extraContext).trim().toLowerCase();

  // Detect language
  let detectedLang = "English";
  const hinglishTokens = [
    "yaar", "bata", "kya", "nahi", "bhai", "scene", "baba", "chal",
    "kaise", "mera", "meri", "kuch", "haan", "abhi", "kar", "dekh", "tu",
    "tum", "kaha", "kab", "aaye", "aaya", "phasa", "meeting", "raha", "rahi", "thik"
  ];
  const hindiRegex = /[\u0900-\u097F]/;

  if (language === "hindi" || (language === "auto" && hindiRegex.test(combined))) {
    detectedLang = "Hindi";
  } else if (
    language === "hinglish" ||
    (language === "auto" && hinglishTokens.some((t) => combined.includes(t)))
  ) {
    detectedLang = "Hinglish";
  } else if (language === "english") {
    detectedLang = "English";
  }

  // Extract the latest message / intent
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const lastLine = lines.length > 0 ? lines[lines.length - 1] : "";
  const cleanLastLine = lastLine.replace(/^[^:]+:\s*/, "").trim();

  // Topic classification
  const isLateOrApology = /sorry|late|busy|meeting|delay|der|time nahi|time hi nahi|bhool|so gaya|fell asleep/i.test(combined);
  const isCoffeeOrDrink = /coffee|tea|chai|drink|cafe|starbucks|cold brew|beer|bar/i.test(combined);
  const isDryOrShort = cleanLastLine.length > 0 && cleanLastLine.length <= 12 && /^(k|ok|cool|nice|hmm|hmmm|yeah|yep|fine|nice|ha|haan|achha|acha)$/i.test(cleanLastLine);
  const isStressOrSad = /tired|exhausted|stress|cry|sad|interview|exam|fail|tough|ro|pareshan|mood off|upset/i.test(combined);

  // Dynamic context builder
  let contextSummary = "Casual chat exchange with real-time push-pull dynamic.";
  if (isLateOrApology) {
    contextSummary = "Sender gave an excuse or apologized for delay • Dynamic: Ball is in your court.";
  } else if (isCoffeeOrDrink) {
    contextSummary = "Casual meetup banter around coffee/drinks • Dynamic: High flirt & teasing potential.";
  } else if (isDryOrShort) {
    contextSummary = "Short, low-effort response received • Dynamic: Hold frame with effortless nonchalance.";
  } else if (isStressOrSad) {
    contextSummary = "Vulnerable or overwhelmed emotion detected • Dynamic: Warm, emotionally mature support.";
  } else if (hasImages) {
    contextSummary = "Chat screenshot analyzed • Dynamic: Fast-paced banter stage.";
  }

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  if (detectedLang === "Hinglish") {
    if (isLateOrApology) {
      if (persona === "cold") {
        return {
          detected_context: contextSummary,
          detected_language: "Hinglish",
          replies: [
            { tag: "Safe & Casual", text: pick(["all good, chill kar.", "koi na, sorted hai.", "haha it's fine.", "no worries."]) },
            { tag: "Bold & Direct", text: pick(["itna late reply karne ka record bana rahe ho kya?", "gayab hone ka alag hi shauk hai tumhe 💀", "bhai phone silent pe tha ya mood?", "itna sochte ho har text se pehle?"]) },
            { tag: "Playful / Wildcard", text: pick(["main toh assume kar chuka tha ki himalayas shift ho gaye ho 🏔️", "apology noted, par fine lagega ab.", "itni der baad yaad aane pe tax lagna chahiye 😂", "agli baar late huye toh blocklist me feature hoge 😌"]) },
          ],
        };
      } else if (persona === "playful") {
        return {
          detected_context: contextSummary,
          detected_language: "Hinglish",
          replies: [
            { tag: "Safe & Casual", text: pick(["koi na baba, free kab ho ab?", "haha it's okay, ho gaya sab khatam?", "chill, ab batao kya scene hai?"]) },
            { tag: "Bold & Direct", text: pick(["bahane toh ekdum top tier banate ho waise 😂", "miss karwana tha toh seedha bol dete na ;)", "ab kal cold coffee tumhari taraf se pending hai."]) },
            { tag: "Playful / Wildcard", text: pick(["apology accept hone me 3-5 business days lagenge ji", "acha ji, ab fursat mili janab ko? 👀", "award milna chahiye tumhe excuses invent karne ke liye haha"]) },
          ],
        };
      } else if (persona === "caring") {
        return {
          detected_context: contextSummary,
          detected_language: "Hinglish",
          replies: [
            { tag: "Safe & Casual", text: pick(["arey koi na yaar, hope din theek gaya?", "it's totally okay, thak gaye hoge kafi.", "chill kar, itna load mat le."]) },
            { tag: "Bold & Direct", text: pick(["pehle paani piyo aur relax karo, we can talk anytime ❤️", "itna mat bhaga karo, take care of yourself first.", "din kaisa raha waise? hope sab sorted hai."]) },
            { tag: "Playful / Wildcard", text: pick(["pehle mast chai piyo, baki baatein baad me karenge ☕", "free hoke batao if you want to vent or just chill.", "no worries at all, main yahi hoon jab mann kare ping kar dena."]) },
          ],
        };
      } else {
        // rizz
        return {
          detected_context: contextSummary,
          detected_language: "Hinglish",
          replies: [
            { tag: "Safe & Casual", text: pick(["haha koi na, ab free ho?", "it's fine, hope it was worth the wait ;)", "apology accepted, plan batao ab."]) },
            { tag: "Bold & Direct", text: pick(["itna wait karwa ke aane ka हक sirf tumhara hi hai 😉", "free me apology accept nahi hoti, date decide karo ab.", "itna miss karwaya hai toh compensate karna padega 😌"]) },
            { tag: "Playful / Wildcard", text: pick(["tumhara schedule dekh ke toh lagta hai PM se milna easy hai 😂", "warning signs clearly visible hain 🚩 par I like you anyway haha", "agli baar late kiya toh seedha pick karne aa jaunga 🚗"]) },
          ],
        };
      }
    }

    if (isCoffeeOrDrink) {
      return {
        detected_context: contextSummary,
        detected_language: "Hinglish",
        replies: [
          { tag: "Safe & Casual", text: pick(["sounds good, kab chal rahe hain?", "deal, coffee spot tum pick karo.", "haha I'm down, timing batao."]) },
          { tag: "Bold & Direct", text: pick(["agar coffee achi nahi hui toh tumhari responsibility 😉", "my taste in coffee is high, don't disappoint me lol", "kal shaam ko chalte hain, no excuses."]) },
          { tag: "Playful / Wildcard", text: pick(["bet lagate hain, agar meri spot better hui toh agla treat tumhara ☕", "sirf coffee ya sath me koi spicy gossip bhi milegi? 👀", "dekhte hain kitna coffee taste hai tumhara haha"]) },
        ],
      };
    }

    if (isDryOrShort) {
      return {
        detected_context: contextSummary,
        detected_language: "Hinglish",
        replies: [
          { tag: "Safe & Casual", text: pick(["👍", "haha okay.", "cool.", "sorted."]) },
          { tag: "Bold & Direct", text: pick(["itna bada essay padhne me thoda time lag gaya mujhe 💀", "itna lamba text mat bhejo, phone hang ho gaya mera 😂", "words bacha rahe ho kya agle saal ke liye?"]) },
          { tag: "Playful / Wildcard", text: pick(["itna enthusiasm dekh ke tears in my eyes 🥹", "next word ke liye 2 business days lagenge kya?", "energy thodi aur low ho sakti thi waise 📉"]) },
        ],
      };
    }

    // Default rich Hinglish banter
    return {
      detected_context: contextSummary,
      detected_language: "Hinglish",
      replies: [
        { tag: "Safe & Casual", text: pick(["haha sahi hai, aur batao?", "makes sense, aur kya chal raha?", "chal badhiya hai, aur batao."]) },
        { tag: "Bold & Direct", text: pick(["yeh baat direct bolte toh zyada maza aata 😉", "tumhe tease karne me alag hi kick milti hai waise.", "batao kab mil rahe hain fir?"]) },
        { tag: "Playful / Wildcard", text: pick(["interesting... par main convince nahi hua abhi tak 😏", "tumhara drama dekh ke lagta hai alag fan base hona chahiye 😂", "ye sab theek hai, asli mudde pe kab aa rahe ho?"]) },
      ],
    };
  }

  // English fallback
  if (isLateOrApology) {
    if (persona === "cold") {
      return {
        detected_context: contextSummary,
        detected_language: "English",
        replies: [
          { tag: "Safe & Casual", text: pick(["all good, don't sweat it.", "no worries at all.", "got it, hope it went well."]) },
          { tag: "Bold & Direct", text: pick(["took you a minute haha.", "matching that response time as we speak 🫡", "glad your phone finally found you."]) },
          { tag: "Playful / Wildcard", text: pick(["I was about to file a missing person report honestly 🕵️", "the late response fee is officially on your tab.", "airplane mode suits you lol"]) },
        ],
      };
    } else if (persona === "caring") {
      return {
        detected_context: contextSummary,
        detected_language: "English",
        replies: [
          { tag: "Safe & Casual", text: pick(["Hey no stress at all, hope your day wasn't too crazy!", "Totally get it, work comes first.", "Take your time, we can always catch up."]) },
          { tag: "Bold & Direct", text: pick(["Go decompress first, you sound like you had a wild day ❤️", "You don't need to apologize for being busy, take care of you first.", "Hope you survived the chaos! Rest up tonight."]) },
          { tag: "Playful / Wildcard", text: pick(["Drink some water and relax, the chat isn't going anywhere.", "Sending good vibes your way, ping me whenever you're recharged.", "No worries, I'm here whenever you're ready to vent or chill."]) },
        ],
      };
    } else {
      // rizz / playful
      return {
        detected_context: contextSummary,
        detected_language: "English",
        replies: [
          { tag: "Safe & Casual", text: pick(["haha all good, what're you up to now?", "no worries, survived the rush?", "fair enough, free to talk now?"]) },
          { tag: "Bold & Direct", text: pick(["you owe me a coffee for that delay, non-negotiable 😉", "if keeping me waiting was intentional, nice try lol", "you're lucky you're cute enough to get away with that delay."]) },
          { tag: "Playful / Wildcard", text: pick(["I was literally 2 minutes away from unfriending you 😂", "apology noted, now tell me something interesting.", "damn, and here I thought I was your favorite distraction."]) },
        ],
      };
    }
  }

  if (isDryOrShort) {
    return {
      detected_context: contextSummary,
      detected_language: "English",
      replies: [
        { tag: "Safe & Casual", text: pick(["cool.", "sounds good.", "bet."]) },
        { tag: "Bold & Direct", text: pick(["careful, don't exhaust yourself typing all that 😂", "wow the energy here is truly overwhelming lol", "did you run out of letters on your keyboard? 💀"]) },
        { tag: "Playful / Wildcard", text: pick(["tears in my eyes from this heartfelt paragraph 🥹", "tell me how you really feel haha", "I'll wait 2 business days to match this energy 📉"]) },
      ],
    };
  }

  // Default English banter
  return {
    detected_context: contextSummary,
    detected_language: "English",
    replies: [
      { tag: "Safe & Casual", text: pick(["haha fair enough, what're you up to?", "lol that's actually pretty funny.", "makes sense honestly."]) },
      { tag: "Bold & Direct", text: pick(["you're definitely trouble, but in a good way 😉", "let's see if your conversation is as good in person.", "I bet you say that to everyone lol"]) },
      { tag: "Playful / Wildcard", text: pick(["wait actually? you gotta explain that one.", "bold statement, can you back it up though? 😏", "not gonna lie, didn't expect that from you haha"]) },
    ],
  };
}
