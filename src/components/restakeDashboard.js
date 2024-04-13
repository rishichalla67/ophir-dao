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
    const [ophirGaugeStats, setOphirGaugeStats] = useState(null);
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
      getOphirGaugeStats();
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

    const getOphirGaugeStats= async () => {
        try {
            const client = await CosmWasmClient.connect(rpc);
            const queryMsg = { user_info: { user: "migaloo10gj7p9tz9ncjk7fm7tmlax7q6pyljfrawjxjfs09a7e7g933sj0q7yeadc"} };
            const result = await client.queryContractSmart(ERIS_GAUGE_CONTRACT_ADDRESS, queryMsg);
            console.log(result)
            setOphirGaugeStats(result);
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
        <div className="global-bg mt-4 text-white min-h-screen flex flex-col items-center w-full px-4" style={{ paddingTop: '10dvh' }}>
            <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={() => setAlertInfo({ ...alertInfo, open: false })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                    {alertInfo.htmlContent ? (
                        <SnackbarContent
                            style={{color: 'black', backgroundColor: alertInfo.severity === 'error' ? '#ffcccc' : '#ccffcc' }}
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
                <div className="w-full max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Ophir Stats */}
                        {ophirGaugeStats && (
                            <div className="bg-gray-800 mt-10 md:mt-0 p-6 rounded-lg shadow-lg col-span-1">
                                <h2 className="text-2xl font-bold mb-4 text-yellow-400">Ophir Stats</h2>
                                {/* Ophir Stats Content */}
                                <div className="space-y-4 mt-4">
                                    <p>Voting Power: <span className="font-light">{(parseInt(ophirGaugeStats.user.voting_power/1000000)/1000000 * 100).toLocaleString()}%</span></p>
                                    <p>Votes:</p>
                                    <div className="pl-4">
                                        {ophirGaugeStats.user.votes.map(([asset, amount], index) => (
                                            <p key={index}>
                                                <span className="font-medium">{tokenMappings[asset.split(':')[1]]?.symbol}:</span> <span className="font-light">{amount.toLocaleString()} RSTK</span>
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-lg font-semibold mt-4">Staked:</p>
                                <p className="font-light">{(parseInt(ophirGaugeStats.staked, 10)/1000000).toLocaleString()} RSTK</p>
                            </div>
                        )}
                        {/* Global Votes */}
                        
                    {/* Chart */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full col-span-1 md:col-span-2 lg:col-span-3">
                        <h2 className="text-2xl font-bold mb-4 text-white">Global Votes on Asset Yields</h2>
                        <Bar 
                            data={{
                                ...chartData,
                                datasets: chartData.datasets.map(dataset => ({
                                    ...dataset,
                                    backgroundColor: 'rgba(255, 184, 0, 1)', // Tailwind yellow-400
                                }))
                            }} 
                            options={{ 
                                maintainAspectRatio: true,
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                let label = context.dataset.label || '';
                                                if (label) {
                                                    label += ': ';
                                                }
                                                if (context.parsed.y !== null) {
                                                    label += context.parsed.y.toLocaleString() + ' RSTK';
                                                }
                                                return label;
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        ticks: {
                                            color: "#ffffff", // White text for ticks
                                            font: function(context) {
                                                let width = window.innerWidth;
                                                if (width < 600) {
                                                    return { size: 12 }; // Smaller screens
                                                } else if (width < 960) {
                                                    return { size: 14 }; // Medium screens
                                                } else {
                                                    return { size: 16 }; // Larger screens
                                                }
                                            },
                                        }
                                    },
                                    x: {
                                        ticks: {
                                            color: "#ffffff", // White text for ticks
                                            // Dynamically adjust font size based on screen width
                                            font: function(context) {
                                                let width = window.innerWidth;
                                                if (width < 600) {
                                                    return { size: 12 }; // Smaller screens
                                                } else if (width < 960) {
                                                    return { size: 14 }; // Medium screens
                                                } else {
                                                    return { size: 16 }; // Larger screens
                                                }
                                            },
                                        }
                                    }
                                }
                            }} 
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

export default RestakeDashboard;