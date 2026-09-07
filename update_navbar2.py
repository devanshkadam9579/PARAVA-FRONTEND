import re

with open('src/components/airbnb/AirbnbNavbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add a scroll listener
imports = "import React, { useState, useEffect } from 'react';"
content = re.sub(r"import React.*?from 'react';", imports, content, count=1)

# Inside AirbnbNavbar component
state_add = """export function AirbnbNavbar({
  categories,
  selectedCategory,
  onSelectCategory,
  currentUser,
  onOpenLogin,
  onLogout,
  onNavigateTab,
  activeTab,
  cartCount,
  onOpenCart,
  onOpenSupport,
  onOpenNotifications,
  unreadCount
}: AirbnbNavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);"""

content = re.sub(r'export function AirbnbNavbar\(\{.*?\}: AirbnbNavbarProps\) \{\s*const \[isUserMenuOpen, setIsUserMenuOpen\] = useState\(false\);', state_add, content, flags=re.DOTALL)

# Replace the Center Navigation
center_nav = """        {/* Center Navigation / Animated Search Capsule */}
        <div className="hidden md:flex flex-1 h-[48px] items-center justify-center relative">
          <div 
            className={`absolute transition-all duration-300 ease-in-out ${isScrolled ? 'opacity-0 scale-95 pointer-events-none translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}
          >
            <nav className="flex items-center gap-1 bg-gray-50 border border-gray-200/80 rounded-full px-2 py-1 shadow-xs">
              <button
                type="button"
                onClick={() => onNavigateTab('home')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                  activeTab === 'home' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Explore Services
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('bookings')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                  activeTab === 'bookings' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Reservations
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('chat')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                  activeTab === 'chat' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Messages
              </button>
            </nav>
          </div>

          <div 
            className={`absolute transition-all duration-300 ease-in-out cursor-pointer ${isScrolled ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-110 pointer-events-none -translate-y-2'} flex items-center justify-center`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition pl-5 pr-2 py-2 gap-4">
              <span className="text-sm font-bold text-gray-900">Anywhere</span>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm font-bold text-gray-900">Anytime</span>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">Add guests</span>
              <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white ml-2">
                <Search size={14} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>"""

content = re.sub(r'        \{\/\* Center Quick Navigation Links \*\/\}.*?<\/nav>', center_nav, content, flags=re.DOTALL)

# Add Search to lucide-react imports
content = content.replace('Users, ChevronDown, Check', 'Users, ChevronDown, Check, Search')

with open('src/components/airbnb/AirbnbNavbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
