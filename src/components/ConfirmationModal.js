import React from 'react';
import { tokenMappings } from '../helper/tokenMappings';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, formData }) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-[#23242f] p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Confirm Details</h2>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <DetailItem label="Bond Start" value={formatDate(formData.start_time, formData.start_time_hour)} />
          <DetailItem label="Bond End" value={formatDate(formData.end_time, formData.end_time_hour)} />
          <DetailItem label="Maturity" value={formatDate(formData.maturity_date, formData.maturity_date_hour)} />
          <DetailItem label="Token" value={tokenMappings[formData.token_denom]?.symbol || formData.token_denom} />
          <DetailItem label="Quantity" value={formData.total_supply} />
          <DetailItem label="Purchasing" value={tokenMappings[formData.purchasing_denom]?.symbol || formData.purchasing_denom} />
          <DetailItem label="Price" value={formData.price} />
          <DetailItem label="Bond Name" value={`ob${(tokenMappings[formData.token_denom]?.symbol || formData.token_denom).toUpperCase()}${formData.bond_denom_suffix}`} />
          <DetailItem label="Immediate Claim" value={formData.immediate_claim ? 'Yes' : 'No'} />
        </div>
        
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;