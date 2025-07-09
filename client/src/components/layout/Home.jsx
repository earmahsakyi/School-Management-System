import React from 'react';
import Login from '../auth/Login';
import backgroundImage from '../../assets/Bcakground.jpg'; // make sure spelling fixed
import Highlight from './Highlight';

const Home = () => {
  return (
    <div 
      className="fixed top-0 left-0 min-h-screen w-screen flex flex-col md:flex-row items-center justify-center"
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat' 
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* Left: Highlight */}
      {/* <div className="relative z-10 w-full md:w-1/2 flex justify-center items-center p-6 md:mr-6">
        <Highlight />
      </div> */}

      {/* Right: Login */}
      <div className="relative z-10 w-full md:w-1/2 flex justify-center items-center p-6 md:ml-6">
        <Login />
      </div>
    </div>
  );
};

export default Home;
