'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, ChevronRight } from 'lucide-react';

interface LogEntry {
  id: string;
  text: string;
  timestamp: number;
  isComplete: boolean;
}

interface AnalysisLoadingModalProps {
  isOpen: boolean;
  progress: number;
  stage: string;
  logs: string[];
}

export default function AnalysisLoadingModal({ 
  isOpen, 
  progress, 
  stage,
  logs 
}: AnalysisLoadingModalProps) {
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([]);
  const [visibleLogIds, setVisibleLogIds] = useState<Set<string>>(new Set());

  // Update displayed logs when new logs arrive
  useEffect(() => {
    if (logs.length === 0) return;

    const newLogs: LogEntry[] = logs.map((log, index) => ({
      id: `log-${index}-${log}`,
      text: log,
      timestamp: Date.now() + index * 100,
      isComplete: false
    }));

    setDisplayedLogs(newLogs);

    // Animate logs in one by one
    newLogs.forEach((log, index) => {
      setTimeout(() => {
        setVisibleLogIds(prev => new Set(prev).add(log.id));
        
        // Mark as complete after a short delay
        setTimeout(() => {
          setDisplayedLogs(current => 
            current.map(l => 
              l.id === log.id ? { ...l, isComplete: true } : l
            )
          );
        }, 300);
      }, index * 150); // Stagger animation
    });
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl mx-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-6 h-6" />
              </motion.div>
              <h2 className="text-2xl font-bold">Analyzing Your Lease</h2>
            </div>
            <p className="text-purple-100 text-sm">
              {stage}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-8 py-6 border-b border-slate-200">
            <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-slate-600">
                Progress
              </span>
              <span className="text-sm font-bold text-purple-600">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Live Activity Log */}
          <div className="px-8 py-6 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {displayedLogs.map((log) => (
                  visibleLogIds.has(log.id) && (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-3 overflow-hidden"
                    >
                      <div className="mt-1 flex-shrink-0">
                        {log.isComplete ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </motion.div>
                        ) : (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-5 h-5 text-purple-600" />
                          </motion.div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className={`text-sm leading-relaxed ${
                            log.isComplete ? 'text-slate-600' : 'text-slate-900 font-medium'
                          }`}
                        >
                          {log.text}
                        </motion.p>
                      </div>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>

              {/* Current activity indicator */}
              {displayedLogs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-200"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                  </motion.div>
                  <span className="text-sm text-slate-500 italic">
                    Processing...
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              This may take 30-60 seconds depending on lease complexity
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

