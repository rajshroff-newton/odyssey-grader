import { PortraitKey } from "./reports";

// ---------- The three Binance user portraits (guidelines v2.0) ----------

export type Portrait = {
  key: PortraitKey;
  label: string;
  band: string;
  script: string;
  wants: string;
  loses: string;
  mustExplain: string;
  actionCeiling: string;
  riskFraming: string;
  rewriteMust: string;
};

export const PORTRAITS: Portrait[] = [
  {
    key: "G1",
    label: "G1 Novice",
    band: "Sharpness 2 to 3",
    script:
      "I opened a crypto account about four months ago after a friend told me to. I've bought BTC and ETH, and one smaller coin I saw on social media that's now down 40%. Around $800 in total. I check the app most days, mostly to see if I'm up or down. I've seen the Futures tab and I've avoided it deliberately. I've been curious about gold lately because everyone says it's safer. When something big happens in the news I want to know whether it affects me and whether I should be worried. I don't want to be told what to do. I want to understand what's going on.",
    wants:
      "Orientation and reassurance: is something happening that affects my money, and should I be worried or relaxed about it?",
    loses:
      "Three unfamiliar terms in the first two sentences; a price trigger with no explanation of what to do with it or what happens if it's wrong.",
    mustExplain:
      "Funding rate; open interest; liquidation; leverage mechanics; perpetual/basis; TVL; support and resistance; RSI and moving averages; real interest rates; basis points; gold/silver ratio; contango/roll; ETF vs. stock; DXY; CPI, NFP, FOMC (name and mechanism); risk-on/risk-off.",
    actionCeiling:
      "Directional takeaway plus what to watch. No entries, stops, targets, or leverage tactics, ever.",
    riskFraming: "Mandatory, plain language, prominent.",
    rewriteMust:
      "A plain-language takeaway, every term from the G1 must-explain list handled in line, prominent plain risk framing. No entries, stops, targets, or leverage tactics.",
  },
  {
    key: "G2",
    label: "G2 Experienced trader",
    band: "Sharpness 3 to 4",
    script:
      "Script A (crypto-native): I've been trading crypto for a couple of years. I run perps at 3 to 5x, I watch funding when I hold overnight. Maybe 40 trades a month across 8 or 10 assets. I mark my levels and I always know where I'm wrong before I enter. I've started trading gold and Nasdaq here too. The charts work the same way, but honestly I don't really know why gold does what it does around Fed meetings. Script B (multi-platform): Crypto is where I'm most active day to day, but it isn't my only market. I've had a brokerage account for years. I hold US equities, I write covered calls, I've traded ETFs through two cycles. What I don't need is a report explaining CPI to me. Same ask as anyone else here: what's the setup and where am I wrong.",
    wants:
      "A setup with an invalidation level: is there a setup here, what's actually driving it, and where am I wrong?",
    loses:
      "Hedged both-sides language that resolves to nothing; a directional view with no level attached; being taught something they already know.",
    mustExplain:
      "Macro mechanisms only, as an inline gloss of 5 to 12 words embedded in the sentence that uses them (why real yields drive gold, gold/silver ratio, contango, DXY mechanics, why Nasdaq and BTC co-move). Never a teaching paragraph, never omitted where the mechanism carries the argument. Trading terms are never explained.",
    actionCeiling: "Levels, triggers, invalidation. Scenario paths fine.",
    riskFraming: "Present as an invalidation condition.",
    rewriteMust:
      "Direction plus driver plus invalidation level. Trading structure assumed. Any macro mechanism that carries the argument appears as an inline gloss of 5 to 12 words. No basics.",
  },
  {
    key: "G3",
    label: "G3 Professional",
    band: "Sharpness 4 to 5",
    script:
      "I trade full time or I do this professionally. Six-figure book minimum, often larger. I run basis and funding carry trades, I hedge with options, I use the API. I think in cross-asset terms: real yields, DXY, term structure, positioning. I already know today's data prints and where consensus sits before I open anything you send me. If a report tells me what happened, it has wasted my time. The only thing worth my attention is a differentiated read: a data series I'm not watching, or an argument that the consensus interpretation is wrong.",
    wants:
      "A differentiated, contestable read: what's the non-consensus angle, what is the market mispricing, and what's the evidence?",
    loses:
      "Anything they already know; generic macro recitation; an unsourced claim; a view with no falsification condition.",
    mustExplain:
      "Nothing. Explanation is noise. What earns attention is a data series they may not be tracking, and that must be sourced, not asserted.",
    actionCeiling: "Full relative-value and structural expression.",
    riskFraming: "Assumed; state it as falsification.",
    rewriteMust:
      "Explicit trigger (if [indicator] [threshold] then [view changes]), price boundaries, at least one instrument-specific factor, full scenario paths. Target 5 where you can support a sourced mispricing thesis.",
  },
];
