import { FC } from "react";
import './SmoothnessTest.css';

export const SmoothnessTest: FC = () => {
  return (
    <div
      style={{
        width: '100px',
        height: '100px',
        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
        borderRadius: '50%',
        animation: 'rotate 2s linear infinite',
        border: '4px solid #ffffff',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          background: '#ffffff',
          borderRadius: '50%',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        }}
      />
    </div>
  );
};