'use client'

import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Form Side */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
            </div>
            {children}
          </motion.div>
        </div>
      </div>

      {/* Image Side */}
      <div className="hidden lg:block lg:w-1/2">
        <div className="relative h-full">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url("https://img.freepik.com/free-photo/flat-lay-health-still-life-arrangement-with-copy-space_23-2148854064.jpg?semt=ais_hybrid")'
            }}
          />
          {/* Teal Overlay - adjusted opacity for better visibility */}
          <div className="absolute inset-0 bg-[#00B9AD]/90" />
          
          {/* Optional: Add floating elements or text */}
          <div className="relative z-10 flex h-full items-center justify-center p-8 lg:items-start lg:pt-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center text-white lg:text-left"
            >
              <h1 className="text-6xl font-bold">
              Unlock Better Healthcare Logistics with Intelligent Supply Tracking from
              </h1>
              <h1 className="text-6xl font-bold">
              <span className="text-white">Si</span>
              <span className="text-yellow-300">Modis</span>
              </h1>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

