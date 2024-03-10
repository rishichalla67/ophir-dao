import React, { useState, useEffect } from 'react';

const LandingPage = () => {

  const [totalTreasuryValue, setTotalTreasuryValue] = useState('');
  const [placeholderValue, setPlaceholderValue] = useState('00000000'); // Assuming an 8-digit placeholder

  useEffect(() => {
    // Function to generate a random digit
    const generateRandomDigit = () => Math.floor(Math.random() * 10);

    // Function to update the placeholder with random digits
    const updatePlaceholder = () => {
      const newPlaceholder = Array.from({ length: 8 }) // Assuming an 8-digit number
        .map(() => generateRandomDigit())
        .join('');
      setPlaceholderValue(newPlaceholder);
    };

    // Start cycling through random digits
    const intervalId = setInterval(updatePlaceholder, 1); // Update every 100ms

    fetch('https://parallax-analytics.onrender.com/ophir/totalTreasuryValue')
      .then(response => response.json())
      .then(data => {
        setTotalTreasuryValue(data.totalTreasuryValue);
        clearInterval(intervalId); // Stop cycling when data is loaded
      })
      .catch(error => {
        console.error('Error fetching total treasury value:', error);
        clearInterval(intervalId); // Ensure to clear interval on error as well
      });

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-6 lg:px-8">
        <img src="https://raw.githubusercontent.com/cosmos/chain-registry/master/migaloo/images/ophir.png" alt="Ophir DAO" className="w-32 h-32 mb-4" />
        <h1 className="text-4xl font-bold mb-2">Ophir DAO</h1>
        <p className="mx-auto w-4/5 text-center text-gray-400 mb-4 text-base sm:text-lg lg:text-xl">
        Cosmos Treasury DAO established on Migaloo. We are seeking a lost city of gold. We have no respect for the currency of men.
        </p>
        <a href="https://app.whitewhale.money/migaloo/swap?from=WHALE&to=OPHIR" target="_blank" rel="noopener noreferrer" className="bg-yellow-400 text-black font-bold py-2 px-4 rounded hover:bg-yellow-500">
          Buy $OPHIR
        </a>
        <a href="/seekers" rel="noopener noreferrer" className="mt-2 bg-yellow-400 text-black font-bold py-2 px-4 rounded hover:bg-yellow-500">
          $OPHIR Seeker's Round
        </a>
        <div onClick={() => window.location.href='/analytics'} style={{cursor: 'pointer'}}>
        <p className="text-yellow-400 text-lg mt-4 font-roboto">
          Total Treasury Value: {totalTreasuryValue ? `$${totalTreasuryValue}` : `$${placeholderValue}`}
        </p>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;