import { useState, useEffect } from 'react';
import axios from 'axios';


export function useVehicleClasses() {
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehicleClasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/vehicle-classes`);
      setVehicleClasses(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch vehicle classes:', err);
      setError('Failed to load vehicle classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleClasses();
  }, []);

  return { vehicleClasses, loading, error, refresh: fetchVehicleClasses };
}
