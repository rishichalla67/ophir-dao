import React, { useState, useEffect } from 'react';
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const USDC_DENOM = "ibc/BC5C0BAFD19A5E4133FDA0F3E04AE1FBEE75A4A226554B2CBB021089FF2E1F8A";
const OPHIR_DAO_VAULT_ADDRESS = "migaloo14gu2xfk4m3x64nfkv9cvvjgmv2ymwhps7fwemk29x32k2qhdrmdsp9y2wu";

const SeekerRound = () => {
    const [usdcAmount, setUsdcAmount] = useState('');
    const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
    const [usdcBalance, setUsdcBalance] = useState(0); // Add a state for the balance
    const [vestingData, setVestingData] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // Add this line to manage loading state
    const [isLoadingClaim, setIsLoadingClaim] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });

    const showAlert = (message, severity = 'info') => {
        setAlertInfo({ open: true, message, severity });
    };

    useEffect(() => {
        if (connectedWalletAddress) {
            checkBalance(connectedWalletAddress).then(balance => {
                setUsdcBalance(balance); // Update the balance state when the promise resolves
            });
            checkVesting(connectedWalletAddress);
        }
    }, [connectedWalletAddress]); // Re-run this effect when connectedWalletAddress changes

    async function checkVesting(address) {
        const baseUrl = "https://parallax-analytics.onrender.com/ophir/seeker-vesting?contractAddress=";
        const response = await fetch(`${baseUrl}${address}`);
        const data = await response.json();
        // Check if the response contains the specific message indicating no vesting details
        if (data.message !== "Vesting details not found for the given contract address") {
            setVestingData(data); // Store the vesting data in state if it exists
        } else {
            setVestingData(null); // Reset or ignore the vesting data if not found
        }
    }

    const connectWallet = async () => {
        if (window.keplr) {
            try {
                await window.keplr.experimentalSuggestChain({
                    chainId: "migaloo-1",
                    chainName: "Migaloo",
                    rpc: "https://rpc.cosmos.directory/migaloo",
                    rest: "https://rest.cosmos.directory/migaloo",
                    bip44: {
                        coinType: 118,
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
                        coinDenom: "WHALE",
                        coinMinimalDenom: "uwhale",
                        coinDecimals: 6,
                        coinGeckoId: "white-whale",
                    }],
                    feeCurrencies: [{
                        coinDenom: "WHALE",
                        coinMinimalDenom: "uwhale",
                        coinDecimals: 6,
                        coinGeckoId: "white-whale",
                    }],
                    stakeCurrency: {
                        coinDenom: "WHALE",
                        coinMinimalDenom: "uatom",
                        coinDecimals: 6,
                        coinGeckoId: "white-whale",
                    },
                    gasPriceStep: {
                        low: 0.75,
                        average: 0.85,
                        high: 1.5
                    },
                    features: ['stargate', 'ibc-transfer'],
                });
                const chainId = "migaloo-1"; // Make sure to use the correct chain ID for Migaloo
                await window.keplr.enable(chainId);
                const offlineSigner = window.keplr.getOfflineSigner(chainId);
                const accounts = await offlineSigner.getAccounts();
                setConnectedWalletAddress(accounts[0].address);
                
            } catch (error) {
                console.error("Error connecting to Keplr:", error);
            }
        } else {
            alert("Please install Keplr extension");
        }
    };

    const checkBalance = async (address) => {
        const baseUrl = "https://migaloo-lcd.erisprotocol.com"; // Replace with the actual REST API base URL for Migaloo
        const response = await fetch(`${baseUrl}/cosmos/bank/v1beta1/balances/${address}`);
        const data = await response.json();
    
        // Assuming the API returns a list of balance objects, each with denom and amount
        const usdcBalance = data.balances.find(balance => balance.denom === USDC_DENOM);
    
        if (usdcBalance) {
            console.log(`USDC Balance: ${usdcBalance.amount}`);
            return usdcBalance.amount/1000000;
        } else {
            console.log("USDC Balance: 0");
            return 0;
        }
    };

    const sendSeekerFunds = async () => {
        setIsLoading(true);
        const amountNum = parseFloat(usdcAmount);
        if (!usdcAmount || isNaN(amountNum) || amountNum < 1000 || amountNum % 500 !== 0) {
            showAlert("Please enter an amount that is a minimum of 1000 and in increments of 500.", "error");
            setIsLoading(false);
            return;
        }
    
        try {
            const chainId = "migaloo-1"; // Make sure this matches the chain you're interacting with
            await window.keplr.enable(chainId);
            const offlineSigner = window.keplr.getOfflineSigner(chainId);
            const accounts = await offlineSigner.getAccounts();
            const accountAddress = accounts[0].address;
    
            const amount = {
                denom: USDC_DENOM,
                amount: String(amountNum * 1000000),
            };
    
            const msgSend = {
                typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                value: {
                    fromAddress: accountAddress,
                    toAddress: OPHIR_DAO_VAULT_ADDRESS, // OPHIR MS Dao Treasury Address
                    amount: [amount],
                },
            };
    
            const fee = {
                amount: [{
                    denom: "uwhale",
                    amount: "5000",
                }],
                gas: "200000",
            };
    
            const client = await SigningStargateClient.connectWithSigner("https://rpc.cosmos.directory/migaloo", offlineSigner);
            const txHash = await client.signAndBroadcast(accountAddress, [msgSend], fee, "Send USDC to OPHIR Dao for $OPHIR");
            console.log("Transaction Hash:", txHash);
            showAlert("Successfully sent USDC to OPHIR DAO Vault.", "success");
            checkBalance(connectedWalletAddress).then(balance => {
                setUsdcBalance(balance); // Update the balance state when the promise resolves
            });
        } catch (error) {
            console.error("Withdrawal error:", error);
            showAlert("Seeker Funds to OPHIR DAO Vault failed.", "error");
        }finally{
            setIsLoading(false);
        }
    };

    const claimSeekerOphir = async () => {
        setIsLoadingClaim(true);
        // const amountNum = parseFloat(usdcAmount);
        // if (!usdcAmount || isNaN(amountNum) || amountNum < 1000 || amountNum % 500 !== 0) {
        //     showAlert("Please enter an amount that is a minimum of 1000 and in increments of 500.", "error");
        //     setIsLoading(false);
        //     return;
        // }
    
        try {
            const chainId = "migaloo-1"; // Make sure this matches the chain you're interacting with
            await window.keplr.enable(chainId);
            const offlineSigner = window.keplr.getOfflineSigner(chainId);
            const accounts = await offlineSigner.getAccounts();
            const accountAddress = accounts[0].address;
        
            // Define the contract execution parameters
            const contractAddress = "migaloo10uky7dtyfagu4kuxvsm26cvpglq25qwlaap2nzxutma594h6rx9qxtk9eq"; // The address of the contract
            const executeMsg = {
                claim: {
                    recipient: connectedWalletAddress, // The recipient address
                    amount: vestingData.amountVesting * 1000000, // The amount to claim
                },
            };
        
            const rpcEndpoint = "https://rpc.cosmos.directory/migaloo"; // RPC endpoint
            const client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, offlineSigner, {
                prefix: "migaloo",
            });
        
            const fee = {
                amount: [{
                    denom: "uwhale",
                    amount: "5000",
                }],
                gas: "200000",
            };
        
            const result = await client.execute(accountAddress, contractAddress, executeMsg, fee, "Execute Wasm Contract Claim");
            console.log("Transaction Hash:", result.transactionHash);
            showAlert("Successfully executed contract claim.", "success");
            // Optionally, update the balance or any other state as needed
        } catch (error) {
            console.error("Contract execution error:", error);
            showAlert("Contract execution failed.", "error");
        }finally{
            setIsLoadingClaim(false);
        }
    };
    
    const disconnectWallet = () => {
        setConnectedWalletAddress(''); // Reset the connected wallet address
        // Additionally, you might want to reset other relevant states
        setUsdcAmount(0); // Resetting the balance to 0 or initial state
    };
    

    return (
        <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center">
            <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={() => setAlertInfo({ ...alertInfo, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setAlertInfo({ ...alertInfo, open: false })} severity={alertInfo.severity} sx={{ width: '100%' }}>
                    {alertInfo.message}
                </Alert>
            </Snackbar>
            {connectedWalletAddress ? (
                <></>
            ) : (
                <button 
                    className="py-2 px-4 font-bold rounded flex items-center justify-center gap-2 mb-3"
                    style={{
                        backgroundColor: '#ffcc00', /* Adjusted to a gold/yellow color similar to the images */
                        color: 'black',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', /* Adding some shadow for depth */
                    }}
                    onClick={connectWallet}
                >
                    <img src="https://play-lh.googleusercontent.com/SKXXUqR4jXkvPJvKSXhJkQjKUU9wA-hI9lgBTrpxEz5GP8NbaOeSaEp1zzQscv8BTA=w240-h480-rw" alt="KEPLR Wallet Icon" style={{ width: '24px', height: '24px' }} /> {/* Icon representing the wallet, adjust path accordingly */}
                    <img src="https://play-lh.googleusercontent.com/qXNXZaFX6PyEksn3kdaRVuzSXoxiCLObrDhpWjN71IxyncCSS-Ftvdi_Hbr2pucgBSM" alt="LEAP Wallet Icon" style={{ width: '24px', height: '24px' }} /> {/* Icon representing the wallet, adjust path accordingly */}
                    Connect Your Wallet
                </button>
            )}
            {connectedWalletAddress && (
                <button 
                onClick={disconnectWallet}
                className="py-2 px-4 font-bold rounded flex items-center justify-center gap-2 mb-3 bg-black text-yellow-400 border-none shadow-lg hover:bg-yellow-400 hover:text-black transition-colors duration-300"
            >
                Disconnect Wallet
            </button>
            )}
            <>
                <div className="text-xl md:text-3xl font-bold mb-4">USDC Balance: {usdcBalance} USDC</div>
                <div className="mb-4 flex items-center">
                    <input 
                        id="usdcAmount" 
                        type="number" 
                        className="text-xl bg-slate-800 text-white border border-yellow-400 rounded p-2" 
                        placeholder="Enter USDC amount" 
                        value={usdcAmount}
                        onChange={(e) => setUsdcAmount(e.target.value)}
                    />
                    <button 
                        className="ml-2 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-500 px-4 py-2"
                        onClick={() => setUsdcAmount(usdcBalance)}
                    >
                        Max
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center">
                        <button 
                            className={`py-2 px-4 ${isLoading ? 'bg-gray-400' : 'bg-yellow-400 hover:bg-yellow-500'} text-black font-bold rounded`}
                            onClick={sendSeekerFunds}
                            disabled={isLoading} // Disable the button when isLoading is true
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="flex justify-center items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-400"></div>
                                    </div>
                                </div>
                            ) : (
                                "Send USDC to OPHIR DAO Vault"
                            )}
                        </button>
                    <div className="text-xs mt-2 text-center">
                        <a href="https://daodao.zone/dao/migaloo14gu2xfk4m3x64nfkv9cvvjgmv2ymwhps7fwemk29x32k2qhdrmdsp9y2wu/treasury" target="_blank" rel="noopener noreferrer">Destination Address: {`${OPHIR_DAO_VAULT_ADDRESS.substring(0, 10)}...${OPHIR_DAO_VAULT_ADDRESS.substring(OPHIR_DAO_VAULT_ADDRESS.length - 4)}`}</a>
                        <button 
                            onClick={() => navigator.clipboard.writeText(OPHIR_DAO_VAULT_ADDRESS)}
                            className="ml-2 bg-transparent text-yellow-400 hover:text-yellow-500 font-bold rounded"
                        >
                            <img src="https://png.pngtree.com/png-vector/20190223/ourlarge/pngtree-vector-copy-icon-png-image_695355.jpg" alt="Copy" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} className="" />
                        </button>
                    </div>
                    <p className="text-xs mt-2 text-center">Please be cautious as this is a live contract.</p>
                </div>
            </>
            {vestingData && (
                <div className="mt-4">
                    <div className="text-2xl mb-2">Vesting Details</div>
                    <table className="table-auto border-collapse border border-slate-500">
                    <thead>
                    <tr>
                            <th className="border border-slate-600 text-center px-2 py-1">Address</th>
                            <th className="border border-slate-600 text-center px-2 py-1">Amount Vesting</th>
                            <th className="border border-slate-600 text-center px-2 py-1">Vesting Start</th>
                            <th className="border border-slate-600 text-center px-2 py-1">Vesting End</th>
                            {new Date() > new Date(vestingData.vestingEnd * 1000) && (
                                <th className="border border-slate-600 text-center px-2 py-1">Claim</th>
                            )}
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td className="border border-slate-700 text-center px-2 py-1">{vestingData.address}</td>
                            <td className="border border-slate-700 text-center px-2 py-1">{vestingData.amountVesting}</td>
                            <td className="border border-slate-700 text-center px-2 py-1">{new Date(vestingData.vestingStart * 1000).toLocaleString()}</td>
                            <td className="border border-slate-700 text-center px-2 py-1">{new Date(vestingData.vestingEnd * 1000).toLocaleString()}</td>
                            {new Date() > new Date(vestingData.vestingEnd * 1000) && (
                                <td className="border border-slate-700 text-center px-2 py-1">
                                    <button className="bg-yellow-400 hover:bg-yellow-600 text-black font-bold py-1 px-2 rounded" onClick={() => claimSeekerOphir()}>
                                        {isLoadingClaim ? (
                                            <div className="flex items-center justify-center">
                                                <div className="flex justify-center items-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            "Claim OPHIR"
                                        )}
                                    </button>
                                </td>
                            )}
                        </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SeekerRound;