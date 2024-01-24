import React, { useState } from 'react';

const Nav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBuyMenuOpen, setIsBuyMenuOpen] = useState(false);


  return (
    <header className="bg-black text-white w-full fixed top-0 left-0 z-50">
      <div className="flex justify-between items-center p-4">
        <img
          src="https://raw.githubusercontent.com/cosmos/chain-registry/master/migaloo/images/ophir.png"
          alt="Logo"
          className="w-8 h-8"
        />

        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`absolute top-full right-0 bg-black rounded-lg overflow-hidden ${isMenuOpen ? 'block' : 'hidden'} shadow-md`}>
        <nav className="flex flex-col p-5">
          <a href="/" className="text-white text-lg py-2 hover:text-yellow-400 rounded">
            Home
          </a>
          <a href="/analytics" className="text-white text-lg py-2 hover:text-yellow-400 rounded">
            Analytics Dashboard
          </a>
          <a href="https://daodao.zone/dao/migaloo10gj7p9tz9ncjk7fm7tmlax7q6pyljfrawjxjfs09a7e7g933sj0q7yeadc/treasury"  className="text-white text-lg py-2 hover:text-yellow-400 rounded" target="_blank" rel="noopener noreferrer">
            DaoDao
          </a>
          <div className="text-white text-lg py-2 rounded group cursor-pointer">
            <div onClick={() => setIsBuyMenuOpen(!isBuyMenuOpen)} className="flex justify-between items-center">
              Buy Ophir
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isBuyMenuOpen ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'}></path>
              </svg>
            </div>
            <div className={`bg-black rounded-md mt-2 ${isBuyMenuOpen ? 'block' : 'hidden'}`}>
              <a href="https://app.whitewhale.money/migaloo/swap?from=WHALE&to=OPHIR" className="block text-yellow-400 px-4 py-2 hover:text-white rounded" target="_blank" rel="noopener noreferrer">Migaloo</a>
              <a href="https://plasma.fuzion.app/" className="block text-yellow-400 px-4 py-2 hover:text-white rounded" target="_blank" rel="noopener noreferrer">OTC Via Fuzion</a>
            </div>
          </div>
          <a href="https://twitter.com/Ophir_DAO" className="text-white text-lg py-2 hover:text-yellow-400 rounded">
            About us
          </a>
        </nav>
      </div>

      {/* Desktop menu - always visible */}
        {/* <div className="hidden md:flex justify-between items-center w-full p-4">
            <nav className="flex justify-between items-center w-full">
                <a href="#home" className="text-white text-lg py-2 px-4 hover:text-yellow-400 rounded">
                Home
                </a>
                <a href="#analytics" className="text-white text-lg py-2 px-4 hover:text-yellow-400 rounded">
                Analytics Dashboard
                </a>
                <a href="https://daodao.zone/dao/migaloo10gj7p9tz9ncjk7fm7tmlax7q6pyljfrawjxjfs09a7e7g933sj0q7yeadc/treasury" className="text-white text-lg py-2 px-4 hover:text-yellow-400 rounded" target="_blank" rel="noopener noreferrer">
                DaoDao
                </a>
                <div className="group relative text-white text-lg py-2 px-4 rounded cursor-pointer">
                <div className="flex items-center">
                    Buy Ophir
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
                <div className="absolute hidden group-hover:block bg-black rounded-md mt-2">
                    <a href="https://app.whitewhale.money/migaloo/swap?from=WHALE&to=OPHIR" className="block text-yellow-400 px-4 py-2 hover:text-white rounded" target="_blank" rel="noopener noreferrer">Migaloo</a>
                    <a href="https://plasma.fuzion.app/" className="block text-yellow-400 px-4 py-2 hover:text-white rounded" target="_blank" rel="noopener noreferrer">OTC Via Fuzion</a>
                </div>
                </div>
                <a href="https://twitter.com/Ophir_DAO" className="text-white text-lg py-2 px-4 hover:text-yellow-400 rounded">
                About us
                </a>
            </nav>
        </div> */}
    </header>
  );
};

export default Nav;
