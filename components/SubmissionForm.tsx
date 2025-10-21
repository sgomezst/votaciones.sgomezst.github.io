import React, { useState } from 'react';
import { User } from '../types';
import Spinner from './Spinner';

interface SubmissionFormProps {
  currentUser: User;
  onAddSubmission: (payload: { participantName: string; userId: string; textContent: string; imageBase64: string | null; }) => Promise<void>;
  challengeTitle: string;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ currentUser, onAddSubmission, challengeTitle }) => {
  const [textContent, setTextContent] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() && !imageBase64) {
      alert('Tu participación no puede estar vacía. Añade texto o una imagen.');
      return;
    }

    setIsSubmitting(true);
    await onAddSubmission({
        participantName: currentUser.name, 
        userId: currentUser.id, 
        textContent: textContent.trim(), 
        imageBase64: imageBase64
    });
    setIsSubmitting(false);
    setTextContent('');
    setImageBase64(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-2">{challengeTitle}</h2>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Hola, {currentUser.name}. ¡Envía tu participación!</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="textContent" className="block text-lg font-semibold mb-2">Tu Respuesta (opcional si subes imagen)</label>
            <textarea
              id="textContent"
              rows={6}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Escribe aquí tu idea, historia o reflexión..."
            />
          </div>
        
          <div>
            <label htmlFor="imageContent" className="block text-lg font-semibold mb-2">Sube tu Imagen (opcional si escribes texto)</label>
            <input
              type="file"
              id="imageContent"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {imageBase64 && (
              <div className="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <img src={imageBase64} alt="Vista previa" className="max-h-60 mx-auto rounded-md" />
              </div>
            )}
          </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center disabled:bg-green-400"
        >
          {isSubmitting ? <Spinner /> : 'Enviar Participación'}
        </button>
      </form>
    </div>
  );
};

export default SubmissionForm;
