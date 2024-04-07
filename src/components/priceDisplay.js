import React, { useState } from 'react';
import { tokenImages } from '../helper/tokenImages';

const PriceDisplay = ({ priceData }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter priceData based on search term
  const filteredData = Object.entries(priceData).filter(([key]) =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="p-1">
      <h2 className="text-2xl font-bold text-white mb-4">Price Data</h2>
      {/* Search input */}
      <input
        type="text"
        placeholder="Search by ticker..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 rounded bg-black"
      />
      <div className="grid grid-cols-3 lg:grid-cols-7 md:grid-cols-5 sm:grid-cols-4 gap-4">
        {filteredData.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, value]) => (
          <div key={key} className="bg-black p-1 sm:pt-2 rounded-lg shadow-lg flex flex-col items-center">
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