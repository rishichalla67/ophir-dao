import React from "react";

const Swap = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "14dvh", // Add padding to the top
      }}
    >
      <iframe
        allow="clipboard-read; clipboard-write"
        src="https://ibc.fun/widget?src_chain=osmosis-1&src_asset=ibc%2F498a0751c798a0d9a389aa3691123dada57daa4fe165d5c75894505b876ba6e4&dest_chain=migaloo-1&dest_asset=factory%2Fmigaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5%2Fophir&amount_in=0&amount_out=0"
        height="820"
        width="450"
        style={{ maxWidth: "85%", width: "100%", borderRadius: "10px" }} // Add borderRadius property
      />
    </div>
  );
};

export default Swap;
