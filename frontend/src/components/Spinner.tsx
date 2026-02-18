import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
    </div>
  );
};

export default Spinner;
