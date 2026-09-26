'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export default function KpiCard({
  title,
  value,
  icon: Icon,
  gradient,
  alert = false,
  delay = 0,
}: {
  title: string;
  value: number | string;
  icon: LucideIcon;
  gradient: string;
  alert?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`glass rounded-2xl p-5 card-hover relative overflow-hidden ${
        alert ? 'ring-1 ring-amber-500/50' : ''
      }`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
