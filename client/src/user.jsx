// src/User.js
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';


function User() {
  const [location, setLocation] = useState([]);
  const [placeName, setPlaceName] = useState('');
  const [nearbyAdmins, setNearbyAdmins] = useState([]);
  const [error, setError] = useState('');
  const username = "vamsee";
  const [kms, setKms] = useState(1);



  let userLatitude = location.latitude;
  let userLongitude = location.longitude;

  const placeOrder = async () => {
    try {
      await axios.post('http://localhost:4000/order', {userLatitude, userLongitude,kms});
      console.log('Order placed successfully');
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };


  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const showPosition = (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    setLocation({ latitude, longitude });

    getPlaceName(latitude, longitude);
  };

  const showError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setError('User denied the request for Geolocation.');
        break;
      case error.POSITION_UNAVAILABLE:
        setError('Location information is unavailable.');
        break;
      case error.TIMEOUT:
        setError('The request to get user location timed out.');
        break;
      case error.UNKNOWN_ERROR:
        setError('An unknown error occurred.');
        break;
      default:
        setError('An unknown error occurred.');
        break;
    }
  };

  const getPlaceName = async (latitude, longitude) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

    try {
      const response = await axios.get(url);
      if (response.data && response.data.display_name) {
        const address = response.data.display_name;
        setPlaceName(address);
        saveLocationData(username, latitude, longitude, address);
      } else {
        setPlaceName('No results found');
      }
    } catch (error) {
      setPlaceName(`Error: ${error.message}`);
    }
  };

  const saveLocationData = async (username, latitude, longitude, address) => {
    try {
      await axios.post('http://localhost:4000/api/location/user', {
        username,
        latitude,
        longitude,
        address,
      });
      alert('Location data saved successfully');
    } catch (error) {
      setError(`Error saving location data: ${error.message}`);
    }
  };

  const fetchNearbyAdmins = async () => {
    if (location) {
      try {
        const response = await axios.get('http://localhost:4000/api/nearby-admins', {
          params: { latitude: location.latitude, longitude: location.longitude, kms },
        });
        setNearbyAdmins(response.data);
      } catch (error) {
        setError(`Error fetching nearby admins: ${error.message}`);
      }
    } else {
      setError('Location is not available. Please get your location first.');
    }
  };

  return (
    <div>
      <h1>User Page</h1>

      <h1>Get Current Position of User</h1>
      <button onClick={getLocation}>Get Current Location</button>

      {location && (
        <p>
          Latitude: {location.latitude} <br />
          Longitude: {location.longitude}
        </p>
      )}
      {placeName && <p>Place name: {placeName}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <br />
        <input type='number' onChange={(e) => { setKms(e.target.value) }} placeholder='Enter Kms' />
        <br />
        <br />
        <button onClick={fetchNearbyAdmins}>Get Nearby Admins within {kms} km</button>
      </div>

      <h2>Nearby Admins</h2>
      <ul>
        {nearbyAdmins.map((admin, index) => (
          <li key={index}>
            {admin.username}: {admin.Address}
          </li>
        ))}
      </ul>


      <button onClick={placeOrder}>Place Order</button>
    </div>
  );
}

export default User;
