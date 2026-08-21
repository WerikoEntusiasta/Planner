/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import PricingSection from './PricingSection';
import { User } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onPlanUpdated?: (plan: 'free' | 'starter' | 'basic' | 'pro' | 'growth') => void;
}

export default function PricingModal({
  isOpen,
  onClose,
  currentUser,
  onPlanUpdated,
}: PricingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-6xl bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 sm:p-8 relative my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-panel-border/40 transition-all cursor-pointer z-10"
        >
          <X size={20} />
        </button>

        <PricingSection
          userEmail={currentUser?.email || ''}
          userName={currentUser?.name || ''}
          userId={currentUser?.id || ''}
        />
      </motion.div>
    </div>
  );
}
