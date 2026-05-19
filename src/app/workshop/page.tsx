'use client';

import { motion } from 'framer-motion';
import { Check, X, Clock4, Video, Calendar, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PALETTE = {
  bg: '#0D121E',
  bgDeep: '#080B14',
  card: '#121217',
  cardElevated: '#1A1A22',
  cardBorder: 'rgba(100, 100, 120, 0.25)',
  cardBorderStrong: 'rgba(154, 154, 164, 0.45)',
  green: '#88ED0C',
  greenSoft: 'rgba(136, 237, 12, 0.12)',
  greenBorder: 'rgba(136, 237, 12, 0.4)',
  blue: '#2A9CFE',
  blueSoft: 'rgba(42, 156, 254, 0.12)',
  lightBlue: '#AEE2FF',
  white: '#FFFFFF',
  muted: '#9A9AA4',
  mutedDark: '#646478',
  red: '#FF5A5A',
  redSoft: 'rgba(255, 90, 90, 0.08)',
  redBorder: 'rgba(255, 90, 90, 0.25)',
};

const buildItems = [
  {
    title: 'Audit where the first 4 months actually went',
    text: 'Stop the bleeding and identify the time leaks that killed Q1 and April.',
  },
  {
    title: 'Reverse-engineer your revenue targets into weekly hours',
    text: 'For May through December, so you know exactly where revenue-generating work happens.',
  },
  {
    title: 'Map your energy states',
    text: 'Stop scheduling strategic work when your brain is fried. Match high-value work with peak energy hours.',
  },
  {
    title: 'Build your week-by-week plan',
    text: 'Know exactly where gym time goes, where family time is protected, and where your $10,000/hour work actually happens.',
  },
  {
    title: 'Walk out with a complete plan for the rest of 2026',
    text: 'A plan you can actually execute, not another vision board collecting dust.',
  },
];

const includedItems = [
  {
    title: '2-Hour Live Workshop with Bill Korman (May 27th, 2026)',
    text: 'Work alongside Bill to build your comeback plan in real-time.',
    value: '',
  },
  {
    title: 'The Complete 168 Game Workbook',
    text: 'Every template. Every framework. Every tool you need to own your time, all in one place.',
    value: '$497 value',
  },
  {
    title: 'Time Architecture Blueprint',
    text: 'Your personalized roadmap showing exactly where every hour goes for the rest of 2026.',
    value: '',
  },
  {
    title: 'Energy Mapping System',
    text: 'Match your best energy to your highest-value work.',
    value: '',
  },
  {
    title: 'Revenue Forensics Template',
    text: 'Identify the 20% of activities driving 80% of your income.',
    value: '',
  },
  {
    title: 'Year-End Domination Roadmap',
    text: 'Finish 2026 strong with a clear path from May to December.',
    value: '',
  },
  {
    title: 'Lifetime Workshop Recording',
    text: 'Revisit the training anytime you need a reset.',
    value: '',
  },
];

const EVENTBRITE_URL =
  'https://www.eventbrite.com/e/the-second-quarter-comeback-build-your-plan-to-get-back-on-track-tickets-1989181998906?aff=oddtdtcreator';

const lostItems = [
  'At your earning rate, that\u2019s thousands of dollars in lost opportunity.',
  'Your kids got 4 months older and you still weren\u2019t there for the moments.',
  'Your body got weaker, not stronger.',
  'Your marriage drifted further.',
  'And your business? Still stuck at the same ceiling.',
];

function PrimaryCTA({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(136, 237, 12, 0.5)' }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center justify-center gap-2 rounded-full font-bold text-base md:text-lg px-8 md:px-10 py-4 md:py-5 transition-shadow w-full md:w-auto"
      style={{
        backgroundColor: PALETTE.green,
        color: '#000',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        boxShadow: '0 6px 24px rgba(136, 237, 12, 0.35)',
        letterSpacing: '-0.01em',
      }}
    >
      <span>{children}</span>
      <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
    </motion.button>
  );
}

function DeclineLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm underline transition-colors mt-4 block mx-auto"
      style={{ color: PALETTE.mutedDark, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      No thanks, I&rsquo;ll pass on this offer
    </button>
  );
}

export default function WorkshopUpsellPage() {
  const router = useRouter();

  const handleAccept = () => {
    window.location.href = EVENTBRITE_URL;
  };

  const handleDecline = () => {
    router.push('/free-book/thank-you');
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: PALETTE.bg,
        color: PALETTE.white,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      {/* Top urgency banner */}
      <div
        className="w-full text-center py-2.5 px-4 sticky top-0 z-50"
        style={{ backgroundColor: PALETTE.green, color: '#000' }}
      >
        <p
          className="text-xs md:text-sm font-bold tracking-[0.18em] uppercase"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Final Offer &middot; One Last Opportunity
        </p>
      </div>

      {/* Subtle radial glow background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(42, 156, 254, 0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(136, 237, 12, 0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10">
        {/* ============ HERO ============ */}
        <section className="pt-16 md:pt-24 pb-16 md:pb-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className="text-3xl md:text-5xl lg:text-[3.25rem] font-extrabold leading-[1.15] mb-6 tracking-tight"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Here&rsquo;s One{' '}
                <span style={{ color: PALETTE.green }}>Final Opportunity</span>
                <br className="hidden md:block" /> To Lock In The Exact Tools To Ensure Your New Year Goals Stay On Track
              </h1>

              <p
                className="text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-10"
                style={{ color: PALETTE.muted }}
              >
                You made a powerful decision to take the first step to control your time. If you&rsquo;re serious about taking your business to the next level, the best time to start is{' '}
                <span style={{ color: PALETTE.white, fontWeight: 600 }}>now</span>.
              </p>

              {/* Offer Card */}
              <div
                className="rounded-2xl p-6 md:p-8 mb-8 text-left relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${PALETTE.cardElevated} 0%, ${PALETTE.card} 100%)`,
                  border: `1px solid ${PALETTE.cardBorder}`,
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <p
                      className="text-[0.7rem] md:text-xs font-bold tracking-[0.2em] uppercase mb-3"
                      style={{ color: PALETTE.green }}
                    >
                      The Second Quarter Comeback
                    </p>
                    <h2
                      className="text-2xl md:text-3xl font-extrabold leading-tight text-white mb-5"
                      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      Build Your Plan To Get Back On Track To Your 2026 Goals
                    </h2>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: PALETTE.muted }}>
                      <span className="inline-flex items-center gap-1.5">
                        <Video className="w-4 h-4" style={{ color: PALETTE.green }} />
                        Live Workshop
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" style={{ color: PALETTE.green }} />
                        May 27th, 2026
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock4 className="w-4 h-4" style={{ color: PALETTE.green }} />
                        2 Hours
                      </span>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-baseline md:items-end gap-2 md:gap-0 shrink-0">
                    <span className="text-sm" style={{ color: PALETTE.muted }}>just</span>
                    <div className="flex items-start">
                      <span className="text-2xl md:text-3xl font-bold mt-2" style={{ color: PALETTE.green }}>$</span>
                      <span
                        className="text-6xl md:text-7xl font-extrabold leading-none"
                        style={{ color: PALETTE.green, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        97
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-7">
                  <PrimaryCTA onClick={handleAccept}>Yes &mdash; Lock In My Spot For $97</PrimaryCTA>
                  <DeclineLink onClick={handleDecline} />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ Q1 IS OVER ============ */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-10"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Q1 Is Over. <span style={{ color: PALETTE.green }}>April Is Gone.</span>
              </h2>

              <div
                className="flex items-baseline justify-center gap-4 md:gap-8 mb-10 flex-wrap"
                style={{ color: PALETTE.green }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl md:text-8xl font-extrabold leading-none">120</span>
                  <span className="text-sm md:text-base font-semibold tracking-[0.2em] uppercase">days</span>
                </div>
                <span className="text-3xl md:text-5xl font-light" style={{ color: PALETTE.muted }}>
                  &times;
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl md:text-8xl font-extrabold leading-none">2,280</span>
                  <span className="text-sm md:text-base font-semibold tracking-[0.2em] uppercase">hours</span>
                </div>
              </div>

              <p className="text-xl md:text-2xl font-bold text-white mb-3">
                Be honest: did you hit your goals?
              </p>
              <p className="text-base md:text-lg mb-10 max-w-2xl mx-auto" style={{ color: PALETTE.muted }}>
                You set big plans in January: Revenue targets, fitness goals, family commitments. Now that it&rsquo;s May, how many did you actually accomplish?
              </p>

              <p
                className="text-sm font-semibold tracking-[0.18em] uppercase mb-5 text-left"
                style={{ color: PALETTE.muted }}
              >
                Here&rsquo;s what you just lost:
              </p>

              <div className="space-y-2.5 mb-10 text-left">
                {lostItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                    style={{
                      background: PALETTE.card,
                      border: `1px solid ${PALETTE.cardBorder}`,
                    }}
                  >
                    <span
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: PALETTE.redSoft, border: `1px solid ${PALETTE.redBorder}` }}
                    >
                      <X className="w-3 h-3" style={{ color: PALETTE.red }} strokeWidth={3} />
                    </span>
                    <p className="text-sm md:text-base" style={{ color: PALETTE.muted }}>
                      {item}
                    </p>
                  </motion.div>
                ))}
              </div>

              <p className="text-base md:text-lg text-white font-semibold leading-relaxed">
                If the rest of 2026 looks like the first 4 months, you&rsquo;re going to hit December and realize you wasted an entire year. Again.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ============ GOALS WITHOUT TIME ============ */}
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-8 leading-tight"
                style={{ color: PALETTE.green, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Goals without a time architecture are just wishes.
              </h2>
              <div className="space-y-4 text-base md:text-lg" style={{ color: PALETTE.muted }}>
                <p>
                  You can want $2 million in revenue. You can want to be at every one of your kid&rsquo;s games. You can want to train five times a week.
                </p>
                <p>
                  But if you don&rsquo;t know where the hours are coming from, none of it happens.
                </p>
                <p>
                  Most entrepreneurs fail because they never architect the time required to make it real.
                </p>
                <p className="text-white font-semibold pt-2">
                  That&rsquo;s why I&rsquo;m doing a live workshop:{' '}
                  <span style={{ color: PALETTE.green }}>The Second Quarter Comeback.</span>
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ WHAT YOU'LL BUILD ============ */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                What You&rsquo;ll Build In This
                <br />
                <span style={{ color: PALETTE.green }}>2-Hour Live Session</span>
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto mb-12" style={{ color: PALETTE.muted }}>
                This isn&rsquo;t goal-setting fluff. This is a working session where you build your time architecture for the rest of 2026 in real-time.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-12 text-left">
                {buildItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -2, borderColor: PALETTE.greenBorder }}
                    className={`rounded-2xl p-6 flex items-start gap-4 transition-colors ${
                      i === buildItems.length - 1 ? 'md:col-span-2 md:max-w-md md:mx-auto md:w-full' : ''
                    }`}
                    style={{
                      background: PALETTE.card,
                      border: `1px solid ${PALETTE.cardBorder}`,
                    }}
                  >
                    <div
                      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
                      style={{
                        background: PALETTE.greenSoft,
                        border: `1px solid ${PALETTE.greenBorder}`,
                      }}
                    >
                      <Check className="w-5 h-5" style={{ color: PALETTE.green }} strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-white mb-1.5 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm md:text-[0.95rem] leading-relaxed" style={{ color: PALETTE.muted }}>
                        {item.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <PrimaryCTA onClick={handleAccept}>Yes &mdash; Lock In My Spot For $97</PrimaryCTA>
              <DeclineLink onClick={handleDecline} />
            </motion.div>
          </div>
        </section>

        {/* ============ WHAT'S INCLUDED ============ */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-12 text-center"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                What&rsquo;s <span style={{ color: PALETTE.green }}>Included</span>
              </h2>

              <div className="space-y-3 mb-12">
                {includedItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-4 rounded-xl p-5"
                    style={{
                      background: PALETTE.card,
                      border: `1px solid ${PALETTE.cardBorder}`,
                    }}
                  >
                    <span
                      className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5"
                      style={{ background: PALETTE.greenSoft, border: `1px solid ${PALETTE.greenBorder}` }}
                    >
                      <Check className="w-4 h-4" style={{ color: PALETTE.green }} strokeWidth={3} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-3 mb-1">
                        <h3 className="text-base md:text-lg font-bold text-white leading-snug">
                          {item.title}
                        </h3>
                        {item.value && (
                          <span
                            className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-md shrink-0 self-start md:self-auto"
                            style={{
                              color: PALETTE.green,
                              background: PALETTE.greenSoft,
                              border: `1px solid ${PALETTE.greenBorder}`,
                            }}
                          >
                            {item.value}
                          </span>
                        )}
                      </div>
                      <p className="text-sm md:text-[0.95rem] leading-relaxed" style={{ color: PALETTE.muted }}>
                        {item.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <p
                  className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  What if the rest of 2026 becomes your{' '}
                  <span style={{ color: PALETTE.green }}>comeback?</span>
                </p>
                <p className="text-base md:text-lg" style={{ color: PALETTE.muted }}>
                  It&rsquo;s possible. But only if you architect the time first.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ INVESTMENT ============ */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-12"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                The <span style={{ color: PALETTE.green }}>Investment</span>
              </h2>

              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-10">
                <div className="text-center">
                  <p
                    className="text-xs font-semibold tracking-[0.22em] uppercase mb-2"
                    style={{ color: PALETTE.mutedDark }}
                  >
                    Normally
                  </p>
                  <p
                    className="text-4xl md:text-5xl font-bold line-through"
                    style={{ color: PALETTE.mutedDark }}
                  >
                    $497
                  </p>
                </div>
                <div
                  className="hidden md:block h-16 w-px"
                  style={{ background: PALETTE.cardBorder }}
                />
                <div className="text-center">
                  <p
                    className="text-xs font-semibold tracking-[0.22em] uppercase mb-2"
                    style={{ color: PALETTE.green }}
                  >
                    Today It&rsquo;s Just
                  </p>
                  <div className="flex items-start justify-center">
                    <span
                      className="text-3xl md:text-4xl font-bold mt-3"
                      style={{ color: PALETTE.green }}
                    >
                      $
                    </span>
                    <span
                      className="text-7xl md:text-8xl font-extrabold leading-none"
                      style={{ color: PALETTE.green, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      97
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="max-w-xl mx-auto space-y-2 text-sm md:text-base mb-10"
                style={{ color: PALETTE.muted }}
              >
                <p>Less than the cost of one wasted hour at your earning rate.</p>
                <p>Less than you&rsquo;ll spend on productivity apps this month that won&rsquo;t fix the problem.</p>
              </div>

              <PrimaryCTA onClick={handleAccept}>Yes &mdash; Lock In My Spot For $97</PrimaryCTA>
              <DeclineLink onClick={handleDecline} />
            </motion.div>
          </div>
        </section>

        {/* ============ GUARANTEE ============ */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
              style={{
                background: PALETTE.card,
                border: `1px solid ${PALETTE.cardBorder}`,
              }}
            >
              {/* 7-day refund badge */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center relative"
                  style={{
                    border: `2px solid ${PALETTE.blue}`,
                    background: PALETTE.blueSoft,
                  }}
                >
                  <span
                    className="text-3xl md:text-4xl font-extrabold leading-none"
                    style={{ color: PALETTE.blue }}
                  >
                    7
                  </span>
                  <span
                    className="text-[0.6rem] md:text-xs font-bold tracking-[0.18em] uppercase mt-1"
                    style={{ color: PALETTE.lightBlue }}
                  >
                    Day Refund
                  </span>
                </div>
              </div>

              <p
                className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-2"
                style={{ color: PALETTE.muted }}
              >
                The Guarantee
              </p>
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-6"
                style={{ color: PALETTE.green, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                You Risk Nothing.
              </h2>
              <div
                className="space-y-3 text-base md:text-lg max-w-xl mx-auto"
                style={{ color: PALETTE.muted }}
              >
                <p>Show up to the workshop. Use the workbook.</p>
                <p>
                  If you don&rsquo;t walk away with a clear plan for the rest of 2026 worth at least{' '}
                  <span className="text-white font-bold">10 times what you paid</span>, email me within 7 days. I&rsquo;ll refund every penny.{' '}
                  <span className="text-white font-bold">You risk nothing.</span>
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ YOUR CHOICE ============ */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-12 text-center"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Here&rsquo;s <span style={{ color: PALETTE.green }}>Your Choice</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-5 mb-10">
                <div
                  className="rounded-2xl p-6 md:p-8 relative"
                  style={{
                    background: PALETTE.card,
                    border: `1px solid ${PALETTE.cardBorder}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: PALETTE.redSoft, border: `1px solid ${PALETTE.redBorder}` }}
                    >
                      <X className="w-4 h-4" style={{ color: PALETTE.red }} strokeWidth={3} />
                    </span>
                    <span
                      className="text-xs font-bold tracking-[0.2em] uppercase"
                      style={{ color: PALETTE.muted }}
                    >
                      Option A
                    </span>
                  </div>
                  <div className="space-y-4 text-sm md:text-base" style={{ color: PALETTE.muted }}>
                    <p>Let the rest of 2026 slip away the same way the first 4 months did.</p>
                    <p>Hope and hustle without a plan or a proven system.</p>
                    <p>Hit December and realize you wasted an entire year.</p>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-6 md:p-8 relative"
                  style={{
                    background: `linear-gradient(160deg, rgba(136, 237, 12, 0.08) 0%, ${PALETTE.card} 60%)`,
                    border: `1.5px solid ${PALETTE.greenBorder}`,
                    boxShadow: '0 0 40px rgba(136, 237, 12, 0.08)',
                  }}
                >
                  <div className="absolute -top-3 right-5">
                    <span
                      className="text-[0.65rem] font-bold tracking-[0.18em] uppercase px-3 py-1 rounded-full"
                      style={{ background: PALETTE.green, color: '#000' }}
                    >
                      Recommended
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: PALETTE.greenSoft, border: `1px solid ${PALETTE.greenBorder}` }}
                    >
                      <Check className="w-4 h-4" style={{ color: PALETTE.green }} strokeWidth={3} />
                    </span>
                    <span
                      className="text-xs font-bold tracking-[0.2em] uppercase"
                      style={{ color: PALETTE.green }}
                    >
                      Option B
                    </span>
                  </div>
                  <div className="space-y-4 text-sm md:text-base">
                    <p style={{ color: PALETTE.muted }}>
                      Spend two hours with me building the architecture that turns the rest of 2026 into your comeback.
                    </p>
                    <p className="text-white font-semibold">
                      Finish the year proving you can own your time, scale your business, and show up for what matters.
                    </p>
                  </div>

                  <div className="mt-7">
                    <PrimaryCTA onClick={handleAccept}>Yes &mdash; Lock In My Spot For $97</PrimaryCTA>
                    <p
                      className="text-xs text-center mt-3"
                      style={{ color: PALETTE.mutedDark }}
                    >
                      Secure checkout &middot; Limited spots available
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p
                  className="text-2xl md:text-3xl font-extrabold text-white leading-tight"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  One workshop. <span style={{ color: PALETTE.green }}>Eight months that change everything.</span>
                </p>
                <DeclineLink onClick={handleDecline} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-10"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Stop Hoping.
                <br />
                <span style={{ color: PALETTE.green }}>Start Architecting.</span>
              </h2>

              <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color: PALETTE.muted }}>
                You can&rsquo;t get the first 4 months back. But you still have 8 months left in 2026.
              </p>

              <div
                className="flex items-baseline justify-center gap-4 md:gap-8 mb-10 flex-wrap"
                style={{ color: PALETTE.green }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl md:text-8xl font-extrabold leading-none">32</span>
                  <span className="text-sm md:text-base font-semibold tracking-[0.2em] uppercase">weeks</span>
                </div>
                <span className="text-3xl md:text-5xl font-light" style={{ color: PALETTE.muted }}>
                  &times;
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl md:text-8xl font-extrabold leading-none">5,376</span>
                  <span className="text-sm md:text-base font-semibold tracking-[0.2em] uppercase">hours</span>
                </div>
              </div>

              <p
                className="text-base md:text-lg mb-6 max-w-xl mx-auto"
                style={{ color: PALETTE.muted }}
              >
                That&rsquo;s enough time to break through your revenue ceiling, reclaim your health, show up for your family, and prove you can build wealth without sacrifice.
              </p>

              <p className="text-lg md:text-xl text-white font-semibold mb-10">
                But only if you own your time instead of letting it own you.
              </p>

              <PrimaryCTA onClick={handleAccept}>Yes &mdash; Lock In My Spot For $97</PrimaryCTA>
              <p
                className="text-xs mt-4"
                style={{ color: PALETTE.mutedDark }}
              >
                30-day money-back guarantee &middot; Secure checkout
              </p>
              <DeclineLink onClick={handleDecline} />
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="py-8 px-4 border-t"
          style={{ borderColor: PALETTE.cardBorder }}
        >
          <div
            className="max-w-6xl mx-auto text-center text-xs"
            style={{ color: PALETTE.mutedDark }}
          >
            <p>&copy; {new Date().getFullYear()} Bill Korman. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
