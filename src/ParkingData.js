import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ParkingData({ city }) {
  const [parkingSpots, setParkingSpots] = useState([]);
  const [token, setToken] = useState('');

  // Function to get the access token
  const getAccessToken = async () => {
    const response = await axios.post(
      'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token',
      new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': 'sssun-09d597db-5ec8-446e',
        'client_secret': '8ffe4bd6-dc2e-40e1-8f9e-2c5d62e13ab1',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  };

  // Function to fetch parking data
  const fetchParkingData = async (accessToken, city) => {
    const response = await axios.get(
      `https://tdx.transportdata.tw/api/basic/v1/Parking/OffStreet/ParkingAvailability/City/${city}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data.ParkingAvailabilities || []; // Ensure that we return an array
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAccessToken();
        setToken(token);
        const data = await fetchParkingData(token, city);
        setParkingSpots(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [city]);

  return (
    <div>
      <h2>Parking Spots in {city}</h2>
      <ul>
        {Array.isArray(parkingSpots) &&
          parkingSpots.map((spot) => (
            <li key={spot.CarParkID}>
              {spot.CarParkName.Zh_tw} - {spot.AvailableSpaces} spaces available
            </li>
          ))}
      </ul>
    </div>
  );
}

export default ParkingData;
