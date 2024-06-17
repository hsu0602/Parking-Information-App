import React, { useState } from 'react';
import Header from './Header';
import ParkingMap from './ParkingMap';
import 'bootstrap/dist/css/bootstrap.min.css';

const cities = [
  { name: 'Keelung', label: 'Keelung' },
  { name: 'NewTaipei', label: 'New Taipei' },
  { name: 'Taoyuan', label: 'Taoyuan' },
  { name: 'Taichung', label: 'Taichung' },
  { name: 'YilanCounty', label: 'Yilan County' },
  { name: 'HualienCounty', label: 'Hualien County' },
  { name: 'Tainan', label: 'Tainan' }
];

function App() {
  const [selectedCity, setSelectedCity] = useState('Keelung');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
    setSearchQuery(''); // Reset search query when city changes
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div className="container">
      <Header />
      <div className="row my-4">
        <div className="col-md-6">
          <label htmlFor="city-select" className="form-label">Select a City: </label>
          <select id="city-select" className="form-select" value={selectedCity} onChange={handleCityChange}>
            {cities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label htmlFor="search-bar" className="form-label">Search Parking: </label>
          <input
            id="search-bar"
            type="text"
            className="form-control"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name or description"
          />
        </div>
      </div>
      <ParkingMap city={selectedCity} searchQuery={searchQuery} />
    </div>
  );
}

export default App;
