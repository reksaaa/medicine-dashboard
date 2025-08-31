'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, Activity, Pill, Stethoscope } from 'lucide-react'

export default function CTA() {
  const router = useRouter()

  return (
    <section className="relative overflow-hidden bg-[#00B9AD] py-32">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0">
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          className="absolute inset-0 opacity-5"
          animate={{
            backgroundPosition: ['0px 0px', '40px 40px']
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            backgroundImage: 'linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating Medical Icons */}
        {[Activity, Pill, Stethoscope].map((Icon, index) => (
          <motion.div
            key={index}
            className="absolute text-white/5"
            initial={{ y: 0 }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
            }}
            transition={{
              duration: 5 + index,
              delay: index * 0.5,
              repeat: Infinity,
              repeatType: "mirror",
            }}
            style={{
              left: `${20 + index * 30}%`,
              top: `${20 + index * 20}%`,
              transform: `rotate(${index * 45}deg)`,
            }}
          >
            <Icon size={40 + index * 10} />
          </motion.div>
        ))}

        {/* Animated Circles */}
        {[...Array(5)].map((_, index) => (
          <motion.div
            key={`circle-${index}`}
            className="absolute rounded-full bg-white/5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4 + index,
              delay: index * 0.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              width: `${100 + index * 50}px`,
              height: `${100 + index * 50}px`,
              left: `${10 + index * 20}%`,
              top: `${20 + index * 15}%`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-xl text-white/90 mb-12"
          >
            Join healthcare leaders in smarter inventory management today!
          </motion.p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <button
              onClick={() => router.push('/register')}
              className="group relative overflow-hidden rounded-full bg-yellow-300 px-8 py-4 text-lg font-semibold text-gray-900 transition-colors hover:bg-yellow-400"
            >
              <motion.span
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
              <span className="relative flex items-center gap-2">
                Sign Up Now
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

