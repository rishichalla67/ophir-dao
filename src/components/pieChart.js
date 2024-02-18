import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const formatNumber = (number, digits) => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FEF', '#EF82A2'];

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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={isMobile ? null : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                {isMobile && <Legend />}
                <Tooltip content={<CustomTooltip />} />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default CryptoPieChart;