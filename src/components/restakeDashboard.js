import React, { useState, useEffect, Suspense } from 'react';
import { CosmWasmClient  } from "@cosmjs/cosmwasm-stargate";
import { StargateClient } from "@cosmjs/stargate";

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import WalletConnect from './walletConnect';
import {tokenMappings} from '../helper/tokenMappings';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';


const ERIS_GAUGE_CONTRACT_ADDRESS = 'migaloo1m7nt0zxuf3jvj2k8h9kmgkxjmepxz3k9t2c9ce8xwj94csg0epvq5j6z3w';
const ERIS_WHITELIST_CONTRACT_ADDRESS = 'migaloo190qz7q5fu4079svf890h4h3f8u46ty6cxnlt78eh486k9qm995hquuv9kd';
const OPHIR_DAO_TREASURY_ADDRESS = 'migaloo10gj7p9tz9ncjk7fm7tmlax7q6pyljfrawjxjfs09a7e7g933sj0q7yeadc'

const RestakeDashboard = () => {
    const [gaugeVoteResponse, setGaugeVoteResponse] = useState(null);
    const [whitelistResponse, setWhitelistResponse] = useState(null);
    const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
    const [isLedgerConnected, setIsLedgerConnected] = useState(false);
    const [contractAddress, setContractAddress] = useState('');
    const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
    const [queryMsg, setQueryMsg] = useState('');
    const [rpc, setRpc] = useState('https://migaloo-rpc.polkachu.com/');
    const [chainId, setChainId] = useState('migaloo-1');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshDataWithCooldown = () => {
        if (isRefreshing) return; // Prevent refresh if already refreshing

        refreshData(); // Call your existing refresh function

        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 30000); // Reset refreshing state after 30 seconds
    };

    const handleConnectedWalletAddress = (address) => {
        setConnectedWalletAddress(address); // Update the state with data received from WalletConnect
    };
    const handleLedgerConnection = (bool) => {
        setIsLedgerConnected(bool); // Update the state with data received from WalletConnect
    };
    const getSigner = async () => {
        if (window.keplr?.experimentalSuggestChain) {
            await window.keplr?.experimentalSuggestChain({
                // Chain details
                chainId: 'narwhal-2',
                chainName: "Migaloo Testnet",
                rpc: "https://migaloo-testnet-rpc.polkachu.com:443", // Example RPC endpoint, replace with actual
                rest: "https://migaloo-testnet-api.polkachu.com", // Example REST endpoint, replace with actual
                bip44: {
                    coinType: 118, // Example coinType, replace with actual
                },
                bech32Config: {
                    bech32PrefixAccAddr: "migaloo",
                    bech32PrefixAccPub: "migaloopub",
                    bech32PrefixValAddr: "migaloovaloper",
                    bech32PrefixValPub: "migaloovaloperpub",
                    bech32PrefixConsAddr: "migaloovalcons",
                    bech32PrefixConsPub: "migaloovalconspub",
                },
                currencies: [{
                    // Example currency, replace with actual
                    coinDenom: "whale",
                    coinMinimalDenom: "uwhale",
                    coinDecimals: 6,
                }],
                feeCurrencies: [{
                    // Example fee currency, replace with actual
                    coinDenom: "whale",
                    coinMinimalDenom: "uwhale",
                    coinDecimals: 6,
                }],
                stakeCurrency: {
                    // Example stake currency, replace with actual
                    coinDenom: "whale",
                    coinMinimalDenom: "uwhale",
                    coinDecimals: 6,
                },
                gasPriceStep: {
                    low: 0.2,
                    average: 0.45,
                    high: 0.75,
                },
            });
    
        }
        
        await window.keplr?.enable(chainId);
        const offlineSigner = window.keplr?.getOfflineSigner(chainId);
        return offlineSigner;
    };

    useEffect(() => {

      getGaugeVotes();
      getWhitelistAssets();
      queryAddressBalances(OPHIR_DAO_TREASURY_ADDRESS);
    }, []);

    const refreshData = () => {
        getGaugeVotes();
        // Optionally, you can also refresh other data if needed
    };

    const getGaugeVotes = async () => {
        try {
            const client = await CosmWasmClient.connect(rpc);
            const queryMsg = { state: {} };
            const result = await client.queryContractSmart(ERIS_GAUGE_CONTRACT_ADDRESS, queryMsg);
            console.log(result)
            setGaugeVoteResponse(result);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertInfo({
                open: true,
                message: `Error fetching gauge votes: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const getWhitelistAssets = async () => {
        try {
            const client = await CosmWasmClient.connect(rpc);
            const queryMsg = { whitelisted_assets: {} };
            const result = await client.queryContractSmart(ERIS_WHITELIST_CONTRACT_ADDRESS, queryMsg);
            console.log(result)
            setWhitelistResponse(result);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertInfo({
                open: true,
                message: `Error fetching whitelist assets: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const queryAddressBalances = async (address) => {
        const client = await StargateClient.connect(rpc);
        const balances = await client.getAllBalances(address);
        console.log(balances);
        return balances;
    };


    const chartData = {
        labels: [],
        datasets: [
            {
                label: 'Votes',
                data: [],
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    };

    if (gaugeVoteResponse) {
        Object.entries(gaugeVoteResponse.global_votes).forEach(([key, value]) => {
            const newKey = key.split(':')[1];
            const token = tokenMappings[newKey];
            const formattedValue = token ? value / (10 ** token.decimals) : value;
            chartData.labels.push(token ? token.symbol : newKey);
            chartData.datasets[0].data.push(formattedValue);
        });
    }

    return (
        <div className="global-bg mt-4 text-white min-h-screen flex flex-col items-center w-full" style={{ paddingTop: '10dvh' }}>
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
            <div className="absolute top-14 right-0 m-4 mr-2 sm:mr-4">
                <WalletConnect 
                    handleConnectedWalletAddress={handleConnectedWalletAddress} 
                    handleLedgerConnectionBool={handleLedgerConnection}
                />
            </div>
            {gaugeVoteResponse && (
                <motion.div 
                className="global-bg mt-4 text-white min-h-screen flex flex-col items-center w-full"
                style={{ paddingTop: '10vh' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div 
                    className="mt-8 w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg relative"
                    layout
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-2xl font-bold mb-4 flex justify-between items-center">
                        Restake Dashboard
                        <div className="tooltip" data-tip="Refresh Data">
                            <motion.img
                                src="https://cdn0.iconfinder.com/data/icons/modifiers-add-on-2-flat/48/Mod_Add-On_2-19-512.png"
                                alt="Refresh"
                                className={`cursor-pointer w-6 h-6 text-yellow-400 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`} // Adjust opacity based on isRefreshing state
                                whileHover={{ rotate: isRefreshing ? 0 : 180 }} // Prevent rotation when refreshing
                                whileTap={{ scale: isRefreshing ? 1 : 0.9 }} // Prevent scale when refreshing
                                onClick={refreshDataWithCooldown}
                                style={{ pointerEvents: isRefreshing ? 'none' : 'auto' }} // Disable pointer events when refreshing
                            />
                        </div>
                    </h2>
                    <p className="text-lg font-semibold">Global Votes:</p>
                    <motion.ul 
                        className="list-disc pl-8 mt-4 space-y-2"
                        layout
                    >
                        {Object.entries(gaugeVoteResponse.global_votes).map(([key, value], index) => {
                            const newKey = key.split(':')[1];
                            const token = tokenMappings[newKey];
                            const formattedValue = token ? (value / (10 ** token.decimals)).toFixed(2) : value;
                            return (
                                <motion.li 
                                    key={key} 
                                    className="flex justify-between items-center py-2 border-b border-white/20" // Added border-bottom here
                                    layout
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <span className="font-medium">{token ? token.symbol : newKey}:</span>
                                    <span className="font-light">{formattedValue} RSTK</span>
                                </motion.li>
                            );
                        })}
                    </motion.ul>
                    <p className="text-right font-light text-sm">
                        Last Updated: <span>{new Date(gaugeVoteResponse.update_time_s * 1000).toLocaleString([], { timeZoneName: 'short' })}</span>
                    </p>
                </motion.div>
                <motion.div className="w-full max-w-2xl my-8">
                        <Bar data={chartData} options={{ maintainAspectRatio: false }} />
                </motion.div>
            </motion.div>
            )}
            {/* {whitelistResponse && (
                <div className="mt-8 text-white">
                    <h2 className="text-2xl font-bold mb-4">Whitelisted Tokens</h2>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <p className="text-lg font-semibold">Tokens:</p>
                        <ul className="list-disc pl-8 mt-4">
                        {whitelistResponse["migaloo-1"].map((token, index) => {
                            const [type, address] = Object.entries(token)[0];
                            const formattedAddress = address.split('/').pop(); // Extract the last part of the address
                            return (
                                <li key={index} className="mt-2">
                                <span className="font-medium">{type.toUpperCase()} Token:</span> <span className="font-light">{formattedAddress}</span>
                                </li>
                            );
                            })}
                        </ul>
                    </div>
                </div>
            )} */}
        </div>
    );
};

export default RestakeDashboard;