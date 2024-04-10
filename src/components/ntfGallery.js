import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Palette } from '@mui/icons-material';

const NFTGallery = () => {
  const [collectionData, setCollectionData] = useState(null);
  const [prices, setPrices] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add a loading state
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleHashClick = (e, hash) => {
    e.stopPropagation(); // Prevent modal from opening
    navigator.clipboard.writeText(hash);
    alert('Hash copied to clipboard!');
  };

  const fetchData = async () => {
    setIsLoading(true); // Set loading to true when starting to fetch data
    try {
      const magicEdenResponse = await axios.get('https://api-mainnet.magiceden.io/v2/ord/btc/stat?collectionSymbol=runestone');
      const parallaxResponse = await axios.get('https://parallax-analytics.onrender.com/ophir/prices');
      setCollectionData(magicEdenResponse.data);
      setPrices(parallaxResponse.data);
    } catch (error) {
      console.error("Error fetching collection data:", error);
    } finally {
      setIsLoading(false); // Set loading to false after fetching data
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading || !prices) { // Wait until both collection data and prices are loaded
    return <div>Loading...</div>;
  }
  return (
    <>
        <div className="flex flex-wrap justify-center gap-4 p-4" onClick={handleCardClick}>
            <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 rounded overflow-hidden shadow-lg bg-slate-900">
                <img src="https://img-cdn.magiceden.dev/rs:fit:400:0:0/plain/https://bafybeic7wucegolrhfagncb4b4xcijcnq4affdfu6sflejs7wwxbw3xbbq.ipfs.nftstorage.link/" alt="NFT" className="w-full" />
                <div className="px-6 py-4">
                <p className="text-white text-base">ID: #64471454</p>
                <p className="text-white text-base">Bought with: 0.09858926 BTC</p>
                <p className="text-white text-base">Floor Price: {collectionData?.floorPrice/100000000} BTC</p>
                <p className="text-white text-base">Profit: ${(((collectionData?.floorPrice/100000000)-0.09858926)*prices["wBTC"]).toFixed(2)}</p>
              
                <p className="text-white text-base" onClick={(e) => handleHashClick(e, '7f64a1537ed6300ddf3d7c77a48173aebafebde897a59681f3a658fb363de6ff')}>
                    Hash: 7f64a1...de6ff
                </p>
                </div>
            </div>
        </div>

        {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="modal-content bg-slate-700 p-5 rounded-lg shadow-lg">
            <span className="close float-right cursor-pointer" onClick={() => setIsModalOpen(false)}>&times;</span>
            <div className="text-left">
                <div className="font-bold text-xl mb-2">Collection: {collectionData?.symbol}</div>
                <p className="text-white text-base">Total Volume: {collectionData?.totalVolume/100000000} BTC</p>
                <p className="text-white text-base">Owners: {collectionData?.owners}</p>
                <p className="text-white text-base">Supply: {collectionData?.supply}</p>
                <p className="text-white text-base">Floor Price: {collectionData?.floorPrice/100000000} BTC</p>
                <p className="text-white text-base">Total Listed: {collectionData?.totalListed}</p>
                <p className="text-white text-base">Current Pending Transactions: {collectionData?.pendingTransactions}</p>
            </div>
            </div>
        </div>
        )}
  </>
  );
};

export default NFTGallery;