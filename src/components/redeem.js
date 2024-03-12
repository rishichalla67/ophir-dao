import React, { useState, useEffect } from 'react';
import { SigningStargateClient } from "@cosmjs/stargate";



const Redeem = () => {
    const [ophirAmount, setOphirAmount] = useState('');
    const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
    const [ophirBalance, setOphirBalance] = useState(0); // Add a state for the balance
    const [redemptionValues, setRedemptionValues] = useState({});
    const [ophirPrices, setOphirPrices] = useState({});

    useEffect(() => {
        fetch('https://parallax-analytics.onrender.com/ophir/prices')
            .then(response => response.json())
            .then(data => setOphirPrices(data))
            .catch(error => console.error('Error fetching Ophir prices:', error));
    }, []);


    useEffect(() => {
        if (connectedWalletAddress) {
            checkBalance(connectedWalletAddress).then(balance => {
                setOphirBalance(balance); // Update the balance state when the promise resolves
            });
        }
    }, [connectedWalletAddress]); // Re-run this effect when connectedWalletAddress changes

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (ophirAmount) {
                fetch(`https://parallax-analytics.onrender.com/ophir/calculateRedemptionValue?amount=${ophirAmount}`)
                    .then(response => response.json())
                    .then(data => setRedemptionValues(data))
                    .catch(error => console.error('Error fetching redemption values:', error));
            }
        }, 500); // 500ms debounce time
    
        return () => clearTimeout(debounceTimer); // Clear the timeout if the component unmounts or the value changes
    }, [ophirAmount]);

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

    const withdrawCoins = async () => {
        if (!ophirAmount) {
            alert("Please enter an amount to withdraw.");
            return;
        }

        try {
            const chainId = "migaloo-1"; // Make sure this matches the chain you're interacting with
            await window.keplr.enable(chainId);
            const offlineSigner = window.keplr.getOfflineSigner(chainId);
            const accounts = await offlineSigner.getAccounts();
            const accountAddress = accounts[0].address;

            const amount = {
                denom: "factory/migaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5/ophir",
                amount: String(parseInt(ophirAmount) * 1000000),
            };

            const msgSend = {
                typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                value: {
                    fromAddress: accountAddress,
                    toAddress: "migaloo10gj7p9tz9ncjk7fm7tmlax7q6pyljfrawjxjfs09a7e7g933sj0q7yeadc", // Treasury Address
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
            const txHash = await client.signAndBroadcast(accountAddress, [msgSend], fee, "Withdraw OPHIR");
            console.log("Transaction Hash:", txHash);
            alert("Withdrawal successful!");
        } catch (error) {
            console.error("Withdrawal error:", error);
            alert("Withdrawal failed. See console for details.");
        }
    };
    
    const disconnectWallet = () => {
        setConnectedWalletAddress(''); // Reset the connected wallet address
        // Additionally, you might want to reset other relevant states
        setOphirBalance(0); // Resetting the balance to 0 or initial state
    };
    

    return (
        <div className="bg-black mt-4 text-white min-h-screen flex flex-col items-center" style={{ paddingTop: '10dvh' }}>
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
                <div className="w-full max-w-4xl flex flex-col items-center">
                    <div className="text-xl sm:text-3xl font-bold mb-2">Ophir Balance: {ophirBalance}</div>
                    <div className="text-md sm:text-xl mb-2">
                                        Redemption Price: ${redemptionValues.redemptionPricePerOPHIR ? redemptionValues.redemptionPricePerOPHIR.toFixed(7) : '0.00'}
                                    </div>
                        <div className="mb-4 items-center flex flex-col">
                            <input 
                                id="ophirAmount" 
                                type="number" 
                                className="text-xl bg-slate-800 text-white border border-yellow-400 rounded p-2 text-center" 
                                placeholder="Enter OPHIR amount" 
                                value={ophirAmount}
                                onChange={(e) => setOphirAmount(e.target.value)}
                            />
                            {ophirAmount && (
                                <div className="mt-4 overflow-x-auto">
                                    <p className="text-xl mb-2 items-center flex flex-col">Assets to be redeemed:</p>
                                    <table className="table-auto w-full">
                                        <thead>
                                            <tr className="text-left">
                                                <th className="px-4 py-2">Asset</th>
                                                <th className="px-4 py-2">Amount</th>
                                                <th className="px-4 py-2">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {Object.entries(redemptionValues)
                                            .filter(([key]) => !["redemptionPricePerOPHIR", "totalRedemptionValue", "calculatedAt"].includes(key))
                                            .map(([asset, amount]) => {
                                                const price = ophirPrices[asset] || 0; // Get the price of the asset, default to 0 if not found
                                                const value = amount * price; // Calculate the value by multiplying the amount by the price
                                                return { asset, amount, value }; // Return an object with asset, amount, and value
                                            })
                                            .sort((a, b) => b.value - a.value) // Sort by value in descending order
                                            .map(({ asset, amount, value }) => (
                                                <tr key={asset} className="bg-black">
                                                    <td className="border px-4 py-2 text-sm sm:text-base">{asset}</td>
                                                    <td className="border px-4 py-2 text-sm sm:text-base">{amount.toFixed(6)}</td>
                                                    <td className="border px-4 py-2 text-sm sm:text-base">${value.toFixed(2)}</td> {/* Display the value with 2 decimal places */}
                                                </tr>
                                            ))
                                        }
                                        </tbody>
                                    </table>
                                    <div className="text-center mt-4 text-sm sm:text-base">
                                        Total Value of Redeemed Assets: ${redemptionValues.totalRedemptionValue ? redemptionValues.totalRedemptionValue.toFixed(2) : '0.00'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                <div className="flex flex-col items-center justify-center">
                    <button 
                        className="py-2 px-4 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-500"
                        onClick={withdrawCoins} // Use the withdrawCoins function when this button is clicked
                    >
                        Withdraw
                    </button>
                    <p className="text-xs mt-2 text-center">Please be cautious as this is a live contract.</p>
                </div>
            </>
        </div>
    );
};

export default Redeem;