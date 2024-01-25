import React from 'react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-6 lg:px-8">
        <img src="https://raw.githubusercontent.com/cosmos/chain-registry/master/migaloo/images/ophir.png" alt="Ophir DAO" className="w-32 h-32 mb-4" />
        <h1 className="text-4xl font-bold mb-2">Ophir DAO</h1>
        <p className="mx-auto w-4/5 text-center text-gray-400 mb-4 text-base sm:text-lg lg:text-xl">
        Cosmos Treasury DAO established on Migaloo. We are seeking a lost city of gold. We have no respect for the currency of men.
        </p>
        <a href="https://app.whitewhale.money/migaloo/swap?from=WHALE&to=OPHIR" target="_blank" rel="noopener noreferrer" className="bg-yellow-400 text-black font-bold py-2 px-4 rounded hover:bg-yellow-500">
          Get $OPHIR
        </a>
      </main>
    </div>
  );
};

export default LandingPage;