import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const formatNumber = (number, digits) => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FEF', '#EF82A2', '#D35400', '#C0392B', '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#2C3E50', '#F39C12', '#BDC3C7', '#7F8C8D', '#2ECC71', '#3498DB', '#9B59B6', '#34495E'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black p-2 border border-gray-200 shadow rounded">
          <p className="label">{`${payload[0].name} : $${formatNumber(payload[0].value,2)}`}</p>
        </div>
      );
    }
  
    return null;
  };
  

const CryptoPieChart = ({ data }) => {

    const total = data.reduce((acc, entry) => acc + entry.value, 0);

    // Add a percentage property to each slice
    const dataWithPercentage = data.map(entry => ({
        ...entry,
        name: `${entry.name} (${((entry.value / total) * 100).toFixed(2)}%)`, 
    }));

    return (
        <ResponsiveContainer width="100%">
            <PieChart>
                <Pie
                    data={dataWithPercentage} 
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    margin={{
                        top: 5,
                        right: 30,
                        left: 30,
                        bottom: 5,
                    }}
                >
                    {dataWithPercentage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Legend />
                <Tooltip content={<CustomTooltip />} />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default CryptoPieChart;