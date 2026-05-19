'use client';

import { motion } from 'framer-motion';
import { Check, Users, Video, MessageSquare, FileText, Calendar, Star, Shield, Clock, Zap, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FunnelCTA from '@/components/funnel/FunnelCTA';
import UrgencyBanner from '@/components/funnel/UrgencyBanner';

const features = [
  { icon: Calendar, title: '6-Month Accelerator Roadmap', desc: 'Your custom game plan, tailored to your business model, bottlenecks, and goals.', value: '$2,500' },
  { icon: Video, title: 'Bi-Weekly Coaching Calls (Live With Bill)', desc: 'Tactical strategy sessions where we rip apart your calendar, revenue systems, and energy flow. Together.', value: '$6,000' },
  { icon: Users, title: 'Ongoing Community Support', desc: 'Get feedback, ideas, and accountability from others running real businesses.', value: '$1,500' },
  { icon: MessageSquare, title: 'Peer Accountability & Hot Seats', desc: "Weekly hot seats = YOUR business in focus. You'll get direct coaching on what's keeping you stuck.", value: '$3,000' },
  { icon: Users, title: 'Access to Private Community', desc: 'Connect with an exclusive group of other founders mastering time ownership.', value: '$1,200' },
  { icon: FileText, title: 'Complete Resource Library', desc: "Templates, frameworks, and tools used by $10M+ entrepreneurs to run their businesses.", value: '$2,000' },
];

const bonuses = [
  { title: 'The 168 Integration Workbook', value: '$497', desc: 'Step-by-step implementation guide' },
  { title: 'Quarterly Planning Framework', value: '$997', desc: 'Plan your next 90 days with precision' },
  { title: 'Revenue Forensics Calculator', value: '$297', desc: 'Know exactly what makes you money' },
  { title: 'Energy Mapping System', value: '$397', desc: 'Optimize your peak performance hours' },
];

export default function MasteryUpsellPage() {
  const router = useRouter();

  const handleAccept = (plan: 'full' | 'payments') => {
    // Save mastery to order
    const order = JSON.parse(sessionStorage.getItem('funnelOrder') || '{}');
    const items = order.items || [];
    items.push({ name: 'Time Ownership Accelerator (6-Month)', price: 7500, note: plan === 'payments' ? 'Payment plan' : 'Paid in full' });
    order.items = items;
    order.total = (order.total || 0) + 7500;
    sessionStorage.setItem('funnelOrder', JSON.stringify(order));
    router.push('/workshop');
  };

  const handleDecline = () => {
    router.push('/free-book/course');
  };

  const totalValue = 16200 + 2188; // features + bonuses
  const price = 7500;
  const savings = totalValue - price;

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <UrgencyBanner
        message="EXCLUSIVE OFFER - Only 5 Spots Available This Quarter"
        variant="warning"
        icon="alert"
      />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28">
        {/* Animated background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Pre-headline badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="inline-flex items-center gap-2 bg-accent-500/20 border border-accent-500/50 rounded-full px-6 py-2 mb-8"
            >
              <Sparkles className="w-5 h-5 text-accent-400" />
              <span className="text-accent-400 font-semibold text-lg">You've Got The Playbook. Now Get The Support.</span>
            </motion.div>

            {/* Main Headline */}
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-gradient-x bg-clip-text text-transparent bg-[length:200%_auto]"
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                backgroundImage: 'linear-gradient(90deg, #7ED321, #3498db, #7ED321)',
              }}
            >
              TRANSFORM YOUR BUSINESS IN 90 DAYS
            </h1>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              With <span className="text-primary-400">Expert Coaching</span> & <span className="text-accent-400">Elite Accountability</span>
            </h2>

            <p className="text-xl md:text-2xl text-neutral-300 mb-10 max-w-3xl mx-auto">
              Join an exclusive group of entrepreneurs implementing The 168 Game framework together—with direct access to Bill Korman.
            </p>

            {/* Program Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative max-w-2xl mx-auto"
            >
              {/* Animated border glow */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(52, 152, 219, 0.3), 0 0 60px rgba(126, 211, 33, 0.2)',
                    '0 0 50px rgba(52, 152, 219, 0.5), 0 0 100px rgba(126, 211, 33, 0.3)',
                    '0 0 30px rgba(52, 152, 219, 0.3), 0 0 60px rgba(126, 211, 33, 0.2)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl"
              />

              <div className="relative bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-primary-500/50 rounded-3xl p-8 md:p-10">
                {/* Limited spots badge */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-2 rounded-full font-bold text-sm"
                >
                  ONLY 5 SPOTS LEFT THIS QUARTER
                </motion.div>

                <div className="flex items-center justify-center gap-3 mb-4">
                  <Trophy className="w-10 h-10 text-gold-400" />
                  <h3 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    TIME OWNERSHIP ACCELERATOR
                  </h3>
                </div>

                <p className="text-xl text-primary-400 font-semibold mb-6">6-Month Elite Group Coaching Program</p>

                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="bg-neutral-800/50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-white">6</p>
                    <p className="text-neutral-400">Months of Coaching</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-accent-400">12</p>
                    <p className="text-neutral-400">Live Calls w/ Bill</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-gold-400">5</p>
                    <p className="text-neutral-400">Entrepreneurs Max</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-gradient-to-b from-neutral-950 to-black">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              "I JUST NEED A SYSTEM THAT <span className="text-accent-400">ACTUALLY WORKS</span>..."
            </h2>

            <p className="text-xl md:text-2xl text-neutral-300 mb-6">
              That's what we hear from entrepreneurs <span className="text-white font-semibold">every single day</span>.
            </p>

            <p className="text-xl md:text-2xl text-neutral-300 mb-6">
              You've got the talent. You've built momentum. You're making money.
            </p>

            <motion.p
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl md:text-3xl text-white font-bold mb-8"
            >
              But what you DON'T have is <span className="text-accent-400 text-3xl md:text-4xl">FREEDOM</span>.
            </motion.p>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 mb-8">
              <p className="text-xl text-neutral-300 mb-4">
                You need a way to consistently scale <span className="text-white font-semibold">without burning out</span>.
              </p>
              <p className="text-xl text-neutral-300">
                A system for aligning your time with <span className="text-primary-400">revenue</span>, <span className="text-accent-400">results</span>, and <span className="text-gold-400">real life</span>.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-primary-500/20 via-accent-500/20 to-primary-500/20 border border-accent-500/50 rounded-2xl p-8"
            >
              <p className="text-2xl md:text-3xl font-bold text-white mb-2">
                The Time Ownership Accelerator is <span className="text-accent-400">exactly that</span>.
              </p>
              <p className="text-xl text-accent-300">
                Coaching for entrepreneurs who are DONE doing it all and ready to buy back their time.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What's Included - Feature Cards */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              EVERYTHING YOU GET INSIDE THE ACCELERATOR
            </h2>
            <p className="text-xl text-center mb-12">
              <span className="text-accent-400 font-bold text-2xl">Total Value: ${totalValue.toLocaleString()}</span>
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="relative bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-primary-500/50 rounded-2xl p-6 transition-all duration-300"
                >
                  {/* Value badge */}
                  <div className="absolute -top-3 -right-3 bg-accent-500 text-black font-bold px-3 py-1 rounded-full text-sm">
                    {feature.value} VALUE
                  </div>

                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 10 }}
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/30 to-accent-500/20 flex items-center justify-center shrink-0"
                    >
                      <feature.icon className="w-7 h-7 text-primary-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-base text-neutral-400">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bonuses Section */}
      <section className="py-20 bg-gradient-to-b from-black via-accent-950/20 to-black">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-12">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-4"
              >
                <Sparkles className="w-12 h-12 text-gold-400" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                PLUS THESE <span className="text-gold-400">EXCLUSIVE BONUSES</span>
              </h2>
              <p className="text-xl text-neutral-400">
                Yours FREE when you join today
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {bonuses.map((bonus, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 bg-gradient-to-r from-gold-500/10 to-transparent border border-gold-500/30 rounded-xl p-5"
                >
                  <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-6 h-6 text-gold-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white">{bonus.title}</h4>
                    <p className="text-sm text-neutral-400">{bonus.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gold-400">{bonus.value}</p>
                    <p className="text-xs text-neutral-500">VALUE</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Stack & Pricing */}
      <section className="py-20 bg-neutral-950">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Value Stack */}
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                LET'S ADD IT ALL UP...
              </h2>

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 mb-8">
                <div className="space-y-4 text-left max-w-xl mx-auto">
                  {features.map((feature, index) => (
                    <div key={index} className="flex justify-between items-center text-lg">
                      <span className="text-neutral-300">{feature.title}</span>
                      <span className="text-white font-semibold">{feature.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-neutral-700 pt-4 mt-4">
                    {bonuses.map((bonus, index) => (
                      <div key={index} className="flex justify-between items-center text-lg mb-2">
                        <span className="text-gold-400">{bonus.title}</span>
                        <span className="text-gold-400 font-semibold">{bonus.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t-2 border-accent-500/50 mt-6 pt-6">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span className="text-accent-400">TOTAL VALUE:</span>
                    <span className="text-accent-400">${totalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-center text-white mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                YOUR INVESTMENT TODAY
              </h3>
              <p className="text-center text-2xl mb-8">
                <span className="text-neutral-400 line-through">${totalValue.toLocaleString()}</span>
                <span className="text-accent-400 font-bold ml-4">SAVE ${savings.toLocaleString()}!</span>
              </p>

              <div className="max-w-md mx-auto">
                {/* One-time payment */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-primary-500/50 rounded-2xl p-8"
                >
                  <h4 className="text-2xl font-bold text-white mb-2">One-Time Payment</h4>
                  <p className="text-neutral-400 mb-4">Best Value - Save $501</p>
                  <div className="mb-6">
                    <span className="text-6xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>$7,500</span>
                  </div>
                  <FunnelCTA onClick={() => handleAccept('full')} variant="primary" size="xl" className="w-full">
                    YES! Add This To My Order
                  </FunnelCTA>
                  <p className="text-neutral-400 text-sm mt-4 text-center">Payment plans available</p>
                </motion.div>
              </div>

              {/* Guarantee */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-8 bg-accent-500/10 border border-accent-500/30 rounded-2xl p-6 text-center"
              >
                <Shield className="w-12 h-12 text-accent-400 mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">30-Day Money-Back Guarantee</h4>
                <p className="text-lg text-neutral-300">
                  Show up, do the work, and don't see traction? Let us know within 30 days and we'll refund you. <span className="text-white font-semibold whitespace-nowrap">No questions asked.</span>
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final Urgency Section */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            animate={{
              y: [0, -10, 0],
              boxShadow: [
                '0 0 30px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.2)',
                '0 0 50px rgba(239, 68, 68, 0.6), 0 0 100px rgba(239, 68, 68, 0.3)',
                '0 0 30px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.2)',
              ],
            }}
            transition={{
              y: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
              boxShadow: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="relative bg-gradient-to-b from-red-950 to-neutral-950 border-2 border-red-500 rounded-2xl p-8 md:p-10 text-center overflow-hidden"
          >
            {/* Flying elements */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: '-10%', y: '100%', opacity: 0 }}
                animate={{
                  x: ['0%', '110%'],
                  y: ['100%', '-20%'],
                  opacity: [0, 0.5, 0.5, 0],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'easeOut',
                }}
                className="absolute text-red-500/20 pointer-events-none"
                style={{ left: `${10 + i * 18}%` }}
              >
                <Clock className="w-12 h-12" />
              </motion.div>
            ))}

            {/* Flashing border */}
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl border-2 border-red-400 pointer-events-none"
            />

            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1.1, 1.1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="flex justify-center mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500">
                  <Zap className="w-10 h-10 text-red-400" />
                </div>
              </motion.div>

              <motion.h2
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-red-400 mb-4"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                THIS PAGE DISAPPEARS FOREVER
              </motion.h2>

              <p className="text-2xl md:text-3xl text-white font-bold mb-6">
                Once you leave, this offer is GONE.
              </p>

              <p className="text-xl text-neutral-300 mb-6">
                You'll never see the Time Ownership Accelerator at{' '}
                <span className="text-red-400 font-semibold">this price</span> again.
              </p>

              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 mb-8"
              >
                <p className="text-xl md:text-2xl text-white font-bold">
                  Make your decision NOW. The opportunity is slipping away with every second.
                </p>
              </motion.div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <FunnelCTA onClick={() => handleAccept('full')} variant="primary" size="xl">
                  Add To My Order - $7,500
                </FunnelCTA>
              </div>
              <p className="text-neutral-400 text-sm mb-4">Payment plans available</p>

              <button
                onClick={handleDecline}
                className="text-neutral-500 hover:text-neutral-400 text-base underline transition-colors"
              >
                No thanks, I'll pass on this exclusive offer
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-neutral-500 mb-2">
            30-day money-back guarantee • Lifetime access • This offer expires when you leave this page
          </p>
          <p className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} Bill Korman. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
