import React, { useState } from 'react';

const Redeem = () => {
    const [ophirAmount, setOphirAmount] = useState('');
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
            } catch (error) {
                console.error("Error connecting to Keplr:", error);
            }
        } else {
            alert("Please install Keplr extension");
        }
    };
    return (
        <div className="bg-slate-800 text-white min-h-screen flex flex-col items-center justify-center">
        <button 
                className="py-2 px-4 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-500"
                onClick={connectWallet}
            >
                Connect Your Wallet
            </button>
        <>
            <div className="text-3xl font-bold mb-4">Ophir Balance: 0</div>
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

