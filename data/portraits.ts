import { PortraitKey } from "./reports";

// ---------- The three Binance user portraits (Attempter Guidelines, full detail) ----------

export type Portrait = {
  key: PortraitKey;
  label: string;
  band: string;
  script: string;
  platformBehavior: string;
  portfolio: string;
  crossAssetPosture: string;
  wants: string;
  loses: string;
  assumedKnown: string;
  mustExplain: string;
  glossRule?: string; // G2 only: the "gloss, don't teach" rule + worked examples + scoring
  actionCeiling: string;
  riskFraming: string;
  typicalFailureMode: string;
  concreteExamples: string;
  rewriteMust: string;
};

export const RISK_APPETITE_NOTE =
  "Conservative vs. aggressive risk appetite is orthogonal to these three tiers - a G2 reader, for instance, can be either. Where a task carries a risk appetite flag, it shifts emphasis (downside framing vs. upside capture) but does not change the sharpness band, which is set by expertise and intent alone, not risk tolerance. Do not penalize a rewrite's portrait fit for its risk framing choice unless it actually violates the portrait's required risk-framing style.";

export const PORTRAITS: Portrait[] = [
  {
    key: "G1",
    label: "G1 Novice",
    band: "Sharpness 2 to 3",
    script:
      "I opened a Crypto account about four months ago after a friend told me to. I've bought BTC and ETH, and one smaller coin I saw on social media that's now down 40%. Around $800 in total. I check the app most days, mostly to see if I'm up or down. I've seen the Futures tab and I've avoided it deliberately. I've been curious about gold lately because everyone says it's safer. When something big happens in the news I want to know whether it affects me and whether I should be worried. I don't want to be told what to do. I want to understand what's going on.",
    platformBehavior:
      "Under 6 months since first deposit; 20 or fewer lifetime trades; spot only; may have used Simple Earn; has never opened a futures or margin position.",
    portfolio:
      "1 to 3 assets, concentrated in BTC and ETH plus possibly one speculative small cap; positions typically $100 to $2,000.",
    crossAssetPosture:
      "Curious but has never traded outside crypto. Holds folk beliefs (\"gold is safe\", \"stocks are companies\") without mechanism.",
    wants:
      "Is something happening that affects my money, and should I be worried or relaxed about it?",
    loses:
      "Three unfamiliar terms in the first two sentences; a price trigger with no explanation of what to do with it or what happens if it's wrong.",
    assumedKnown:
      "Price, % change, 24h volume, market cap (roughly), BTC/ETH, buy/sell, deposit/withdraw, wallet, \"spot\".",
    mustExplain:
      "Funding rate; open interest; liquidation; leverage mechanics; perpetual/basis; TVL; support and resistance; RSI and moving averages; real interest rates; basis points; gold/silver ratio; contango/roll; ETF vs. stock; DXY; CPI, NFP, FOMC (name and mechanism); risk-on/risk-off.",
    actionCeiling:
      "Directional takeaway plus what to watch. No entries, stops, targets, or leverage tactics, ever.",
    riskFraming: "Mandatory, plain language, prominent.",
    typicalFailureMode: "Jargon wall; unusable tactical instructions.",
    concreteExamples:
      "Reaction test: \"If it fails 63.10 with the ratio through 90, look to 60.5.\" A G1 reader does not know which ratio, what \"look to\" means, or whether 60.5 is good or bad news. They stop reading. Aimed at a G1 reader, this sentence rates a 1.\n\nOpening that works: \"Silver fell about 1.7% today. The main reason: factory demand for silver is softening, and silver is used heavily in electronics, so it doesn't always move with gold even though both are precious metals. Nothing here changes the long term picture, but expect more day to day swings until the Fed meeting notes come out on 19 August.\"\n\nOpening that fails: \"XAGUSDT decoupling from real rates as the gold/silver ratio breaches 88 with COMEX inventories drawing two consecutive weeks.\" Every clause requires knowledge they don't have.",
    rewriteMust:
      "A plain-language takeaway, every term from the G1 must-explain list handled in line, prominent plain risk framing. No entries, stops, targets, or leverage tactics.",
  },
  {
    key: "G2",
    label: "G2 Experienced trader",
    band: "Sharpness 3 to 4",
    script:
      "This portrait is deliberately mixed - two very different people arrive at the same want (a setup with an invalidation level), and you will not be told which one you have.\n\nScript A, the crypto-native trader: \"I've been trading crypto for a couple of years. I run perps at 3 to 5x, I watch funding when I hold overnight. Maybe 40 trades a month across 8 or 10 assets. I mark my levels and I always know where I'm wrong before I enter. I've started trading gold and Nasdaq here too. The charts work the same way, but honestly I don't really know why gold does what it does around Fed meetings. I trade the reaction to CPI, not the number.\"\n\nScript B, the multi-platform trader: \"Crypto is where I'm most active day to day, but it isn't my only market. I've had a brokerage account for years. I hold US equities, I write covered calls, I've traded ETFs through two cycles. What I don't need is a report explaining CPI to me. Same ask as anyone else here: what's the setup and where am I wrong.\"",
    platformBehavior:
      "1 to 3 years active; 20 to 100 trades per month; spot and perpetual futures at 3 to 10x; understands liquidation price and margin; may use copy trading or grid bots.",
    portfolio:
      "5 to 15 crypto assets; mixes majors with higher beta small caps; actively rotates; holds days to weeks.",
    crossAssetPosture:
      "May hold equities, ETFs, or options at an external broker (Script B) or may be crypto-only but trading gold/Nasdaq on this platform without understanding their macro drivers (Script A). Assume you cannot tell which one you have.",
    wants:
      "Is there a setup here, what's actually driving it, and where am I wrong?",
    loses:
      "Hedged both-sides language that resolves to nothing; a directional view with no level attached; being taught something they already know.",
    assumedKnown:
      "Funding rate; open interest; liquidation; perp vs. quarterly; basis; leverage and margin; support/resistance; stop loss; position sizing; RSI, MA, volume profile; TVL; token unlocks; narrative rotation; risk-on/risk-off. Never explain any of this - it insults them.",
    mustExplain:
      "Why real yields (not headline CPI) drive gold; what NFP signals for rate expectations; gold/silver ratio as an industrial vs. monetary proxy; contango/backwardation and roll cost; ETF creation/redemption flows; earnings season rhythm; market hours and gap risk; DXY mechanics; why Nasdaq and BTC co-move.",
    glossRule:
      "The rule that resolves the split: gloss, don't teach. Every macro mechanism above must be handled as an inline gloss - an appositive clause of roughly 5 to 12 words, embedded in the sentence that uses it. Never a standalone explanation, a \"what is\" aside, or a teaching paragraph.\n\nGloss that serves both readers: \"The gold/silver ratio, industrial versus monetary demand, broke 88 this week, and COMEX inventories have drawn two weeks running.\" Script A gets the mechanism in six words; Script B reads straight past it without friction.\n\nTeaching that fails Script B: \"Before looking at the levels, it's worth understanding the gold/silver ratio. This ratio measures how many ounces of silver it takes to buy one ounce of gold...\" Script B is being padded at, and that padding displaces the analysis they came for.\n\nAssuming that fails Script A: \"With the ratio through 88 and a two week draw, industrial demand is leading price.\" Script A does not know which ratio or why it matters, and disengages.\n\nScoring: an inline gloss where the mechanism carries the argument scores a 3. Mechanism assumed outright scores a 2 (too advanced, assumes context). A didactic paragraph scores a 2 (too basic, padding).",
    actionCeiling: "Levels, triggers, invalidation. Scenario paths fine.",
    riskFraming: "Present as an invalidation condition.",
    typicalFailureMode:
      "Hedged non-committal view; trading basics re-explained; macro mechanism assumed outright or turned into a teaching paragraph.",
    concreteExamples:
      "See the gloss-rule examples above - they are the primary scoring reference for this portrait.",
    rewriteMust:
      "Direction plus driver plus invalidation level. Trading structure assumed. Any macro mechanism that carries the argument appears as an inline gloss of 5 to 12 words. No basics.",
  },
  {
    key: "G3",
    label: "G3 Professional",
    band: "Sharpness 4 to 5",
    script:
      "I trade full time or I do this professionally. Six-figure book minimum, often larger. I run basis and funding carry trades, I hedge with options, I use the API. I think in cross-asset terms: real yields, DXY, term structure, positioning. I already know today's data prints and where consensus sits before I open anything you send me. If a report tells me what happened, it has wasted my time. The only thing worth my attention is a differentiated read: a data series I'm not watching, or an argument that the consensus interpretation is wrong.",
    platformBehavior:
      "3+ years, or works in finance or research professionally; high volume; uses perps, options, basis and carry structures, OTC, API or algorithmic execution.",
    portfolio:
      "Multi-asset by default; runs hedged and relative-value positions, not just directional; sizes by risk budget.",
    crossAssetPosture:
      "Genuinely multi-asset. No transmission mechanism needs explaining.",
    wants:
      "What's the non-consensus angle? What is the market mispricing, and what's the evidence?",
    loses:
      "Anything they already know; generic macro recitation; an unsourced claim; a view with no falsification condition.",
    assumedKnown:
      "Everything in G1 and G2, plus greeks, vol surface and skew, carry and roll yield, term structure, real yields, cross-asset correlation regimes, positioning data, factor rotation, and liquidity regime framing.",
    mustExplain:
      "Nothing. Explanation is noise. What earns attention is a data series they may not be tracking, and that must be sourced, not asserted.",
    actionCeiling: "Full relative-value and structural expression.",
    riskFraming: "Assumed; state it as falsification.",
    typicalFailureMode: "Restating known information; unsourced claims.",
    concreteExamples:
      "Opening that fails: any report that opens by restating the day's price action and macro releases - they already have that.",
    rewriteMust:
      "Explicit trigger (if [indicator] [threshold] then [view changes]), price boundaries, at least one instrument-specific factor, full scenario paths. Target 5 where you can support a sourced mispricing thesis.",
  },
];
