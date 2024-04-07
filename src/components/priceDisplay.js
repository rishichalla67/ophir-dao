import React, { useState, useEffect } from 'react';
import { tokenImages } from '../helper/tokenImages';


const PriceDisplay = ({priceData}) => {

  return (
    <section className="p-4">
      <h2 className="text-2xl font-bold text-white mb-4">Price Data</h2>
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
        {Object.entries(priceData).map(([key, value]) => (
          <div key={key} className="bg-black p-1 sm:p-4 rounded-lg shadow-lg flex flex-col items-center">
            <img src={tokenImages[key]} alt={`${key} token`} className="w-20 h-20 object-cover mb-4"/>
            <h3 className="text-xl text-yellow-400">{key}</h3>
            <p className="text-white">${value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PriceDisplay;