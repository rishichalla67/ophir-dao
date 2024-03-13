import React, { useState, useEffect } from 'react';
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { LedgerSigner } from "@cosmjs/ledger-amino";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import { stringToPath } from "@cosmjs/crypto";
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';

import "../App.css"

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
    const [twitterHandle, setTwitterHandle] = useState('');
    const [isLedgerConnected, setIsLedgerConnected] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showAlert = (message, severity = 'info', htmlContent = null) => {
        setAlertInfo({ open: true, message, severity, htmlContent });
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
        // Check if the response contains the specific message indicating no vesting details or amountVesting is 0
        if (data.message !== "Vesting details not found for the given contract address" && data.amountVesting !== 0) {
            setVestingData(data); // Store the vesting data in state if it exists
        } else {
            setVestingData(null); // Reset or ignore the vesting data if not found or amountVesting is 0
        }
    }

    const connectWallet = async () => {
        if (window.keplr || window.leap) {
            try {
                const chainId = "migaloo-1"; // Make sure to use the correct chain ID for Migaloo
                await window.keplr.enable(chainId);
                const offlineSigner = window.keplr.getOfflineSigner(chainId);
                const accounts = await offlineSigner.getAccounts();
                setConnectedWalletAddress(accounts[0].address);
                setIsLedgerConnected(false); // Indicate that the connection is not through Ledger
                setIsModalOpen(false); // Close the modal after successful connection
                return; // Exit the function after successful connection
            } catch (error) {
                console.error("Error connecting to LEAP or Keplr:", error);
                showAlert(`Error connecting to LEAP or Keplr: ${error.message}`, "error");
                setIsModalOpen(false); // Close the modal after successful connection
                // Don't return here, try connecting with Ledger next
            }
        } else {
            showAlert("Keplr or LEAP extension not found...", "error");
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
            console.log(accounts);
            setIsModalOpen(false); // Close the modal after successful connection
            showAlert("Ledger connected successfully.", "success");
        } catch (error) {
            console.error("Error connecting to Ledger:", error);
            showAlert(`Error connecting to Ledger: ${error.message}`, "error");
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
            showAlert(
                "Successfully sent USDC to OPHIR DAO Vault.", 
                "success", 
                `Successfully sent USDC to OPHIR DAO Vault. Transaction: <a href="https://inbloc.org/migaloo/transactions/${txHash.transactionHash}" target="_blank" rel="noopener noreferrer" style="color: black;">https://inbloc.org/migaloo/transactions/${txHash.transactionHash}</a>`
            );
            checkBalance(connectedWalletAddress).then(balance => {
            setUsdcBalance(balance); // Update the balance state when the promise resolves
            });
        } catch (error) {
            console.error("Withdrawal error:", error);
            showAlert(`Seeker Funds to OPHIR DAO Vault failed. ${error}`, "error");
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
                    amount: (vestingData.amountVesting * 1000000).toString(), // The amount to claim, converted to string
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
            showAlert(`Successfully executed contract claim. Transaction: https://inbloc.org/migaloo/transactions/${result.transactionHash}`, "success");
        } catch (error) {
            console.error("Contract execution error:", error);
            showAlert(`Contract execution failed. ${error} `, "error");
        } finally {
            setIsLoadingClaim(false);
        }
    };

    const resetWalletState = () => {
        setConnectedWalletAddress('');
        setUsdcAmount('');
        setUsdcBalance('');
        setTwitterHandle('');
        setIsLedgerConnected(false);
    };
    
    const disconnectWallet = async () => {
        if (window.leap) {
            await window.leap.disconnect("migaloo-1")
            .then(() => {
                resetWalletState();
            });
        } else if (window.keplr) {
            // Assuming Keplr has a similar disconnect method
            await window.keplr.disconnect("migaloo-1")
            .then(() => {
                resetWalletState();
            });
        }
    };
    

    return (
        <div className="global-bg text-white min-h-dvh w-full flex flex-col items-center justify-content" style={{ paddingTop: '20dvh' }}>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-black p-5 rounded-lg shadow-lg border border-yellow-400">
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => connectWallet()} className="flex flex-col items-center justify-center p-2 hover:bg-slate-600 rounded">
                                <img src="https://play-lh.googleusercontent.com/qXNXZaFX6PyEksn3kdaRVuzSXoxiCLObrDhpWjN71IxyncCSS-Ftvdi_Hbr2pucgBSM=w240-h480-rw" alt="Leap/Leap Extension" className="w-12 h-12"/>
                                <span>LEAP Extension</span>
                            </button>
                            <button onClick={() => connectLedger()} className="flex flex-col items-center justify-center p-2 hover:bg-slate-600 rounded">
                                <img src="https://www.ledger.com/wp-content/uploads/2023/08/Ledger-logo-696.png" alt="Ledger" className="w-12 h-12"/>
                                <span>Ledger</span>
                            </button>
                            {/* <button onClick={() => connectLeapMobile()} className="flex flex-col items-center justify-center p-2 hover:bg-slate-600 rounded">
                                <img src="https://play-lh.googleusercontent.com/qXNXZaFX6PyEksn3kdaRVuzSXoxiCLObrDhpWjN71IxyncCSS-Ftvdi_Hbr2pucgBSM=w240-h480-rw" alt="Ledger" className="w-12 h-12"/>
                                <span>Leap Mobile</span>
                            </button> */}
                            {/* Add more buttons for other wallets as needed */}
                        </div>
                        <div className="flex justify-center w-full">
                            <button onClick={() => setIsModalOpen(false)} className="py-2 px-4 mt-4 font-medium rounded flex items-center justify-center gap-2 bg-black text-yellow-400 border-none shadow-lg transition-colors duration-300 md:hover:bg-yellow-400 md:hover:text-black connect-button">Close</button>
                        </div>
                    <div className="flex justify-center w-full mt-4 sm:hidden">
                    <a href="https://leapcosmoswallet.page.link/BfpmrsQLhrqJqtQx6" target="_blank" rel="noopener noreferrer" className="" style={{ textDecoration: 'underline', color: 'yellow', cursor: 'pointer' }}>Open this page in LEAP</a>
                    </div>
                    </div>
                </div>
            )}
            {/* Snackbar for alerts */}
            <h1 className={`text-3xl ${vestingData ? 'mt-14' : ''} mb-3 font-bold h1-color`}>Seeker Round</h1>
            {/* <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={() => setAlertInfo({ ...alertInfo, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setAlertInfo({ ...alertInfo, open: false })} severity={alertInfo.severity} sx={{ width: '100%' }}>
                    {alertInfo.message}
                </Alert>
            </Snackbar> */}
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
                {connectedWalletAddress ? (
                    <button 
                        onClick={disconnectWallet}
                        className="py-2 px-4 m-2 font-medium rounded flex items-center justify-center gap-2 bg-black text-yellow-400 border-none shadow-lg transition-colors duration-300 md:hover:bg-yellow-400 md:hover:text-black connect-button"
                    >
                        Disconnect Wallet
                    </button>
                ) : (
                    <div>
                        <button 
                        className="py-2 px-4 m-2 font-medium rounded flex items-center justify-center gap-2 connect-button"
                        style={{
                            color: 'white',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', /* Adding some shadow for depth */
                        }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        {/* Icons and text */}
                        Connect Wallet
                    </button>
                    
                    </div>
                )}
            </div>
            <>
                <div className="seeker-box mx-auto p-4 rounded-lg">
                    <div className="mb-3 mt-2 text-xs sm:text-base text-center text-white-600 hover:text-yellow-400 visited:text-purple-600 underline cursor-pointer" onClick={() => window.open("https://medium.com/@sebastian18018/introducing-ophir-daos-seeker-round-0f3a1d470d2e", "_blank")}>
                        
                        Introduction and details of the seeker round →
                    </div>
                    {/* <div className="text-xl mt-10 md:text-3xl font-bold mb-4 hover:cursor-pointer" onClick={() => setUsdcAmount(usdcBalance)}>Balance: {usdcBalance}{usdcBalance !== '' ? ' USDC' : ''}</div> */}
                    <div className="mb-6 pt-4 flex items-center justify-center">
                        <input 
                            id="twitterHandle" 
                            type="text" 
                            pattern="^@([A-Za-z0-9_]){1,15}$"
                            title="Twitter handle must start with @ followed by up to 15 letters, numbers, or underscores."
                            className="text-lg input-div text-white border p-2 text-left w-full" 
                            placeholder="Twitter handle (optional)" 
                            value={twitterHandle}
                            onChange={(e) => setTwitterHandle(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="relative flex items-center text-lg input-div text-white border w-full">
                            <input 
                                id="usdcAmount" 
                                type="number" 
                                className="input-div input-usdc text-white p-2 text-left flex-grow outline-none" 
                                placeholder="Enter amount" 
                                value={usdcAmount}
                                onChange={(e) => setUsdcAmount(e.target.value)}
                            />
                            <span className="px-3 usdc-bg-border">
                                USDC
                            </span>
                        </div>
                    </div>
                    <div className="mb-3 flex items-center justify-center">
                        <div className="relative mt-1 pb-3 py-2 flex items-center text-lg balance-div text-white w-full ">
                            <div class="flex justify-between w-full">
                                <span className="text-sm pt-1 ml-3 cursor-pointer flex-grow balance-color" onClick={() => setUsdcAmount(usdcBalance)}>
                                    Balance: {parseFloat(usdcBalance).toFixed(2)}
                                </span>
                                <div>
                                    <button 
                                        className="text-sm px-3 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50 min-button"
                                        onClick={() => setUsdcAmount(1000)}
                                    >
                                        Min
                                    </button>
                                    <button 
                                        className="text-sm px-3 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50 add-button"
                                        onClick={() => {
                                            if (parseInt(usdcAmount) < 100000) {
                                                setUsdcAmount(usdcAmount ? Math.min(parseInt(usdcAmount) + 500, 100000) : (usdcBalance >= 500 ? 500 : usdcBalance))
                                            }
                                        }}
                                    >
                                        +500
                                    </button>
                                    <button 
                                        className="text-sm px-3 py-1 mr-1 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50 max-button"
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
                            className={`py-2 px-4 ${isLoading ? 'bg-gray-400' : 'hover:send-button-loading'} send-button font-medium`}
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
                                "Send USDC to OPHIR DAO"
                            )}
                        </button>
                        <div className="text-xs mt-4 text-center">
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