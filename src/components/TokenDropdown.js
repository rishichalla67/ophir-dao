import React, { useState, useRef, useEffect } from 'react';
import { tokenImages } from '../helper/tokenImages';
import { tokenMappings } from '../helper/tokenMappings';

const TokenDropdown = ({ name, value, onChange, label, allowedDenoms }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Convert tokenMappings keys to an array of token objects
  let tokens = Object.keys(tokenMappings).map((denom) => ({
    denom,
    symbol: tokenMappings[denom].symbol,
    image: tokenImages[tokenMappings[denom].symbol] || '', // Fallback if image not found
  }));

  // If allowedDenoms is provided, filter tokens accordingly
  if (allowedDenoms && allowedDenoms.length > 0) {
    tokens = tokens.filter(token => allowedDenoms.includes(token.denom));
  }

  // Find the selected token based on the current value
  const selectedToken = tokens.find((token) => token.denom === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <button
        type="button"
        className="bg-[#2c2d3a] w-full px-3 py-2 rounded-md flex items-center justify-between text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedToken ? (
          <div className="flex items-center">
            {selectedToken.image ? (
              <img
                src={selectedToken.image}
                alt={selectedToken.symbol}
                className="w-5 h-5 mr-2"
              />
            ) : (
              // Display a default icon or placeholder if no image is available
              <div className="w-5 h-5 mr-2 bg-gray-400 rounded-full flex items-center justify-center">
                {/* You can replace the initials with any placeholder as needed */}
                <span className="text-xs text-white">
                  {selectedToken.symbol.charAt(0)}
                </span>
              </div>
            )}
            <span>{selectedToken.symbol}</span>
          </div>
        ) : (
          <span>Select</span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <ul className="absolute mt-1 bg-[#2c2d3a] w-full rounded-md shadow-lg max-h-60 overflow-auto z-10">
          {tokens.map((token) => (
            <li
              key={token.denom}
              className="px-3 py-2 flex items-center cursor-pointer hover:bg-[#3a3b44]"
              onClick={() => {
                onChange({ target: { name, value: token.denom } });
                setIsOpen(false);
              }}
            >
              {token.image ? (
                <img
                  src={token.image}
                  alt={token.symbol}
                  className="w-5 h-5 mr-2"
                />
              ) : (
                // Display a default icon or placeholder if no image is available
                <div className="w-5 h-5 mr-2 bg-gray-400 rounded-full flex items-center justify-center">
                  {/* You can replace the initials with any placeholder as needed */}
                  <span className="text-xs text-white">
                    {token.symbol.charAt(0)}
                  </span>
                </div>
              )}
              <span>{token.symbol}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TokenDropdown;
