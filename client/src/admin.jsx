import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import ringtone from './alert-33762.mp3';
import axios from 'axios';

const socket = io('http://localhost:4000');

function Admin({ adminId }) {
  const [orders, setOrders] = useState([]);
  const [acceptedOrder, setAcceptedOrder] = useState(null);
  const [audio] = useState(new Audio(ringtone));
  const [isAudioAllowed, setIsAudioAllowed] = useState(false);

  const [location, setLocation] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [error, setError] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const getLocation = () => {
    if (latitude === "" || longitude === "") {
      alert("Please fill latitude and longitude");
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const showPosition = (position) => {
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
        saveLocationData(adminId, latitude, longitude, address);
      } else {
        setPlaceName('No results found');
      }
    } catch (error) {
      setPlaceName(`Error: ${error.message}`);
    }
  };

  const saveLocationData = async (adminId, latitude, longitude, address) => {
    try {
      await axios.post('http://localhost:4000/api/location/admin', {
        username: adminId,
        latitude,
        longitude,
        address,
      });
      alert('Location data saved successfully');
    } catch (error) {
      setError(`Error saving location data: ${error.message}`);
    }
  };

  useEffect(() => {
    // Register the admin's socket ID
    socket.emit('registerAdmin', adminId);

    if (isAudioAllowed) {
      socket.on('newOrder', order => {
        setOrders(prevOrders => [...prevOrders, order]);
        audio.play();
      });

      socket.on('orderAccepted', acceptedOrder => {
        setOrders(prevOrders => prevOrders.filter(order => order.orderId !== acceptedOrder.orderId));
        audio.pause();
      });

      socket.on('orderRejected', rejectedOrder => {
        setOrders(prevOrders => prevOrders.filter(order => order.orderId !== rejectedOrder.orderId));
        audio.pause();
      });

      socket.on('orderDetails', order => {
        setAcceptedOrder(order);
        audio.pause();
      });

      return () => {
        socket.off('newOrder');
        socket.off('orderAccepted');
        socket.off('orderRejected');
        socket.off('orderDetails');
      };
    }
  }, [audio, isAudioAllowed, adminId]);

  const acceptOrder = (order) => {
    socket.emit('acceptOrder', order);
  };

  const rejectOrder = (order) => {
    socket.emit('rejectOrder', order);
  };

  const handleAudioPermission = () => {
    setIsAudioAllowed(true);
    audio.play();
    audio.pause();  // Just to trigger user interaction
  };

  return (
    <div>
      <h1>{adminId} Page</h1>
      {!isAudioAllowed && (
        <button onClick={handleAudioPermission}>Enable Notification Sound</button>
      )}
      <br/>
      <br/>
      <a href='https://www.gps-coordinates.net/' target='_blank'>
        <button>Click me to set coordinate manually</button>
      </a>
      <br/>
      <br/>
      <input type='text' onChange={((e) => setLatitude(e.target.value))} placeholder='Enter latitude' required/>
      <br/>
      <br/>
      <input type='text' onChange={((e) => setLongitude(e.target.value))} placeholder='Enter longitude' required/>
      <br/>

      <h1>Get Current Position of {adminId}</h1>
      <button onClick={getLocation}>Get Current Location of {adminId}</button>
      {location && (
        <b>
          Latitude: {location.latitude} <br />
          Longitude: {location.longitude}
        </b>
      )}
      {placeName && <b>Place name: {placeName}</b>}
      {error && <b style={{ color: 'red' }}>{error}</b>}

      <ul>
        {orders.map((order, index) => (
          <li key={index}>
            Order ID: {order.orderId}, Pickup Address: {order.pickupAddress}, Product ID: {order.productId}, Quantity: {order.quantity}
            <button onClick={() => acceptOrder(order)}>Accept Order</button>
            <button onClick={() => rejectOrder(order)}>Reject Order</button>
          </li>
        ))}
      </ul>
      {acceptedOrder && (
        <div className="accepted-order">
          <h2>Accepted Order Details</h2>
          <p>Order ID: {acceptedOrder.orderId}</p>
          <p>User ID: {acceptedOrder.userId}</p>
          <p>Product ID: {acceptedOrder.productId}</p>
          <p>Quantity: {acceptedOrder.quantity}</p>
          <p>Pickup Address: {acceptedOrder.pickupAddress}</p>
        </div>
      )}
    </div>
  );
}

export default Admin;
