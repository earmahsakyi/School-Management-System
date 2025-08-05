import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { verifyPasscode } from '../../actions/passcodeActions';
import { FaSpinner } from 'react-icons/fa';

const PasscodeModal = ({ section, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  
  const { loading, access, errors } = useSelector(state => state.passcode);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  // Check if passcode was successfully verified
  useEffect(() => {
    if (access[section] === true) {
      onSuccess(); // Close modal and allow access
    } else if (access[section] === false) {
      setError('Invalid passcode. Please try again.');
    }
  }, [access, section, onSuccess]);

  // Set error from Redux state
  useEffect(() => {
    if (errors[section]) {
      setError(errors[section]);
    }
  }, [errors, section]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a passcode');
      return;
    }
    
    setError('');
    dispatch(verifyPasscode(section, code));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // If user is not authenticated, don't show the modal
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-80 shadow-lg">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Access Required
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Enter passcode for {section.replace('-', ' ').toUpperCase()}
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              className={`border p-1 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500  ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(''); // Clear error when typing
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter passcode"
              disabled={loading}
              autoFocus
            />
            
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
            
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasscodeModal;