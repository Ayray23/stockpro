import React, { useEffect } from 'react';

const Tr = () => {
  useEffect(() => {
    const fetchData = async () => {
      // Your async logic here
    };

    fetchData();

    return () => {
      // Cleanup logic here
    };
  }, []); // Add your dependencies inside the array

  return (
    <div>
      {/* Your component UI here */}
    </div>
  );
};

export default Tr;
