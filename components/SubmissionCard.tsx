
import React, { useState, useEffect } from 'react';
import { Submission, RatingCriterion, Vote, User } from '../types';
import StarRating from './StarRating';
import Spinner from './Spinner';

interface SubmissionCardProps {
  submission: Submission;
  index: number;
  criteria: RatingCriterion[];
  currentUser: User;
  existingVote?: Vote;
  onVote: (submissionId: string, ratings: { [criterionId: string]: number }) => Promise<void>;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, index, criteria, currentUser, existingVote, onVote }) => {
  const [ratings, setRatings] = useState<{ [criterionId: string]: number }>({});
  const [isVoting, setIsVoting] = useState(false);
  
  const hasVoted = !!existingVote;

  useEffect(() => {
    if (hasVoted) {
      setRatings(existingVote.ratings);
    } else {
      const initialRatings = criteria.reduce((acc, criterion) => {
        acc[criterion.id] = 0;
        return acc;
      }, {} as { [criterionId: string]: number });
      setRatings(initialRatings);
    }
  }, [criteria, existingVote, hasVoted]);

  const handleSetRating = (criterionId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [criterionId]: rating }));
  };

  const handleSubmitVote = async () => {
    if (Object.values(ratings).some(r => r === 0)) {
        alert("Por favor, valora todos los criterios antes de enviar tu voto.");
        return;
    }
    setIsVoting(true);
    await onVote(submission.id, ratings);
    setIsVoting(false);
  };
  
  const hasSubmittedThis = submission.userId === currentUser.id;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 flex flex-col">
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-indigo-500 dark:text-indigo-400 mb-4">Participación #{index + 1}</h3>
        
        <div className="mb-6 flex-grow">
          {submission.imageUrl && (
            <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
              <img src={submission.imageUrl} alt={`Participación ${index + 1}`} className="max-h-full max-w-full object-contain" />
            </div>
          )}
          {submission.textContent && (
            <div className={`p-4 rounded-lg ${!submission.imageUrl ? 'h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700' : ''}`}>
               <p className="text-gray-700 dark:text-gray-300 text-center italic">{submission.textContent}</p>
            </div>
          )}
        </div>
        
        {hasSubmittedThis ? (
          <div className="text-center p-4 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-800 dark:text-blue-200 mt-auto">
            Esta es tu participación. ¡No puedes votar por ella!
          </div>
        ) : (
          <div className="mt-auto">
            <h4 className="font-semibold mb-3">{hasVoted ? "Tus valoraciones:" : "Valora esta participación:"}</h4>
            <div className="space-y-4">
              {criteria.map(criterion => (
                <div key={criterion.id} className="flex flex-col sm:flex-row justify-between sm:items-center">
                  <span className="text-gray-600 dark:text-gray-300 mb-2 sm:mb-0">{criterion.label}</span>
                  <StarRating
                    rating={ratings[criterion.id] || 0}
                    setRating={(rating) => handleSetRating(criterion.id, rating)}
                    disabled={hasVoted || isVoting}
                  />
                </div>
              ))}
            </div>
          
            {!hasVoted && (
              <button
                onClick={handleSubmitVote}
                disabled={isVoting}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center disabled:bg-indigo-400"
              >
                {isVoting ? <Spinner /> : 'Enviar Voto'}
              </button>
            )}
            {hasVoted && (
                 <div className="text-center mt-6 p-3 bg-green-100 dark:bg-green-900 rounded-lg text-green-800 dark:text-green-200">
                    ¡Gracias por tu voto!
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionCard;
