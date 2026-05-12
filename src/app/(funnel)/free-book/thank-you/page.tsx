'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Target, Route, ShieldCheck, CalendarCheck, Package, User, MapPin, Mail, Play, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import FunnelCTA from '@/components/funnel/FunnelCTA';

interface OrderItem {
  name: string;
  price: number;
  note: string;
}

interface OrderData {
  items: OrderItem[];
  shipping: number;
  total: number;
}

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const callBenefits = [
  { icon: Clock, text: 'Pinpoint your biggest time leaks + energy drains' },
  { icon: Target, text: 'Identify the #1 bottleneck holding your business back' },
  { icon: Route, text: 'Outline a custom roadmap using the 168 framework' },
];

export default function ThankYouPage() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    const customerData = sessionStorage.getItem('funnelCustomer');
    const orderData = sessionStorage.getItem('funnelOrder');
    if (customerData) setCustomer(JSON.parse(customerData));
    if (orderData) {
      const parsed = JSON.parse(orderData);
      setOrder({
        items: parsed.items ?? [],
        shipping: parsed.shipping ?? 0,
        total: parsed.total ?? 0,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Success Header */}
      <div className="bg-accent-500 py-4">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-black font-bold">
            <Check className="w-6 h-6" />
            <span>Order Confirmed!</span>
          </div>
        </div>
      </div>

      {/* Hero: Confirmation + Two-Column Layout */}
      <section className="py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Centered Heading */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-accent-400" />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Your Book Is On Its Way!
              </h1>

              <p className="text-xl text-accent-400 font-semibold">
                Your Time Ownership Journey Has Officially Begun.
              </p>
            </div>

            {/* Two-Column: Summary Left / Book + Items Right */}
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Left Column: Customer Summary */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {customer ? (
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 md:p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      <User className="w-5 h-5 text-primary-400" />
                      Shipping Details
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-neutral-300">
                        <User className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                        <span className="text-white font-medium">{customer.firstName} {customer.lastName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-300">
                        <Mail className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                        <span>{customer.email}</span>
                      </div>
                      <div className="flex items-start gap-3 text-neutral-300">
                        <MapPin className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p>{customer.address}</p>
                          <p>{customer.city}, {customer.state} {customer.zip}</p>
                          <p className="text-neutral-500">{customer.country}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-neutral-800">
                      <div className="flex items-center gap-2 text-sm text-accent-400">
                        <Truck className="w-4 h-4" />
                        <span>Estimated delivery: 5-7 business days</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 md:p-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      <Truck className="w-5 h-5 text-primary-400" />
                      Shipping Details
                    </h3>
                    <p className="text-neutral-400 text-sm">
                      Check your email for shipping confirmation and tracking information.
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Right Column: Book Image + Items */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 md:p-8">
                  {/* Book Image */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-40 h-56 rounded-lg overflow-hidden shadow-2xl shadow-accent-500/10">
                      <Image
                        src="/images/front-cover.jpg"
                        alt="The 168 Game Book"
                        fill
                        className="object-cover object-center"
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    <Package className="w-5 h-5 text-accent-400" />
                    Items Ordered
                  </h3>

                  {order ? (
                    <>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-start justify-between text-sm pb-3 border-b border-neutral-800 last:border-0 last:pb-0">
                            <div>
                              <p className="text-white">{item.name}</p>
                              {item.note && <p className="text-xs text-neutral-500 mt-0.5">{item.note}</p>}
                            </div>
                            <span className={`flex-shrink-0 ml-4 ${item.price === 0 ? 'text-accent-400 font-semibold' : 'text-white font-semibold'}`}>
                              {item.price === 0 ? 'FREE' : `$${item.price.toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-neutral-700 space-y-2 text-sm">
                        <div className="flex justify-between text-neutral-400">
                          <span>Shipping &amp; Handling</span>
                          <span>${order.shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-white font-bold text-lg pt-2">
                          <span>Total</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between text-sm">
                        <p className="text-white">The 168 Game (Book)</p>
                        <span className="text-accent-400 font-semibold ml-4">FREE</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-neutral-700 text-sm">
                        <div className="flex justify-between text-neutral-400">
                          <span>Shipping &amp; Handling</span>
                          <span>$5.95</span>
                        </div>
                        <div className="flex justify-between text-white font-bold text-lg pt-2">
                          <span>Total</span>
                          <span>$5.95</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Confirmation text below the order summary */}
            <div className="text-center mt-12 max-w-2xl mx-auto">
              <p className="text-lg text-neutral-300 mb-3">
                You&apos;ll receive a confirmation email shortly with tracking info and access to any digital bonuses you added to your order.
              </p>
              <p className="text-lg text-neutral-300">
                In just a few days, you&apos;ll hold the exact framework that&apos;s helped 10,000+ entrepreneurs
                reclaim thousands of hours and scale with clarity, not chaos.
              </p>
            </div>

            {/* Motivational text */}
            <div className="text-center mt-10">
              <p className="text-white font-semibold text-lg mb-4">
                You&apos;ve already done what most business owners never do:
              </p>
              <p className="text-accent-400 font-semibold text-xl">
                Taking real action to take back your time.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 bg-neutral-950">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative aspect-video bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden flex items-center justify-center">
              {/* Placeholder - replace with actual video */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                  <Play className="w-10 h-10 text-primary-400 ml-1" />
                </div>
                <p className="text-neutral-500 text-sm">Video coming soon</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Strategy Call CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-center text-neutral-400 mb-6 text-lg">
              Now, let&apos;s make sure you use it wisely.
            </p>

            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Reading the book is powerful.
              </h2>
              <h2 className="text-2xl md:text-3xl font-bold text-accent-400" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                But real transformation starts with implementation.
              </h2>
            </div>

            <p className="text-center text-neutral-300 mb-10 max-w-2xl mx-auto">
              If you&apos;re serious about reclaiming 20+ hours per week, breaking through your next revenue ceiling,
              and designing a business that actually supports your life...
            </p>

            <div className="bg-gradient-to-br from-primary-500/20 to-accent-500/10 border border-primary-500/30 rounded-2xl p-8 md:p-10">
              <div className="text-center mb-8">
                <CalendarCheck className="w-10 h-10 text-primary-400 mx-auto mb-4" />
                <h3 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Book a Free 1:1 Strategy Session with Bill Korman
                </h3>
              </div>

              <p className="text-center text-neutral-300 mb-8">
                During this 30-minute call, we&apos;ll:
              </p>

              <ul className="space-y-4 max-w-lg mx-auto mb-8">
                {callBenefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 text-neutral-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <benefit.icon className="w-4 h-4 text-accent-400" />
                    </div>
                    {benefit.text}
                  </motion.li>
                ))}
              </ul>

              <div className="bg-neutral-900/60 rounded-xl p-5 mb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-primary-400" />
                  <span className="text-white font-semibold">This is NOT a sales call.</span>
                </div>
                <p className="text-neutral-400 text-sm">
                  This is a clarity session for serious builders who want to operate with intention. Not reaction.
                </p>
              </div>

              <div className="text-center mb-6">
                <p className="text-gold-400 font-bold text-lg mb-1">Limited Availability</p>
                <p className="text-neutral-400 text-sm">
                  Due to demand, Bill only takes a select number of strategy calls each month.
                </p>
              </div>

              <div className="text-center">
                <FunnelCTA
                  href="https://link.the168game.com/widget/bookings/book-a-call-the168game"
                  size="xl"
                  className="w-full md:w-auto md:px-12"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apply For A Strategy Call Now
                </FunnelCTA>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final Message */}
      <section className="py-16 bg-accent-500/10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xl text-neutral-300 mb-4">
              To your time, your mission, and your next level,
            </p>
            <p className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              - Bill Korman
            </p>
            <p className="text-neutral-500">
              Creator of The 168 Game<br />
              CEO, Built For Life Financial Agency
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-neutral-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-neutral-600 mb-4">
            &copy; {new Date().getFullYear()} Bill Korman. All rights reserved.
          </p>
          <p className="text-xs text-neutral-700">
            The 168 Game | Time Ownership Framework
          </p>
          <div className="flex justify-center gap-4 mt-4 text-xs text-neutral-600">
            <Link href="/" className="hover:text-neutral-400 transition-colors">
              Main Website
            </Link>
            <span>|</span>
            <Link href="/about" className="hover:text-neutral-400 transition-colors">
              About Bill
            </Link>
            <span>|</span>
            <Link href="/services" className="hover:text-neutral-400 transition-colors">
              Coaching Services
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
