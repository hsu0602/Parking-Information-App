import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons for off-street and on-street parking
const offStreetIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const onStreetIcon = new L.Icon({
  iconUrl: `${process.env.PUBLIC_URL}/marker-icon-red.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const centerCoordinates = {
  Keelung: [25.12825, 121.739183],
  NewTaipei: [25.016982, 121.462786],
  Taoyuan: [24.99368, 121.296967],
  Taichung: [24.147736, 120.673648],
  YilanCounty: [24.702107, 121.73775],
  HualienCounty: [23.991073, 121.61164],
  Tainan: [22.9999, 120.227027]
};

function ParkingMap({ city, searchQuery }) {
  const [parkingData, setParkingData] = useState([]);
  const [token, setToken] = useState('');
  const [selectedParking, setSelectedParking] = useState(null);

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

  // Function to fetch off-street parking data
  const fetchOffStreetData = async (accessToken, city) => {
    const response1 = await axios.get(
      `https://tdx.transportdata.tw/api/basic/v1/Parking/OffStreet/CarPark/City/${city}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const response2 = await axios.get(
      `https://tdx.transportdata.tw/api/basic/v1/Parking/OffStreet/ParkingAvailability/City/${city}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const carParksInfo = response1.data.CarParks || [];
    const carParksAvailability = response2.data.ParkingAvailabilities || [];

    // Merge data by CarParkID
    const mergedData = carParksInfo.map(carPark => {
      const availability = carParksAvailability.find(a => a.CarParkID === carPark.CarParkID);
      return {
        ...carPark,
        AvailableSpaces: availability ? availability.AvailableSpaces : 'N/A',
        type: 'offstreet'
      };
    });

    return mergedData;
  };

  // Function to fetch on-street parking data
  const fetchOnStreetData = async (accessToken, city) => {
    const response1 = await axios.get(
      `https://tdx.transportdata.tw/api/basic/v1/Parking/OnStreet/ParkingSegment/City/${city}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const response2 = await axios.get(
      `https://tdx.transportdata.tw/api/basic/v1/Parking/OnStreet/ParkingSegmentAvailability/City/${city}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const parkingSegmentsInfo = response1.data.ParkingSegments || [];
    const parkingSegmentsAvailability = response2.data.CurbParkingSegmentAvailabilities || [];

    // Merge data by ParkingSegmentID
    const mergedData = parkingSegmentsInfo.map(segment => {
      const availability = parkingSegmentsAvailability.find(a => a.ParkingSegmentID === segment.ParkingSegmentID);
      return {
        ...segment,
        AvailableSpaces: availability ? availability.AvailableSpaces : 'N/A',
        type: 'onstreet'
      };
    });

    return mergedData;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAccessToken();
        setToken(token);
        const offStreetData = await fetchOffStreetData(token, city);
        const onStreetData = await fetchOnStreetData(token, city);
        setParkingData([...offStreetData, ...onStreetData]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [city]);

  const handleMarkerClick = (parking) => {
    setSelectedParking(parking);
  };

  const filteredParkingData = parkingData.filter((parking) => {
    const name = parking.CarParkName?.Zh_tw || parking.ParkingSegmentName?.Zh_tw || '';
    const description = parking.Description || '';
    return name.includes(searchQuery) || description.includes(searchQuery);
  });

  return (
    <div>
      <div style={{ padding: '10px', backgroundColor: '#f9f9f9', borderBottom: '1px solid #ccc' }}>
        <span style={{ marginRight: '20px' }}>
          <img src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png" alt="Off-Street" style={{ marginRight: '5px' }} />
          Off-Street Parking
        </span>
        <span>
          <img src={`${process.env.PUBLIC_URL}/marker-icon-red.png`} alt="On-Street" style={{ marginRight: '5px' }} />
          On-Street Parking
        </span>
      </div>
      <MapContainer center={centerCoordinates[city]} zoom={13} style={{ height: '600px', width: '100%' }} key={city}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {Array.isArray(filteredParkingData) &&
          filteredParkingData.map((parking) => (
            <Marker
              key={parking.CarParkID || parking.ParkingSegmentID}
              position={[parking.CarParkPosition?.PositionLat || parking.ParkingSegmentPosition.PositionLat, parking.CarParkPosition?.PositionLon || parking.ParkingSegmentPosition.PositionLon]}
              icon={parking.type === 'offstreet' ? offStreetIcon : onStreetIcon}
              eventHandlers={{
                click: () => {
                  handleMarkerClick(parking);
                },
              }}
            >
              <Popup>
                {parking.CarParkName?.Zh_tw || parking.ParkingSegmentName.Zh_tw} <br />
                Available Spaces: {parking.AvailableSpaces}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
      {selectedParking && (
        <div className="card my-4">
          <div className="card-body">
            <h2 className="card-title">Parking Information</h2>
            <table className="table">
              <tbody>
                <tr>
                  <td>Car Park Name</td>
                  <td>{selectedParking.CarParkName?.Zh_tw || selectedParking.ParkingSegmentName?.Zh_tw}</td>
                </tr>
                <tr>
                  <td>Car Park Reg No</td>
                  <td>{selectedParking.CarParkID}</td>
                </tr>
                <tr>
                  <td>Description</td>
                  <td>{selectedParking.Description}</td>
                </tr>
                <tr>
                  <td>Telephone</td>
                  <td>{selectedParking.Telephone || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>{selectedParking.Email || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Address</td>
                  <td>{selectedParking.Address || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Fare Description</td>
                  <td>{selectedParking.FareDescription || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParkingMap;
