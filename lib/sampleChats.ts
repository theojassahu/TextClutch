export interface SampleChat {
  id: string;
  title: string;
  category: "Hinglish WhatsApp" | "Dating App Banter" | "Dry / Unbothered" | "Late Reply" | "Emotional / Caring";
  text: string;
  extraContext: string;
  recommendedPersona: "rizz" | "cold" | "caring" | "playful" | "tactical";
  recommendedLanguage: "auto" | "english" | "hinglish" | "hindi";
}

export const SAMPLE_CHATS: SampleChat[] = [
  {
    id: "hinglish-late-reply",
    title: "Late Reply (6 Hours Gap)",
    category: "Late Reply",
    text: `[Yesterday 11:30 PM] Me: Kal brunch ke liye chal rahe hain kya bandra?
[Today 5:45 PM] Her: Arreee so sorry baba! Pura din shoot pe phans gayi thi phone dekhne ka time hi nahi mila 🙈 free hai abhi?`,
    extraContext: "She replied after 18 hours with an excuse. We've been on 2 dates.",
    recommendedPersona: "rizz",
    recommendedLanguage: "hinglish",
  },
  {
    id: "hinglish-banter-plans",
    title: "Casual Hinglish Banter",
    category: "Hinglish WhatsApp",
    text: `Him: Tune bola tha tu party me aayegi... sab wait kar rahe the tera
Her: Mera mood off tha yaar, so gayi thi
Him: Haan bas bahane banwa lo tumse, priority samajh aa gayi 😂`,
    extraContext: "Close friend teasing about missing the weekend get-together.",
    recommendedPersona: "playful",
    recommendedLanguage: "hinglish",
  },
  {
    id: "hinge-dating-opener",
    title: "Dating App Coffee Debate",
    category: "Dating App Banter",
    text: `Prompt on Profile: "The key to my heart is: Finding the best cold brew in town."
Them: My standard is really high, don't disappoint me lol`,
    extraContext: "First exchange on Hinge after matching 10 mins ago.",
    recommendedPersona: "rizz",
    recommendedLanguage: "english",
  },
  {
    id: "dry-text-savage",
    title: "The Infamous 'K' Reply",
    category: "Dry / Unbothered",
    text: `[Friday 9:00 PM] Me: Hey had a great time at the concert! Let's definitely catch up again soon, maybe that sushi place we talked about?
[Sunday 4:15 PM] Them: k sounds good`,
    extraContext: "Super dry one-word response after 40 hours. Need an unbothered comeback.",
    recommendedPersona: "cold",
    recommendedLanguage: "english",
  },
  {
    id: "caring-support",
    title: "Exams / Stress Support",
    category: "Emotional / Caring",
    text: `Friend: Honestly feel like giving up on this semester. Today's interview went terrible and I blanked out on the simplest question. Feeling so stupid rn.`,
    extraContext: "Close friend having a tough week after job interviews.",
    recommendedPersona: "caring",
    recommendedLanguage: "english",
  },
  {
    id: "hindi-emotional",
    title: "Hindi Emotional Check-in",
    category: "Emotional / Caring",
    text: `दोस्त: आज ऑफिस में बहुत बहस हो गई बॉस से। मन बहुत परेशान है, कुछ समझ नहीं आ रहा क्या करूँ।`,
    extraContext: "Office stress check-in, replying in pure warm Hindi.",
    recommendedPersona: "caring",
    recommendedLanguage: "hindi",
  },
];
