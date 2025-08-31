"use client";

import { motion } from "framer-motion";
import { Activity, BarChart3, Globe, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Real-Time Stock Monitoring",
    description:
      "Keep track of medicine and supply levels across multiple locations with up-to-date data visualization.",
  },
  {
    icon: TrendingUp,
    title: "Supply Forecasting",
    description:
      "Predict future medicine requirements to prevent stock shortages or surpluses using advanced machine learning.",
  },
  {
    icon: Globe,
    title: "Geolocation Mapping",
    description:
      "Visualize the location of puskesmas on an interactive map and access detailed stock information with a single click.",
  },
  {
    icon: BarChart3,
    title: "Disease Trend Analysis",
    description:
      "Analyze regional disease patterns to align medicine stock with health trends and enhance preparedness.",
  },
];

export default function Features() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Key Features for Smarter Healthcare Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Turn Data into Actionable Insights
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 bg-[#00B9AD] rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <feature.icon className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h3
                className="text-xl font-semibold mb-3 text-gray-900 text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {feature.title}
              </motion.h3>
              <p className="text-gray-600 text-center">{feature.description}</p>

              {/* Interactive hover effect */}
              <motion.div
                className="mt-4 flex justify-center opacity-0 transition-opacity group-hover:opacity-100"
                whileHover={{ scale: 1.1 }}
              >
                <button className="text-[#00B9AD] font-medium hover:text-[#008C82]">
                  Learn more →
                </button>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
