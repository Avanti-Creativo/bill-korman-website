'use client';

import { motion } from 'framer-motion';
import { Check, Calendar, Video, Target, Clock, TrendingUp, Battery, Map, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FunnelCTA from '@/components/funnel/FunnelCTA';
import UrgencyBanner from '@/components/funnel/UrgencyBanner';

const buildItems = [
  {
    icon: Clock,
    title: 'Audit where the first 4 months actually went',
    text: 'Stop the bleeding and identify the time leaks that killed Q1 and April.',
  },
  {
    icon: TrendingUp,
    title: 'Reverse-engineer your revenue targets into weekly hours',
    text: 'For May through December, so you know exactly where revenue-generating work happens.',
  },
  {
    icon: Battery,
    title: 'Map your energy states',
    text: 'Stop scheduling strategic work when your brain is fried. Match high-value work with peak energy hours.',
  },
  {
    icon: Calendar,
    title: 'Build your week-by-week plan',
    text: 'Know exactly where gym time goes, where family time is protected, and where your $10,000/hour work actually happens.',
  },
  {
    icon: Map,
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

export default function WorkshopUpsellPage() {
  const router = useRouter();

  const handleAccept = () => {
    const order = JSON.parse(sessionStorage.getItem('funnelOrder') || '{}');
    const items = order.items || [];
    items.push({ name: 'The Second Quarter Comeback Workshop', price: 97, note: '' });
    order.items = items;
    order.total = (order.total || 0) + 97;
    sessionStorage.setItem('funnelOrder', JSON.stringify(order));
    router.push('/free-book/thank-you');
  };

  const handleDecline = () => {
    router.push('/free-book/thank-you');
  };

  return (
    <div className="min-h-screen bg-black">
      <UrgencyBanner
        message="FINAL OFFER - One Last Opportunity"
        variant="warning"
        icon="clock"
      />

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-accent-400 font-semibold mb-4">
              You made a powerful decision to take the first step to control your time.
            </p>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Here&apos;s One Final Opportunity To Lock In The Exact Tools To Ensure Your{' '}
              <span className="text-accent-400">New Year Goals Stay On Track</span>
            </h1>

            <p className="text-xl text-neutral-300 mb-8">
              If you&apos;re serious about taking your business to the next level,
              the best time to start is <span className="text-white font-semibold">now</span>.
            </p>

            {/* Offer Box */}
            <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/10 border-2 border-gold-500 rounded-2xl p-8 mb-8">
              <p className="text-gold-400 font-bold text-sm mb-2">THE SECOND QUARTER COMEBACK</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Build Your Plan To Get Back On Track To Your 2026 Goals
              </h2>
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-4 text-neutral-300">
                <span className="flex items-center gap-2"><Video className="w-5 h-5 text-accent-400" /> Live Workshop</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2"><Calendar className="w-5 h-5 text-accent-400" /> May 27th, 2026</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-accent-400" /> 2 Hours That Change Everything</span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-6">
                <span className="text-neutral-400 text-lg">Just</span>
                <span className="text-5xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>$97</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Brutal Truth */}
      <section className="py-24 md:py-32 bg-neutral-950">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.h2
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Q1 Is Over. April Is Gone.
            </motion.h2>
            <p className="text-2xl md:text-3xl text-accent-400 font-bold mb-12">
              120 days. 2,880 hours.
            </p>

            <div className="text-left bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 md:p-10 mb-10">
              <p className="text-2xl text-white font-bold mb-6">
                Be honest: did you hit your goals?
              </p>
              <p className="text-lg text-neutral-300 mb-6">
                You set big plans in January: Revenue targets, fitness goals, family commitments.
                Now that it&apos;s May, how many did you actually accomplish?
              </p>
              <p className="text-xl text-red-400 font-semibold mb-4">
                Here&apos;s what you just lost:
              </p>
              <ul className="space-y-3 text-lg text-neutral-300 mb-6">
                <li>• At your earning rate, that&apos;s thousands of dollars in lost opportunity.</li>
                <li>• Your kids got 4 months older and you still weren&apos;t there for the moments.</li>
                <li>• Your body got weaker, not stronger.</li>
                <li>• Your marriage drifted further.</li>
                <li>• And your business? Still stuck at the same ceiling.</li>
              </ul>
              <p className="text-xl text-white font-bold">
                If the rest of 2026 looks like the first 4 months, you&apos;re going to hit December
                and realize you wasted an entire year. <span className="text-red-400">Again.</span>
              </p>
            </div>

            <div className="text-left max-w-3xl mx-auto">
              <p className="text-xl md:text-2xl text-white font-bold mb-6 text-center">
                Goals without a time architecture are just wishes.
              </p>
              <p className="text-lg text-neutral-300 mb-4">
                You can want $2 million in revenue. You can want to be at every one of your kid&apos;s games.
                You{'\u00A0'}can want to train five times a week.
              </p>
              <p className="text-lg text-neutral-300 mb-4">
                But if you don&apos;t know where the hours are coming from, none of it happens.
              </p>
              <p className="text-lg text-neutral-400 mb-6">
                Most entrepreneurs fail because they never architect the time required to make it real.
              </p>
              <p className="text-xl text-accent-400 font-semibold text-center">
                That&apos;s why I&apos;m doing a live workshop: <span className="text-white">The Second Quarter Comeback.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What You'll Build */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center">
                <Target className="w-10 h-10 text-primary-400" />
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                What You&apos;ll Build In This <span className="text-accent-400">2-Hour Live Session</span>
              </h2>
            </div>

            <p className="text-lg text-neutral-400 text-center max-w-3xl mx-auto mb-12">
              This isn&apos;t goal-setting fluff. This is a working session where you build your
              time architecture for the rest of 2026 in real-time.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {buildItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className="flex items-start gap-4 p-6 bg-neutral-900/50 border border-neutral-800 hover:border-accent-500/50 rounded-2xl transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6 text-accent-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-base text-neutral-400">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <FunnelCTA onClick={handleAccept} size="xl" className="mb-3">
                Yes - Lock In My Spot For $97
              </FunnelCTA>
              <div>
                <button
                  onClick={handleDecline}
                  className="text-neutral-500 hover:text-neutral-400 text-sm underline transition-colors"
                >
                  No thanks, I&apos;ll pass on this offer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-24 md:py-32 bg-neutral-950">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-12" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              What&apos;s <span className="text-accent-400">Included</span>
            </h2>

            <div className="space-y-4 mb-12">
              {includedItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-4 p-5 bg-neutral-900/50 border border-neutral-800 rounded-xl"
                >
                  <Check className="w-6 h-6 text-accent-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      {item.value && (
                        <span className="text-sm text-gold-400 font-semibold">{item.value}</span>
                      )}
                    </div>
                    <p className="text-base text-neutral-400">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.p
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl md:text-3xl text-white font-bold text-center"
            >
              What if the rest of 2026 becomes your comeback?
            </motion.p>
            <p className="text-lg text-neutral-400 text-center mt-3">
              It&apos;s possible. But only if you architect the time first.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Investment */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-10" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              The <span className="text-accent-400">Investment</span>
            </h2>

            <div className="inline-flex flex-col items-center gap-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 md:p-10 mb-10">
              <p className="text-xl text-neutral-300">
                Normally, this workshop would be <span className="line-through text-neutral-500">$497</span>.
              </p>
              <p className="text-2xl md:text-3xl text-white font-bold">
                But because you&apos;ve already invested in The 168 Game,
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-lg text-neutral-400">today it&apos;s just</span>
                <span className="text-6xl font-bold text-accent-400" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>$97</span>
              </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-3 text-lg text-neutral-400 mb-10">
              <p>Less than the cost of one wasted hour at your earning rate.</p>
              <p>Less than you&apos;ll spend on productivity apps this month that won&apos;t fix the problem.</p>
            </div>

            <FunnelCTA onClick={handleAccept} size="xl" className="mb-3">
              Yes - Lock In My Spot For $97
            </FunnelCTA>
            <div>
              <button
                onClick={handleDecline}
                className="text-neutral-500 hover:text-neutral-400 text-sm underline transition-colors"
              >
                No thanks, I&apos;ll pass on this offer
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Guarantee */}
      <section className="py-24 md:py-32 bg-neutral-950">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center bg-primary-500/10 border-2 border-primary-500/50 rounded-2xl p-8 md:p-12"
          >
            <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-6">
              <Award className="w-12 h-12 text-accent-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              The <span className="text-accent-400">Guarantee</span>
            </h2>
            <p className="text-xl text-neutral-300 mb-4">
              Show up to the workshop. Use the workbook.
            </p>
            <p className="text-lg text-neutral-300 mb-6">
              If you don&apos;t walk away with a clear plan for the rest of 2026 worth at least
              <span className="text-white font-bold"> 10 times what you paid</span>, email me within 7 days.
              I&apos;ll refund every penny.
            </p>
            <p className="text-2xl text-white font-bold">
              You risk nothing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Your Choice */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-12" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Here&apos;s <span className="text-accent-400">Your Choice</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-red-500/5 border-2 border-red-500/30 rounded-2xl p-8">
                <p className="text-sm font-bold text-red-400 mb-3">OPTION A</p>
                <p className="text-lg text-neutral-300 mb-4">
                  Let the rest of 2026 slip away the same way the first 4 months did.
                </p>
                <p className="text-lg text-neutral-400 mb-4">
                  Hope and hustle without a plan or a proven system.
                </p>
                <p className="text-lg text-red-400 font-semibold">
                  Hit December and realize you wasted an entire year.
                </p>
              </div>

              <div className="bg-accent-500/5 border-2 border-accent-500/50 rounded-2xl p-8">
                <p className="text-sm font-bold text-accent-400 mb-3">OPTION B</p>
                <p className="text-lg text-neutral-300 mb-4">
                  Spend two hours with me building the architecture that turns the rest of 2026 into your comeback.
                </p>
                <p className="text-lg text-white font-semibold">
                  Finish the year proving you can own your time, scale your business, and show up for what matters.
                </p>
              </div>
            </div>

            <motion.p
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl md:text-3xl text-white font-bold text-center mb-10"
            >
              One workshop. Eight months that change everything.
            </motion.p>

            <div className="text-center">
              <FunnelCTA onClick={handleAccept} size="xl" className="mb-3">
                Yes - Lock In My Spot For $97
              </FunnelCTA>
              <p className="text-sm text-neutral-500 mb-3">
                Secure checkout - Limited spots available
              </p>
              <div>
                <button
                  onClick={handleDecline}
                  className="text-neutral-500 hover:text-neutral-400 text-sm underline transition-colors"
                >
                  No thanks, I&apos;ll pass on this offer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 bg-red-500/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.h2
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Stop Hoping. <span className="text-accent-400">Start Architecting.</span>
            </motion.h2>

            <p className="text-xl text-neutral-300 mb-4">
              You can&apos;t get the first 4 months back. But you still have 8 months left in 2026.
            </p>
            <p className="text-2xl md:text-3xl text-accent-400 font-bold mb-8">
              32 weeks. 5,376 hours.
            </p>

            <p className="text-lg text-neutral-300 mb-10 max-w-2xl mx-auto">
              That&apos;s enough time to break through your revenue ceiling, reclaim your health,
              show{'\u00A0'}up for your family, and prove you can build wealth without sacrifice.
            </p>

            <p className="text-xl text-white font-semibold mb-10">
              But only if you own your time instead of letting it own you.
            </p>

            <FunnelCTA onClick={handleAccept} size="xl" className="mb-4">
              Yes - Lock In My Spot For $97
            </FunnelCTA>

            <p className="text-sm text-neutral-500 mb-6">
              30-day money-back guarantee - Secure checkout
            </p>

            <div>
              <button
                onClick={handleDecline}
                className="text-neutral-500 hover:text-neutral-400 text-base underline transition-colors"
              >
                No thanks, I&apos;ll pass on this offer
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-neutral-600">
          <p>&copy; {new Date().getFullYear()} Bill Korman. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
