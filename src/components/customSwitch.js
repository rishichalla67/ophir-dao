import React from 'react';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import FormControlLabel from '@mui/material/FormControlLabel';

// Import your custom images
import mainnetIcon from 'https://app.whitewhale.money/logos/whale.svg'; // Update the path accordingly
import testnetIcon from 'https://ping.pfc.zone/logos/migaloo.png'; // Update the path accordingly

// Custom switch component with icons
const CustomSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#fff',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    '& + .MuiSwitch-track': {
      backgroundColor: theme.palette.mode === 'dark' ? '#aab4be' : '#aab4be',
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    opacity: 1,
  },
  '& .MuiSwitch-switchBase': {
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundImage: `url(${testnetIcon})`,
    backgroundSize: 'cover',
  },
  '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': {
    backgroundImage: `url(${mainnetIcon})`,
  },
  '& .MuiSwitch-track': {
    opacity: 0.3,
    backgroundColor: theme.palette.mode === 'dark' ? '#aab4be' : '#aab4be',
  },
}));

const CustomSwitchWithIcons = ({ checked, onChange }) => (
  <FormControlLabel
    control={
      <CustomSwitch
        checked={checked}
        onChange={onChange}
        icon={<img src={testnetIcon} alt="Testnet" style={{ width: '100%', height: '100%' }} />}
        checkedIcon={<img src={mainnetIcon} alt="Mainnet" style={{ width: '100%', height: '100%' }} />}
      />
    }
    label={checked ? "Mainnet" : "Testnet"}
  />
);

export default CustomSwitchWithIcons;