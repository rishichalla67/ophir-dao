import React from 'react';
import { tokenMappings } from '../helper/tokenMappings';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, formData, isLoading }) => {
  if (!isOpen) return null;

  const formatDate = (date, time) => {
    const localDate = new Date(`${date}T${time}`);
    return localDate.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const DetailItem = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-700">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  // Calculate the total amount of purchasing tokens
  const calculatePurchasingTokens = () => {
    const totalSupply = parseFloat(formData.total_supply);
    const price = parseFloat(formData.price);
    if (isNaN(totalSupply) || isNaN(price) || price === 0) {
      return 'N/A';
    }
    const totalPurchasingTokens = totalSupply * price;
    return totalPurchasingTokens.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const purchasingTokenSymbol = tokenMappings[formData.purchasing_denom]?.symbol || formData.purchasing_denom;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-8 shadow-xl border border-gray-700 max-w-md w-full m-4">
        <h2 className="text-2xl font-bold mb-4 text-white">Confirm Bond Creation</h2>
        
        <div className="space-y-4 text-gray-300">
          <DetailItem label="Bond Start" value={formatDate(formData.start_time, formData.start_time_hour)} />
          <DetailItem label="Bond End" value={formatDate(formData.end_time, formData.end_time_hour)} />
          <DetailItem label="Maturity" value={formatDate(formData.maturity_date, formData.maturity_date_hour)} />
          <DetailItem label="Token" value={tokenMappings[formData.token_denom]?.symbol || formData.token_denom} />
          <DetailItem label="Quantity" value={formData.total_supply} />
          <DetailItem label="Purchasing" value={purchasingTokenSymbol} />
          <DetailItem label="Price" value={formData.price} />
          <DetailItem label="Bond Name" value={`ob${(tokenMappings[formData.token_denom]?.symbol || formData.token_denom).toUpperCase()}${formData.bond_denom_suffix}`} />
          <DetailItem label="Immediate Claim" value={formData.immediate_claim ? 'Yes' : 'No'} />
          
          {/* New section for total purchasing tokens */}
          <div className="mt-4 p-3 bg-gray-800 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Total {purchasingTokenSymbol} to Receive</h3>
            <p className="text-xl font-bold">{calculatePurchasingTokens()} {purchasingTokenSymbol}</p>
            <p className="text-sm text-gray-400 mt-1">
              This is the total amount of {purchasingTokenSymbol} you would receive if all bonds are sold.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-yellow-500/20"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
