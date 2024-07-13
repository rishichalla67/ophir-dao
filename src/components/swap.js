import React, { useState, useEffect } from "react";

const Swap = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Adjust the width as per your requirement for mobile
    };

    window.addEventListener("resize", handleResize);

    // Initial check
    handleResize();

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSelectedOption("Squid Router");
    }
  }, [isMobile]);

  const handleSelect = (option) => {
    setSelectedOption(option);
  };

  const iframeSrcForSquidRouter =
    "https://widget.squidrouter.com/iframe?config=%7B%22integratorId%22%3A%22squid-swap-widget%22%2C%22companyName%22%3A%22Custom%22%2C%22style%22%3A%7B%22neutralContent%22%3A%22%23B1ACA1%22%2C%22baseContent%22%3A%22%23E7D3AA%22%2C%22base100%22%3A%22%23474745%22%2C%22base200%22%3A%22%23212428%22%2C%22base300%22%3A%22%2313181D%22%2C%22error%22%3A%22%23ED6A5E%22%2C%22warning%22%3A%22%23FFB155%22%2C%22success%22%3A%22%232EAEB0%22%2C%22primary%22%3A%22%23E0C072%22%2C%22secondary%22%3A%22%23E9DCBD%22%2C%22secondaryContent%22%3A%22%2301020C%22%2C%22neutral%22%3A%22%230C0F12%22%2C%22roundedBtn%22%3A%2224px%22%2C%22roundedCornerBtn%22%3A%228px%22%2C%22roundedBox%22%3A%2220px%22%2C%22roundedDropDown%22%3A%220px%22%7D%2C%22slippage%22%3A1.5%2C%22infiniteApproval%22%3Afalse%2C%22enableExpress%22%3Atrue%2C%22apiUrl%22%3A%22https%3A%2F%2Fapi.squidrouter.com%22%2C%22mainLogoUrl%22%3A%22https%3A%2F%2Fraw.githubusercontent.com%2Fcosmos%2Fchain-registry%2Fmaster%2Fmigaloo%2Fimages%2Fophir.png%22%2C%22comingSoonChainIds%22%3A%5B%5D%2C%22titles%22%3A%7B%22swap%22%3A%22Swap%22%2C%22settings%22%3A%22Settings%22%2C%22wallets%22%3A%22Wallets%22%2C%22tokens%22%3A%22Select%20Token%22%2C%22chains%22%3A%22Select%20Chain%22%2C%22history%22%3A%22History%22%2C%22transaction%22%3A%22Transaction%22%2C%22allTokens%22%3A%22Select%20Token%22%2C%22destination%22%3A%22Destination%20address%22%2C%22depositAddress%22%3A%22Deposit%20address%22%2C%22seimetamask%22%3A%22Important%20message!%22%7D%2C%22priceImpactWarnings%22%3A%7B%22warning%22%3A3%2C%22critical%22%3A5%7D%2C%22environment%22%3A%22mainnet%22%2C%22showOnRampLink%22%3Atrue%2C%22defaultTokens%22%3A%5B%7B%22chainId%22%3A%22osmosis-1%22%2C%22address%22%3A%22ibc%2F498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4%22%7D%2C%7B%22chainId%22%3A%22migaloo-1%22%2C%22address%22%3A%22uwhale%22%7D%5D%2C%22initialFromChainId%22%3A%22osmosis-1%22%2C%22initialToChainId%22%3A%22migaloo-1%22%2C%22iframeBackgroundColorHex%22%3A%22%23000000%22%7D";

  const iframeSrcForSkipGo =
    "https://ibc.fun/widget?src_chain=osmosis-1&src_asset=ibc%2F498a0751c798a0d9a389aa3691123dada57daa4fe165d5c75894505b876ba6e4&dest_chain=migaloo-1&dest_asset=factory%2Fmigaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5%2Fophir&amount_in=0&amount_out=0";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "14dvh",
      }}
      className="global-bg"
    >
      {isMobile ? (
        <>
          <iframe
            allow="clipboard-read; clipboard-write"
            src={iframeSrcForSquidRouter} // Ensure you set this variable accordingly
            height="820"
            width="450"
            style={{
              maxWidth: "85%",
              width: "100%",
              borderRadius: "10px",
              display: "block",
              margin: "0 auto",
            }}
          />
        </>
      ) : (
        <>
          <iframe
            allow="clipboard-read; clipboard-write"
            src={iframeSrcForSkipGo} // Ensure you set this variable accordingly
            height="820"
            width="450"
            style={{
              maxWidth: "85%",
              width: "100%",
              borderRadius: "10px",
              display: "block",
              margin: "0 auto",
            }}
          />
        </>
      )}
    </div>
  );
};

export default Swap;
