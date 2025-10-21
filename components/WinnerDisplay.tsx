
import React from 'react';
import { Submission } from '../types';

interface WinnerDisplayProps {
  winner: {
    submission: Submission;
    score: number;
  };
  challengeTitle: string;
}

const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ winner, challengeTitle }) => {
  return (
    <div className="w-full max-w-3xl mx-auto text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl my-10">
      <h2 className="text-2xl font-bold text-gray-500 dark:text-gray-400 mb-2">{challengeTitle}</h2>
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-6">¡Tenemos un Ganador!</h1>
      
      <div className="mb-8 p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
        <p className="text-2xl font-semibold">Felicitaciones a</p>
        <p className="text-4xl font-bold tracking-tight">{winner.submission.participantName}</p>
        <p className="mt-2 text-xl">Puntuación Final: <span className="font-bold">{winner.score.toFixed(2)} / 5.00</span></p>
      </div>
      
      <h3 className="text-xl font-bold text-indigo-500 dark:text-indigo-400 mb-4">La Participación Ganadora</h3>
      
      <div className="space-y-4">
        {winner.submission.imageUrl && (
            <div className="h-80 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img src={winner.submission.imageUrl} alt="Participación ganadora" className="max-h-full max-w-full object-contain" />
            </div>
        )}
        {winner.submission.textContent && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 text-center text-lg italic">{winner.submission.textContent}</p>
            </div>
        )}
      </div>

      <p className="mt-8 text-gray-500 dark:text-gray-400">¡Gracias a todos por participar!</p>
    </div>
  );
};

export default WinnerDisplay;
