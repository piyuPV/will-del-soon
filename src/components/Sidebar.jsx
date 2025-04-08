"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'DEVINE FIT', path: '/', icon: '❤️', isTitle: true },
    { name: 'DASHBOARD', path: '/dashboard', icon: '📊' },
    { name: 'POSTURE', path: '/posture', icon: '💪' },
    { name: 'DIET PLAN', path: '/diet', icon: '🍽️' },
    { name: 'CHALLENGES', path: '/game', icon: '🏆' },
    { name: 'PROFILE', path: '/profile', icon: '👤' },
  ];

  return (
    <div className="w-64 h-screen bg-[#5C4033] text-white fixed left-0 top-0 overflow-y-auto">
      {/* Main Navigation */}
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center p-4 transition-colors ${
                    item.isTitle 
                      ? 'bg-[#6B4423] border-b-2 border-[#8B4513] text-yellow-400 font-bold text-xl'
                      : pathname === item.path
                        ? 'bg-[#FF8C00] text-black'
                        : 'hover:bg-[#6B4423]'
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  <span className="font-semibold">{item.name}</span>
                </motion.div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#4A3527] border-t border-[#8B4513]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#8B4513] flex items-center justify-center text-sm font-bold">
            N
          </div>
          <div>
            <p className="font-bold text-yellow-400">FITFREAK</p>
            <p className="text-xs text-gray-300">Level 5</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 