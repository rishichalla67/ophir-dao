import React, { useState, useEffect } from 'react';
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { LedgerSigner } from "@cosmjs/ledger-amino";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import { stringToPath } from "@cosmjs/crypto";
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const USDC_DENOM = "ibc/BC5C0BAFD19A5E4133FDA0F3E04AE1FBEE75A4A226554B2CBB021089FF2E1F8A";
const OPHIR_DAO_VAULT_ADDRESS = "migaloo14gu2xfk4m3x64nfkv9cvvjgmv2ymwhps7fwemk29x32k2qhdrmdsp9y2wu";

const SeekerRound = () => {
    const [usdcAmount, setUsdcAmount] = useState('');
    const [connectedWalletAddress, setConnectedWalletAddress] = useState('migaloo1mn0642a3nh7ng0pwtk5rxqmhuz9yk08mz99qkq');
    const [usdcBalance, setUsdcBalance] = useState(0); // Add a state for the balance
    const [vestingData, setVestingData] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // Add this line to manage loading state
    const [isLoadingClaim, setIsLoadingClaim] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
    const [twitterHandle, setTwitterHandle] = useState('');
    const [isLedgerConnected, setIsLedgerConnected] = useState(false);

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
                showAlert("Error connecting to Keplr:", "error");
            }
        } else {
            showAlert("Please install Keplr extension", "info");
        }
        
    };

    const connectLedger = async () => {
        try {
            const transport = await TransportWebUSB.create();
            const ledgerSigner = new LedgerSigner(transport, {
                hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
                prefix: "migaloo-1",
            });
    
            // Example: Using ledgerSigner with SigningStargateClient
            const client = await SigningStargateClient.connectWithSigner(
                "https://rpc.cosmos.directory/migaloo", 
                ledgerSigner
            );
    
            // Now you can use `client` to sign and send transactions
            // For example, to get the accounts:
            const accounts = await ledgerSigner.getAccounts();
            setIsLedgerConnected(true);
            setConnectedWalletAddress(accounts[0].address.replace('-', ''));
            console.log(accounts)
        } catch (error) {
            console.error("Error connecting to Ledger:", error);
        }
    };

    const checkBalance = async (address) => {
        const baseUrl = "https://migaloo-lcd.erisprotocol.com"; // Replace with the actual REST API base URL for Migaloo
        const response = await fetch(`${baseUrl}/cosmos/bank/v1beta1/balances/${address}`);
        const data = await response.json();
    
        // Assuming the API returns a list of balance objects, each with denom and amount
        const usdcBalance = data.balances?.find(balance => balance.denom === USDC_DENOM);
    
        if (usdcBalance) {
            return usdcBalance.amount/1000000;
        } else {
            showAlert("No USDC balance found.", "error");
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
        if (amountNum > 100000) {
            showAlert("The amount cannot be greater than 100,000 USDC.", "error");
            setIsLoading(false);
            return;
        }
        // if (!twitterHandle) {
        //     showAlert("Please enter your Twitter handle.", "error");
        //     setIsLoading(false);
        //     return;
        // }
        if (usdcBalance < amountNum) {
            showAlert("Your USDC balance is less than the amount entered.", "error");
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
            const memo = `Twitter: ${twitterHandle}`;
    
            const client = await SigningStargateClient.connectWithSigner("https://rpc.cosmos.directory/migaloo", offlineSigner);
            const txHash = await client.signAndBroadcast(accountAddress, [msgSend], fee, memo);
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
    
        try {
            const chainId = "migaloo-1"; // Make sure this matches the chain you're interacting with
            let signer;
            let accountAddress;
    
            // Check if the user is connected through Ledger
            if (isLedgerConnected) { // You need to manage a state `isLedgerConnected` when connecting via Ledger
                const transport = await TransportWebUSB.create();
                const ledgerSigner = new LedgerSigner(transport, {
                    hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
                    prefix: "migaloo",
                });
                signer = ledgerSigner;
                const accounts = await ledgerSigner.getAccounts();
                accountAddress = accounts[0].address;
            } else {
                // Fallback to Keplr's offline signer if not using Ledger
                await window.keplr.enable(chainId);
                const offlineSigner = window.keplr.getOfflineSigner(chainId);
                signer = offlineSigner;
                const accounts = await offlineSigner.getAccounts();
                accountAddress = accounts[0].address;
            }
    
            // Define the contract execution parameters
            const contractAddress = "migaloo10uky7dtyfagu4kuxvsm26cvpglq25qwlaap2nzxutma594h6rx9qxtk9eq"; // The address of the contract
            const executeMsg = {
                claim: {
                    recipient: connectedWalletAddress, // The recipient address
                    amount: vestingData.amountVesting * 1000000, // The amount to claim
                },
            };
    
            const rpcEndpoint = "https://rpc.cosmos.directory/migaloo"; // RPC endpoint
            const client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer, {
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
        } catch (error) {
            console.error("Contract execution error:", error);
            showAlert("Contract execution failed.", "error");
        } finally {
            setIsLoadingClaim(false);
        }
    };
    
    const disconnectWallet = () => {
        setConnectedWalletAddress(''); // Reset the connected wallet address
        // Additionally, you might want to reset other relevant states
        setUsdcAmount(''); // Resetting the balance to 0 or initial state
        setUsdcBalance(''); // Resetting the balance to 0 or initial state
        setTwitterHandle(''); // Resetting the balance to 0 or initial state
        setIsLedgerConnected(false);
    };
    

    return (
        <div className="bg-black text-white min-h-dvh flex flex-col items-center justify-center" style={{ paddingTop: '65px' }}>
            <h1 className="text-3xl mt-14 font-bold text-yellow-400 mb-5">Seeker Round</h1>
            <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={() => setAlertInfo({ ...alertInfo, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setAlertInfo({ ...alertInfo, open: false })} severity={alertInfo.severity} sx={{ width: '100%' }}>
                    {alertInfo.message}
                </Alert>
            </Snackbar>
            <div className="absolute top-14 right-0 m-4 mr-1">
                {connectedWalletAddress ? (
                    <button 
                        onClick={disconnectWallet}
                        className="py-2 px-4 font-bold rounded flex items-center justify-center gap-2 mb-3 bg-black text-yellow-400 border-none shadow-lg transition-colors duration-300 md:hover:bg-yellow-400 md:hover:text-black"
                    >
                        Disconnect Wallet
                    </button>
                ) : (
                    <div>
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
                        {/* Icons and text */}
                        Connect LEAP
                    </button>
                    <button 
                        className="py-2 px-4 font-bold rounded flex items-center justify-center gap-2 mb-3"
                        style={{
                            backgroundColor: '#ffcc00', /* Adjusted to a gold/yellow color similar to the images */
                            color: 'black',
                            border: 'none',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', /* Adding some shadow for depth */
                        }}
                        onClick={connectLedger}
                    >
                        {/* Icons and text */}
                        Connect Ledger
                    </button>
                    </div>
                )}
            </div>
            <>
                <div className="bg-slate-800 w-9/10 mx-auto p-4 rounded-lg">
                    <div className="mt-1 text-white-600 hover:text-yellow-400 visited:text-purple-600 underline cursor-pointer" onClick={() => window.open("https://medium.com/@sebastian18018/introducing-ophir-daos-seeker-round-0f3a1d470d2e", "_blank")}>
                        Introduction and details of the seeker round →
                    </div>
                    {/* <div className="text-xl mt-10 md:text-3xl font-bold mb-4 hover:cursor-pointer" onClick={() => setUsdcAmount(usdcBalance)}>Balance: {usdcBalance}{usdcBalance !== '' ? ' USDC' : ''}</div> */}
                    <div className="mb-3 pt-4 flex items-center justify-center">
                        <input 
                            id="twitterHandle" 
                            type="text" 
                            pattern="^@([A-Za-z0-9_]){1,15}$"
                            title="Twitter handle must start with @ followed by up to 15 letters, numbers, or underscores."
                            className="text-lg bg-slate-800 text-white border border-yellow-400 rounded p-2 text-center w-full max-w-xs" 
                            placeholder="Enter your Twitter handle" 
                            value={twitterHandle}
                            onChange={(e) => setTwitterHandle(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="relative flex items-center text-lg bg-slate-800 text-white border border-yellow-400 rounded w-full max-w-xs">
                            <input 
                                id="usdcAmount" 
                                type="number" 
                                className="bg-slate-800 text-white rounded-l p-2 text-center flex-grow outline-none" 
                                placeholder="Enter amount" 
                                value={usdcAmount}
                                onChange={(e) => setUsdcAmount(e.target.value)}
                            />
                            <span className="px-3 border-l border-yellow-400">
                                USDC
                            </span>
                        </div>
                    </div>
                    <div className="mb-3 flex items-center justify-center">
                        <div className="relative py-2 flex items-center text-lg bg-slate-800 text-white border border-yellow-400 rounded w-full max-w-xs">
                            <div class="flex justify-between w-full">
                                <span className="text-sm pt-1 ml-3 cursor-pointer flex-grow" onClick={() => setUsdcAmount(usdcBalance)}>
                                    Balance: {parseFloat(usdcBalance).toFixed(2)}
                                </span>
                                <div>
                                    <button 
                                        className="text-sm text-black px-3 py-1 bg-gradient-to-r from-yellow-100 to-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50 rounded-l"
                                        onClick={() => setUsdcAmount(1000)}
                                    >
                                        Min
                                    </button>
                                    <button 
                                        className="text-sm text-black px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600  focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50"
                                        onClick={() => {
                                            if (parseInt(usdcAmount) < 100000) {
                                                setUsdcAmount(usdcAmount ? Math.min(parseInt(usdcAmount) + 500, 100000) : (usdcBalance >= 500 ? 500 : usdcBalance))
                                            }
                                        }}
                                    >
                                        +500
                                    </button>
                                    <button 
                                        className="text-sm text-black px-3 py-1 mr-1 bg-gradient-to-r from-yellow-600 to-yellow-700  focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50 rounded-r"
                                        onClick={() => setUsdcAmount(100000)}
                                    >
                                        Max
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {usdcAmount && (
                        <div className="mt-3 text-white text-xs md:text-sm text-center">
                            {Number(usdcAmount / 0.0025).toLocaleString()} OPHIR ready to claim at {new Date(new Date().setMonth(new Date().getMonth() + 6)).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                        </div>
                    )}
                    <div className="flex pt-4 flex-col items-center justify-center">
                        <button 
                            className={`py-2 px-4 ${isLoading ? 'bg-gray-400' : 'bg-gradient-to-r from-yellow-600 to-yellow-400 hover:bg-amber-200'} text-black font-bold rounded`}
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
                </div>
            </>
            <div className="max-w-lg mt-4 mx-auto p-1 text-center">
                
                {vestingData && (
                    <>
                    <div className="text-2xl mb-2">Vesting Details</div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden ">
                        <div className="p-4 border-b border-gray-200">
                            <div className="font-bold text-sm text-white">Address:</div>
                            <div className="text-white md:hidden">{`${vestingData.address.substring(0, 10)}...${vestingData.address.substring(vestingData.address.length - 5)}`}</div>
                            <div className="hidden md:block text-white">{`${vestingData.address}`}</div>
                        </div>
                        <div className="p-4 border-b border-gray-200">
                            <div className="font-bold text-sm text-white">Amount Vesting:</div>
                            <div className="text-white">{vestingData.amountVesting}</div>
                        </div>
                        <div className="p-4 border-b border-gray-200">
                            <div className="font-bold text-sm text-white">Vesting Start:</div>
                            <div className="text-white">{new Date(vestingData.vestingStart * 1000).toLocaleString()}</div>
                        </div>
                        <div className="p-4 border-b border-gray-200">
                            <div className="font-bold text-sm text-white">Vesting End:</div>
                            <div className="text-white">{new Date(vestingData.vestingEnd * 1000).toLocaleString()}</div>
                        </div>
                        {new Date() > new Date(vestingData.vestingEnd * 1000) && (
                            <div className="p-4">
                                <button className="bg-yellow-400 hover:bg-yellow-600 text-black font-bold py-1 px-2 rounded" onClick={() => claimSeekerOphir()}>
                                    {isLoadingClaim ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                                        </div>
                                    ) : (
                                        "Claim OPHIR"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SeekerRound;