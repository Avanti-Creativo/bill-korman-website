'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, CreditCard, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import OrderBump from '@/components/funnel/OrderBump';
import FunnelCTA from '@/components/funnel/FunnelCTA';

export default function CheckoutPage() {
  const router = useRouter();
  const [orderBump, setOrderBump] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

  const basePrice = 5.95;
  const bumpPrice = 47;
  const total = orderBump ? basePrice + bumpPrice : basePrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Save customer info and order to sessionStorage
    const orderItems = [
      { name: 'The 168 Game (Book)', price: 0, note: 'Free + $5.95 shipping' },
    ];
    if (orderBump) {
      orderItems.push({ name: 'Quick Start Implementation Guide', price: bumpPrice, note: '' });
    }
    sessionStorage.setItem('funnelCustomer', JSON.stringify({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      country: formData.country,
    }));
    sessionStorage.setItem('funnelOrder', JSON.stringify({
      items: orderItems,
      shipping: basePrice,
      total: total,
    }));

    // Capture the lead in GHL. Best-effort: never block the funnel, and bail
    // out after 8s so a slow/hung request can't trap the customer. Payment
    // fields are deliberately excluded from this payload.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      await fetch('/api/funnel-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
          orderBump,
          total,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      console.error('Lead capture failed:', err);
    } finally {
      clearTimeout(timeout);
    }

    // Mock checkout - redirect to first upsell (always, regardless of capture)
    router.push('/free-book/mastery');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-neutral-950 border-b border-neutral-900 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/free-book" className="text-2xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              THE 168 GAME
            </Link>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Lock className="w-4 h-4" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-neutral-950 py-3">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-accent-400 font-semibold">Step 1: Shipping Info</span>
            <span className="text-neutral-600">→</span>
            <span className="text-neutral-500">Step 2: Special Offers</span>
            <span className="text-neutral-600">→</span>
            <span className="text-neutral-500">Step 3: Confirmation</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left: Form */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl font-bold text-white mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Shipping & Payment Information
              </h1>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact Info */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center">1</span>
                    Contact Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center">2</span>
                    Shipping Address
                  </h2>
                  <div className="space-y-4">
                    <Input
                      label="Street Address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                      required
                    />
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="New York"
                        required
                      />
                      <Input
                        label="State"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="NY"
                        required
                      />
                      <Input
                        label="ZIP Code"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        placeholder="10001"
                        required
                      />
                    </div>
                    <Input
                      label="Country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled
                    />
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center">3</span>
                    Payment Information
                  </h2>
                  <div className="space-y-4">
                    <Input
                      label="Card Number"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="4242 4242 4242 4242"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry Date"
                        name="expiry"
                        value={formData.expiry}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        required
                      />
                      <Input
                        label="CVC"
                        name="cvc"
                        value={formData.cvc}
                        onChange={handleInputChange}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Order Bump */}
                <OrderBump
                  title="Add The Quick Start Implementation Guide"
                  price="$47"
                  originalPrice="$250"
                  description="Don't just read the book—get the exact roadmap to implement it immediately. Get the step-by-step process to reclaim 10+ hours THIS WEEK."
                  features={[
                    "Step-by-Step Guide – Follow the exact implementation checklist Bill uses with $15K coaching clients",
                    "Complete Time Tracking System – Audit where every hour goes (Excel + Google Sheets)",
                    "Energy Mapping Worksheet – Identify your peak performance windows in under 10 minutes",
                    "Revenue Forensics Calculator – Discover which activities actually make you money",
                  ]}
                  checked={orderBump}
                  onChange={setOrderBump}
                />

                <p className="text-sm text-neutral-500 text-center">
                  Start implementing before the book even arrives. This is a ONE-TIME offer.
                  You won't see this again after checkout.
                </p>

                {/* Submit Button */}
                <div className="pt-4">
                  <FunnelCTA
                    type="submit"
                    size="xl"
                    className="w-full"
                    showArrow={false}
                    disabled={isSubmitting}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" />
                      {isSubmitting ? 'Processing…' : `Complete Order - $${total.toFixed(2)}`}
                    </span>
                  </FunnelCTA>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-6 pt-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Shield className="w-4 h-4" />
                    <span>30-Day Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Lock className="w-4 h-4" />
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <CreditCard className="w-4 h-4" />
                    <span>Secure Payment</span>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-8"
            >
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>

                {/* Book Preview */}
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-neutral-800">
                  <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden shadow-lg relative">
                    <Image
                      src="/images/front-cover.jpg"
                      alt="The Time Ownership Playbook"
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">The Time Ownership Playbook</h3>
                    <p className="text-sm text-neutral-400">Digital Workbook</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-accent-400 font-bold">FREE</span>
                      <span className="text-neutral-500 line-through text-sm">$497.00</span>
                    </div>
                  </div>
                </div>

                {/* Order Bump in Summary */}
                {orderBump && (
                  <div className="flex items-start gap-4 mb-6 pb-6 border-b border-neutral-800">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-gold-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm">Quick Start Implementation Guide</h3>
                      <p className="text-xs text-neutral-400">Digital Download</p>
                    </div>
                    <span className="text-white font-semibold">$47.00</span>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal</span>
                    <span>{orderBump ? '$47.00' : '$0.00'}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Shipping & Handling</span>
                    <span>$5.95</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg pt-3 border-t border-neutral-800">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Guarantee */}
                <div className="bg-accent-500/10 border border-accent-500/30 rounded-lg p-4 text-center">
                  <Shield className="w-8 h-8 text-accent-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-300">
                    <span className="text-white font-semibold">30-Day Money-Back Guarantee</span>
                    <br />
                    Don't love it? Get a full refund. No questions asked.
                  </p>
                </div>
              </div>

              {/* What You're Getting */}
              <div className="mt-6 p-6 bg-neutral-950 rounded-xl border border-neutral-900">
                <h3 className="font-semibold text-white mb-4">What You're Getting:</h3>
                <ul className="space-y-2">
                  {[
                    'Physical copy of The 168 Game',
                    'Instant digital access while you wait',
                    'The complete time ownership framework',
                    '10 chapters of actionable strategies',
                    '30-day money-back guarantee',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-neutral-400">
                      <Check className="w-4 h-4 text-accent-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-neutral-600">
          <p>&copy; {new Date().getFullYear()} Bill Korman. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
