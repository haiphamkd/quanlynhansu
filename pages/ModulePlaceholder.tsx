
import React from 'react';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
}

const ModulePlaceholder: React.FC<Props> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="bg-gray-100 p-6 rounded-full mb-4">
        <Construction className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md">
        Module này đang được xây dựng. Vui lòng quay lại sau hoặc kiểm tra Dashboard để xem tổng quan.
      </p>
    </div>
  );
};

export default ModulePlaceholder;
