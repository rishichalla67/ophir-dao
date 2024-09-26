import React, { useState, useEffect } from 'react';
import WalletConnect from "./walletConnect";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { daoConfig } from "../helper/daoConfig";
import BigInt from "big-integer";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";
import { Link } from "react-router-dom";
import { tokenMappings } from "../helper/tokenMappings";
import TokenDropdown from './TokenDropdown'; // Import the new TokenDropdown
import { SigningStargateClient } from "@cosmjs/stargate";
import ConfirmationModal from './ConfirmationModal';

const migalooTestnetRPC = "https://migaloo-testnet-rpc.polkachu.com:443";

const CreateBonds = () => {
  const [connectedWalletAddress, setConnectedWalletAddress] = useState("");
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);
  const [isTestnet, setIsTestnet] = useState(true);
  const [rpc, setRPC] = useState(migalooTestnetRPC);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Add 30 minutes to current time
    const defaultTime = now.toTimeString().slice(0, 5); // Format as HH:MM
    const defaultDate = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    return {
      start_time: defaultDate,
      start_time_hour: defaultTime,
      end_time: defaultDate,
      end_time_hour: defaultTime,
      maturity_date: defaultDate,
      maturity_date_hour: defaultTime,
      token_denom: '',
      total_supply: '',
      purchasing_denom: '',
      price: '',
      bond_denom_name: '',
      bond_denom_suffix: 1,
      immediate_claim: false,
      flow_schedule: {
        percentage: 100,
        start_date: defaultDate,
        initial_delay: 0,
        duration: 0
      }
    };
  });
  const [walletBalances, setWalletBalances] = useState({});
  const [fullBondDenomName, setFullBondDenomName] = useState('');
  const [userTimezone, setUserTimezone] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allowedDenoms = [
    "factory/migaloo17c5ped2d24ewx9964ul6z2jlhzqtz5gvvg80z6x9dpe086v9026qfznq2e/daoophir",
    'uwhale',
  ];

  const filteredTokenMappings = Object.entries(tokenMappings).reduce((acc, [denom, value]) => {
    if (allowedDenoms.includes(denom)) {
      acc[denom] = value;
    }
    return acc;
  }, {});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFlowScheduleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      flow_schedule: {
        ...prevState.flow_schedule,
        [name]: value
      }
    }));
  };

  const showAlert = (message, severity = "info", htmlContent = null) => {
    setAlertInfo({ open: true, message, severity, htmlContent });
  };

  const getSigner = async () => {
    if (window.keplr?.experimentalSuggestChain) {
      await window.keplr?.experimentalSuggestChain({
        chainId: "narwhal-2",
        chainName: "Migaloo Testnet",
        rpc: rpc,
        rest: "https://migaloo-testnet-api.polkachu.com",
        bip44: { coinType: 118 },
        bech32Config: {
          bech32PrefixAccAddr: "migaloo",
          bech32PrefixAccPub: "migaloopub",
          bech32PrefixValAddr: "migaloovaloper",
          bech32PrefixValPub: "migaloovaloperpub",
          bech32PrefixConsAddr: "migaloovalcons",
          bech32PrefixConsPub: "migaloovalconspub",
        },
        currencies: [{ coinDenom: "whale", coinMinimalDenom: "uwhale", coinDecimals: 6 }],
        feeCurrencies: [{ coinDenom: "whale", coinMinimalDenom: "uwhale", coinDecimals: 6 }],
        stakeCurrency: { coinDenom: "whale", coinMinimalDenom: "uwhale", coinDecimals: 6 },
        gasPriceStep: { low: 0.2, average: 0.45, high: 0.75 },
      });
    }
  
    await window.keplr?.enable("narwhal-2");
    const offlineSigner = window.keplr?.getOfflineSigner("narwhal-2");
    return offlineSigner;
  };

  const executeCreateBond = async () => {
    setIsLoading(true);
    try {
      const {
        start_time,
        start_time_hour,
        end_time,
        end_time_hour,
        maturity_date,
        maturity_date_hour,
        token_denom,
        total_supply,
        purchasing_denom,
        price,
        bond_denom_name,
        bond_denom_suffix,
        immediate_claim,
        flow_schedule
      } = formData;

      // Ensure bond_denom_name is prefixed with "o"
      const fullBondDenomName = `ob${(tokenMappings[formData.token_denom]?.symbol || formData.token_denom).toUpperCase()}${bond_denom_suffix.toString()}`;

      const contractAddress = daoConfig.BONDS_CONTRACT_ADDRESS_TESTNET;

      // Convert dates to UTC
      const convertToUTC = (date, time) => {
        const localDate = new Date(`${date}T${time}`);
        return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
      };

      const message = { 
        issue_bond: {
          bond_id: fullBondDenomName,
          bond_denom_name: fullBondDenomName,
          total_supply: String(BigInt(total_supply)),
          price: String(price),
          start_time: Math.floor(convertToUTC(start_time, start_time_hour).getTime() / 1000),
          end_time: Math.floor(convertToUTC(end_time, end_time_hour).getTime() / 1000),
          maturity_date: Math.floor(convertToUTC(maturity_date, maturity_date_hour).getTime() / 1000),
          token_denom,
          purchasing_denom,
          immediate_claim,
          flow_schedule: immediate_claim ? null : [{
            percentage: String(flow_schedule.percentage),
            start_time: Math.floor(convertToUTC(flow_schedule.start_date, '00:00').getTime() / 1000),
            initial_delay: Number(flow_schedule.initial_delay) * 86400, // Convert days to seconds
            duration: Number(flow_schedule.duration) * 86400, // Convert days to seconds
          }],
          description: null
        }
      };

      const signer = await getSigner();

      const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);
      
      // Calculate the fee in uwhale (25 WHALE)
      const whaleFee = "25000000"; // 25 WHALE in uwhale

      // Calculate the total supply in the smallest unit of the token
      const tokenDecimals = tokenMappings[token_denom]?.decimals || 6; // Default to 6 if not found
      const adjustedTotalSupply = BigInt(total_supply) * BigInt(10 ** tokenDecimals);

      // Prepare the funds array
      const funds = [
        { denom: "uwhale", amount: whaleFee },
        { denom: token_denom, amount: adjustedTotalSupply.toString() }
      ];

      const fee = {
        amount: [{ denom: "uwhale", amount: "50000" }],
        gas: "500000",
      };

      const result = await client.execute(
        connectedWalletAddress,
        contractAddress,
        message,
        fee,
        "", // memo
        funds // Add the funds array here
      );

      console.log(result);
      if (result.transactionHash) {
        const baseTxnUrl = isTestnet
          ? "https://ping.pfc.zone/narwhal-testnet/tx"
          : "https://inbloc.org/migaloo/transactions";
        const txnUrl = `${baseTxnUrl}/${result.transactionHash}`;
        showAlert(
          `Bond created successfully! Transaction Hash: ${result.transactionHash}`,
          "success",
          `<a href="${txnUrl}" target="_blank">View Transaction</a>`
        );
      } else {
        showAlert("Bond created successfully!", "success");
      }

      // Reset form
      setFormData(prevState => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        const defaultTime = now.toTimeString().slice(0, 5);
        const defaultDate = now.toISOString().split('T')[0];

        return {
          ...prevState,
          start_time: defaultDate,
          start_time_hour: defaultTime,
          end_time: defaultDate,
          end_time_hour: defaultTime,
          maturity_date: defaultDate,
          maturity_date_hour: defaultTime,
          token_denom: '',
          total_supply: '',
          purchasing_denom: '',
          price: '',
          bond_denom_name: '',
          bond_denom_suffix: 1,
          immediate_claim: false,
          flow_schedule: {
            percentage: 100,
            start_date: defaultDate,
            initial_delay: 0,
            duration: 0
          }
        };
      });
    } catch (error) {
      console.error("Error creating bond:", error);
      showAlert(`Error creating bond. ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectedWalletAddress = (address) => {
    setConnectedWalletAddress(address);
  };

  const handleLedgerConnection = (bool) => {
    setIsLedgerConnected(bool);
  };

  useEffect(() => {
    if (connectedWalletAddress) {
      checkBalances();
    }
  }, [connectedWalletAddress, isTestnet]);

  const checkBalances = async () => {
    try {
      const signer = await getSigner();
      const client = await SigningStargateClient.connectWithSigner(rpc, signer);
      const balances = await client.getAllBalances(connectedWalletAddress);
      
      const formattedBalances = balances.reduce((acc, balance) => {
        const tokenInfo = tokenMappings[balance.denom] || { symbol: balance.denom, decimals: 6 };
        const amount = parseFloat(balance.amount) / Math.pow(10, tokenInfo.decimals);
        acc[balance.denom] = amount;
        return acc;
      }, {});

      setWalletBalances(formattedBalances);
    } catch (error) {
      console.error("Error checking balances:", error);
      showAlert(`Error checking balances. ${error.message}`, "error");
    }
  };

  useEffect(() => {
    const name = `ob${(tokenMappings[formData.token_denom]?.symbol || formData.token_denom).toUpperCase()}`;
    const suffix = formData.bond_denom_suffix.toString();
    setFullBondDenomName(`${name}${suffix}`);
  }, [formData.bond_denom_name, formData.bond_denom_suffix]);

  useEffect(() => {
    // Get the user's timezone abbreviation and UTC offset
    const getTimezoneInfo = () => {
      const now = new Date();
      const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Get abbreviation
      const abbreviation = now.toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ').pop();

      // Get UTC offset in hours
      const offsetInMinutes = now.getTimezoneOffset();
      const offsetHours = -offsetInMinutes / 60;
      const sign = offsetHours >= 0 ? '+' : '-';
      const absoluteOffset = Math.abs(offsetHours);
      const formattedOffset = `UTC${sign}${absoluteOffset}`;

      return `${abbreviation} (${formattedOffset})`;
    };

    const timezoneInfo = getTimezoneInfo();
    setUserTimezone(timezoneInfo);
  }, []);

  const handleSubmit = () => {
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    setIsModalOpen(false);
    executeCreateBond();
  };

  return (
    <div className="bg-[#1a1b23] text-white min-h-screen w-full pt-20 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          { isTestnet ? <h1 className="text-4xl font-bold mb-4">Create a Bond (Testnet)</h1> : <h1 className="text-4xl font-bold mb-4">Create a Bond</h1>}
          <WalletConnect
            handleConnectedWalletAddress={handleConnectedWalletAddress}
            handleLedgerConnectionBool={handleLedgerConnection}
          />
        </div>
        <p className="text-gray-400 mb-2">
          A 25 whale fee is charged to create an obTOKEN denom.
        </p>
        

        <div className="bg-[#23242f] p-6 rounded-lg shadow-lg mb-8">
          <div className="space-y-6">
            <p className="text-gray-400 mb-8">
                Your current timezone: {userTimezone}. All times will be converted to UTC for submission.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Bond Start Date and Time</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="bg-[#2c2d3a] w-1/2 px-3 py-2 rounded-md"
                />
                <input
                  type="time"
                  name="start_time_hour"
                  value={formData.start_time_hour}
                  onChange={handleInputChange}
                  className="bg-[#2c2d3a] w-1/2 px-3 py-2 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bond End Date and Time</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="bg-[#2c2d3a] w-1/2 px-3 py-2 rounded-md"
                />
                <input
                  type="time"
                  name="end_time_hour"
                  value={formData.end_time_hour}
                  onChange={handleInputChange}
                  className="bg-[#2c2d3a] w-1/2 px-3 py-2 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bond Maturity Date</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  name="maturity_date"
                  value={formData.maturity_date}
                  onChange={handleInputChange}
                  className="bg-[#2c2d3a] w-1/2 px-3 py-2 rounded-md"
                />
                <input
                  type="time"
                  name="maturity_date_hour"
                  value={formData.maturity_date_hour}
                  onChange={handleInputChange}
                  className="bg-[#2c2d3a] w-1/2 px-3 py-2 rounded-md"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <TokenDropdown
                    name="token_denom"
                    value={formData.token_denom}
                    onChange={handleInputChange}
                    label="Token Denom"
                    allowedDenoms={allowedDenoms}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Token Quantity</label>
                  <input
                    type="number"
                    name="total_supply"
                    value={formData.total_supply}
                    onChange={handleInputChange}
                    className="bg-[#2c2d3a] w-full px-3 py-2 rounded-md"
                    placeholder="0"
                  />
                  {formData.token_denom && walletBalances[formData.token_denom] && (
                    <p className="text-xs text-gray-400 mt-1">
                      Available: {(walletBalances[formData.token_denom]).toLocaleString(undefined, {minimumFractionDigits: 6, maximumFractionDigits: 6})} {tokenMappings[formData.token_denom]?.symbol || formData.token_denom}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <TokenDropdown
                    name="purchasing_denom"
                    value={formData.purchasing_denom}
                    onChange={handleInputChange}
                    label="Purchasing Denom"
                    allowedDenoms={allowedDenoms}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Purchasing Price</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="bg-[#2c2d3a] w-full px-3 py-2 rounded-md"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bond Denom Name</label>
              <div className="flex items-center">
                {/* <div className="flex-1 flex items-center">
                  <span className="inline-flex items-center px-3 py-2 bg-[#2c2d3a] text-white rounded-l-md w-1/2 justify-center">
                    ob{`${(tokenMappings[formData.token_denom]?.symbol || formData.token_denom).toUpperCase()}`}
                  </span>
                </div> */}
                <input
                  type="text"
                  name="bond_name"
                  value={`ob${(tokenMappings[formData.token_denom]?.symbol || formData.token_denom).toUpperCase()}`}
                  onChange={handleInputChange}
                  className="bg-[#2c2d3a] w-1/4 px-3 py-2 rounded-l-md"
                  disabled={true}
                  placeholder={`ob${(tokenMappings[formData.token_denom]?.symbol || formData.token_denom).toUpperCase()}`}
                />
                <input
                  type="number"
                  name="bond_denom_suffix"
                  value={formData.bond_denom_suffix}
                  onChange={handleInputChange}
                  className="bg-[#2c2d3a] w-1/4 px-3 py-2 rounded-r-md"
                  min="1"
                  max="99"
                  placeholder="01"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use a number suffix (01-99) to ensure a unique name for your bond denom.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-4">Create a flow</h2>
        <p className="text-gray-400 mb-8">
          A Flow manages the distribution of the tokens in a deal. You can add multiple schedules to a flow. Tokens in deals without a flow will be
          available to deal takers immediately. Please ensure you have read through and understood the guidelines regarding flows at our
          documentation hub and the Terms and Conditions regarding the use of this product.
        </p>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.immediate_claim}
              onChange={(e) => setFormData({...formData, immediate_claim: e.target.checked})}
              className="mr-2"
            />
            <span>Check box for all tokens to be available to claim immediately after the bond activates.</span>
          </label>
        </div>

        <h3 className="text-2xl font-bold mb-4">Submit Bond</h3>
        <p className="text-gray-400 mb-8">
            Happy with the Bond? Click Submit to make it public. You will be prompted to approve a transaction.
            Please note, there is a 25 whale fee charged to create the denom for {fullBondDenomName !== "ob01" ? fullBondDenomName : 'the obTOKEN'}.
        </p>

        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        formData={formData}
      />

      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo({ ...alertInfo, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        {alertInfo.htmlContent ? (
          <SnackbarContent
            style={{
              color: "black",
              backgroundColor:
                alertInfo.severity === "error" ? "#ffcccc" : "#ccffcc",
            }}
            message={
              <span
                dangerouslySetInnerHTML={{ __html: alertInfo.htmlContent }}
              />
            }
          />
        ) : (
          <Alert
            onClose={() => setAlertInfo({ ...alertInfo, open: false })}
            severity={alertInfo.severity}
            sx={{ width: "100%" }}
          >
            {alertInfo.message}
          </Alert>
        )}
      </Snackbar>
    </div>
  );
};

export default CreateBonds;