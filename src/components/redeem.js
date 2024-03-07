import React, { useState, useEffect } from 'react';

const Redeem = () => {
    const [ophirAmount, setOphirAmount] = useState('');
    const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
    const [ophirBalance, setOphirBalance] = useState(0); // Add a state for the balance

    useEffect(() => {
        if (connectedWalletAddress) {
            checkBalance(connectedWalletAddress).then(balance => {
                setOphirBalance(balance); // Update the balance state when the promise resolves
            });
        }
    }, [connectedWalletAddress]); // Re-run this effect when connectedWalletAddress changes

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
                console.log(accounts);
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
        const ophirBalance = data.balances.find(balance => balance.denom === "factory/migaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5/ophir");
    
        if (ophirBalance) {
            console.log(`Ophir Balance: ${ophirBalance.amount}`);
            return ophirBalance.amount/1000000;
        } else {
            console.log("Ophir Balance: 0");
            return 0;
        }
    };

    const disconnectWallet = () => {
        setConnectedWalletAddress(''); // Reset the connected wallet address
        // Additionally, you might want to reset other relevant states
        setOphirBalance(0); // Resetting the balance to 0 or initial state
    };
    

    return (
        <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center">
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
                    className="py-2 px-4 font-bold rounded flex items-center justify-center gap-2 mb-3"
                    style={{
                        backgroundColor: '#ffcc00',
                        color: 'black',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    Disconnect Wallet
                </button>
            )}
            <>
                <div className="text-3xl font-bold mb-4">Ophir Balance: {ophirBalance} OPHIR</div>
                <div className="mb-4">
                    <input 
                        id="ophirAmount" 
                        type="number" 
                        className="text-xl bg-slate-800 text-white border border-yellow-400 rounded p-2" 
                        placeholder="Enter OPHIR amount" 
                        value={ophirAmount}
                        onChange={(e) => setOphirAmount(e.target.value)}
                    />
                    {ophirAmount && (
                        <div className="mt-4">
                            <p className="text-xl mb-2">Asset Redeemed:</p>
                            <ul>
                                <li>wBTC: {(parseInt(ophirAmount) * 0.0001).toFixed(4)}</li>
                                <li>bWhale: {(parseInt(ophirAmount) * 2).toFixed(0)}</li>
                                <li>ampWhale: {(parseInt(ophirAmount) * 1.5).toFixed(0)}</li>
                                <li>kuji: {(parseInt(ophirAmount) * 0.75).toFixed(2)}</li>
                                <li>mUSDC: {(parseInt(ophirAmount) * 1.1).toFixed(2)}</li>
                            </ul>
                        </div>
                    )}
                </div>
                <button className="py-2 px-4 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-500">
                Withdraw
                </button>
            </>
        </div>
    );
};

export default Redeem;

