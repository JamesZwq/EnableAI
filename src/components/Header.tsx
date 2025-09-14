import React from 'react';
import { Heart, Accessibility, Globe } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EnableAI</h1>
              <p className="text-sm text-gray-600">Empowering abilities, creating opportunities</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              aria-label="Accessibility options"
            >
              <Accessibility className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              aria-label="Language options"
            >
              <Globe className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;