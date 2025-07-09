import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Users } from "lucide-react";

const Highlight = () => (
  <motion.div
    className="py-10 px-8 max-w-md w-full bg-white/30 backdrop-blur-md rounded-2xl shadow-neuro-light text-center"
    initial={{ opacity: 0, y: -50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    viewport={{ once: false, amount: 0.5 }}
  >
    {/* Top Icon */}
    <motion.div
      className="flex justify-center mb-6"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1, delay: 0.3, type: "spring" }}
    >
      <GraduationCap className="text-accent w-14 h-14" />
    </motion.div>

    {/* Heading */}
    <motion.h1
      className="text-4xl md:text-5xl font-bold mb-4 text-kaitoke"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1, delay: 0.4, type: "spring" }}
    >
      Welcome to <span className="text-primary">VMHS</span> Liberia
    </motion.h1>

    {/* Paragraph */}
    <motion.p
      className="text-lg md:text-xl text-gray-100 leading-relaxed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 1 }}
    >
      At VMHS, we shape futures through quality education, unity, and innovation. 
      Join a community dedicated to nurturing leaders who uplift Liberia and the world.
    </motion.p>

    {/* Bottom Icon */}
    <motion.div
      className="flex justify-center mt-8"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
    >
      <Users className="text-primary w-12 h-12" />
    </motion.div>
  </motion.div>
);

export default Highlight;
