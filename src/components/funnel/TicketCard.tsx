'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import FunnelCTA from './FunnelCTA';

interface TicketCardProps {
  title: string;
  price: string;
  originalValue?: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function TicketCard({
  title,
  price,
  originalValue,
  features,
  highlighted = false,
  ctaText,
  onClick,
  disabled = false,
}: TicketCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className={`
        relative rounded-2xl overflow-hidden
        ${highlighted
          ? 'border-2 border-accent-500 bg-gradient-to-b from-accent-500/10 to-transparent'
          : 'border border-neutral-800 bg-neutral-900/50'
        }
      `}
    >
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 bg-accent-500 text-black text-center py-2 text-sm font-bold">
          MOST POPULAR
        </div>
      )}

      <div className={`p-8 ${highlighted ? 'pt-14' : ''}`}>
        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>

        {/* Price */}
        <div className="mb-6">
          <span className="text-4xl font-bold text-white">{price}</span>
          {originalValue && (
            <div className="mt-1">
              <span className="text-sm text-neutral-500">Total Value: </span>
              <span className="text-sm text-neutral-400 line-through">{originalValue}</span>
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <FunnelCTA
          onClick={onClick}
          disabled={disabled}
          variant={highlighted ? 'accent' : 'primary'}
          size="lg"
          className="w-full"
        >
          {ctaText}
        </FunnelCTA>
      </div>
    </motion.div>
  );
}
