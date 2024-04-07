import React, { useState } from 'react';
import { tokenImages } from '../helper/tokenImages';

const PriceDisplay = ({ priceData }) => {
    const [searchTerm, setSearchTerm] = useState('');
  
    // Convert keys in priceData to lowercase for uniform access
    const lowerCasePriceData = Object.entries(priceData).reduce((acc, [key, value]) => {
      acc[key.toLowerCase()] = value;
      return acc;
    }, {});
  
    // Filter lowerCasePriceData based on search term
    const filteredData = Object.entries(lowerCasePriceData).filter(([key]) =>
      key.includes(searchTerm.toLowerCase())
    );
  
    return (
      <section className="p-1">
        <h2 className="text-2xl font-bold text-white mb-4">Price Data</h2>
        {/* Search input */}
        <input
            type="text"
            placeholder="Search by ticker..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                // Scroll the input into view smoothly
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="mb-4 p-2 rounded bg-black"
        />
        <div className="grid grid-cols-3 lg:grid-cols-7 md:grid-cols-5 sm:grid-cols-4 gap-4 mb-10">
          {filteredData.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, value]) => (
            <div key={key} className="bg-black p-1 sm:pt-2 rounded-lg shadow-lg flex flex-col items-center">
              {/* Ensure tokenImages keys are accessed in lowercase */}
              <img src={tokenImages[key]} alt={`${key} token`} className="w-10 h-10 object-cover mb-1"/>
              <h3 className="text-xl text-yellow-400">{key}</h3>
              <p className="text-white">${(Number(value).toFixed(5).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "")).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

export default PriceDisplay;