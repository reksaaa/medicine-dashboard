'use client'

import { motion } from 'framer-motion'
import { Activity,  } from 'lucide-react'

export default function About() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-64 top-0 h-[500px] w-[500px] opacity-5"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Activity className="h-full w-full text-[#00B9AD]" />
        </motion.div>
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              What is <span className="text-[#00B9AD]">Si</span>
              <span className="text-yellow-400">Modis</span> Dashboard?
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Decorative elements */}
            <div className="absolute -left-4 top-0 h-20 w-20 rounded-full bg-[#00B9AD]/5" />
            <div className="absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-yellow-400/5" />

            <div className="relative rounded-2xl bg-gray-50 p-8 shadow-lg">
              <motion.p 
                className="text-lg leading-relaxed text-gray-600"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <span className="text-[#00B9AD] font-semibold">SiModis</span> Dashboard is a smart inventory management dashboard that helps local health departments track, forecast, and optimize the distribution of medicines and medical supplies across healthcare facilities. It provides real-time stock monitoring, supply chain insights, and predictive analysis to ensure efficient resource allocation and improved public health services.
              </motion.p>

              <motion.div
                className="mt-8 flex justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
               
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

