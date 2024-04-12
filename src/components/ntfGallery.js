import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';

const NFTGallery = ({ prices, runestoneData }) => { // Accept prices as a prop
  const [collectionData, setCollectionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add a loading state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });


  const handleCardClick = () => {
    setIsModalOpen(true);
  };    
  
  const showAlert = (message, severity = 'info', htmlContent = null) => {
    setAlertInfo({ open: true, message, severity, htmlContent });
  };

  const handleHashClick = (e, hash) => {
    e.stopPropagation(); // Prevent modal from opening
    navigator.clipboard.writeText(hash);
    showAlert('Hash copied to clipboard!');
  };

  return (
    <>
          <div className="flex flex-wrap justify-center gap-4 p-4" onClick={handleCardClick}>
            <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 rounded overflow-hidden shadow-lg bg-slate-900">
                <img src="https://img-cdn.magiceden.dev/rs:fit:400:0:0/plain/https://bafybeic7wucegolrhfagncb4b4xcijcnq4affdfu6sflejs7wwxbw3xbbq.ipfs.nftstorage.link/" alt="NFT" className="w-full" />
                <div className="px-6 py-4">
                <p className="text-white text-base">ID: #64471454</p>
                <p className="text-white text-base">Cost: 0.09858926 BTC</p>
                <p className="text-white text-base">Floor Price: {runestoneData?.floor_price?.native_currency} BTC</p>
                <p className="text-white text-base">Profit: ${(((runestoneData?.floor_price?.native_currency ?? 0)-0.09858926)*prices["wBTC"]).toFixed(2)}</p>
                <p className="text-base">24hr Change: <span className={`${runestoneData?.floor_price_in_usd_24h_percentage_change > 0 ? 'text-green-500' : 'text-red-500'}`}>{((runestoneData?.floor_price_in_usd_24h_percentage_change ?? 0).toFixed(2))}%</span></p>
                <p className="text-white text-base" onClick={(e) => handleHashClick(e, '7f64a1537ed6300ddf3d7c77a48173aebafebde897a59681f3a658fb363de6ff ')}>
                    Hash: 7f64a1...de6ff
                </p>
                </div>
            </div>
        </div>
        <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={() => setAlertInfo({ ...alertInfo, open: false })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                    {alertInfo.htmlContent ? (
                        <SnackbarContent
                            style={{color: 'black', backgroundColor: alertInfo.severity === 'error' ? '#ffcccc' : '#ccffcc' }} // Adjusted colors to be less harsh
                            message={<span dangerouslySetInnerHTML={{ __html: alertInfo.htmlContent }} />}
                        />
                    ) : (
                        <Alert onClose={() => setAlertInfo({ ...alertInfo, open: false })} severity={alertInfo.severity} sx={{ width: '100%' }}>
                            {alertInfo.message}
                        </Alert>
                    )}
                </Snackbar>
      
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4">
              <div className="modal-content bg-slate-800 p-4 rounded-lg shadow-lg max-w-3xl w-full overflow-y-auto">
                  <span className="close float-right cursor-pointer text-white text-2xl" onClick={() => setIsModalOpen(false)}>&times;</span>
                  <h2 className="font-bold text-lg mb-2 text-white">Collection: {runestoneData?.name} ({runestoneData?.symbol})</h2>
                  <div className="grid grid-cols-2 gap-2 text-sm text-white">
                      <p>Floor Price: {runestoneData?.floor_price?.native_currency} BTC (${runestoneData?.floor_price?.usd})</p>
                      <p>Market Cap: {runestoneData?.market_cap?.native_currency} BTC (${runestoneData?.market_cap?.usd})</p>
                      <p>24h Volume: {runestoneData?.volume_24h?.native_currency} BTC (${runestoneData?.volume_24h?.usd})</p>
                      <p>Total Supply: {runestoneData?.total_supply}</p>
                      <p>Unique Addresses: {runestoneData?.number_of_unique_addresses}</p>
                      <p>One Day Sales: {runestoneData?.one_day_sales}</p>
                      <p>Floor Price 24h Change: {runestoneData?.floor_price_in_usd_24h_percentage_change.toFixed(2)}%</p>
                      <p>Volume 24h Change: {runestoneData?.volume_in_usd_24h_percentage_change.toFixed(2)}%</p>
                      <p>Addresses 24h Change: {runestoneData?.number_of_unique_addresses_24h_percentage_change.toFixed(2)}%</p>
                      <p>One Day Avg Sale Price: {runestoneData?.one_day_average_sale_price} BTC</p>
                      <p className="col-span-2">Discord: <a href={runestoneData?.links?.discord} className="text-blue-400 hover:text-blue-600">Join</a></p>
                  </div>
                  <div className="mt-2">
                      <img src={runestoneData?.image?.small} alt="Runestone" className="mx-auto h-20 w-20" />
                  </div>
              </div>
          </div>
      )}
  </>
  
  );
};

export default NFTGallery;