
import React, { useState, useEffect } from 'react';
import { ContestPhase, RatingCriterion } from '../types';
import Spinner from './Spinner';

interface AdminPanelProps {
  currentPhase: ContestPhase;
  criteria: RatingCriterion[];
  challengeTitle: string;
  onPhaseChange: (phase: ContestPhase) => Promise<void>;
  onCriteriaChange: (newCriteria: RatingCriterion[]) => Promise<void>;
  onTitleChange: (newTitle: string) => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentPhase, criteria, challengeTitle, onPhaseChange, onCriteriaChange, onTitleChange }) => {
  const [newCriterionLabel, setNewCriterionLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(challengeTitle);

  useEffect(() => {
    // Sincronizar el título editable si la prop cambia desde el padre (después de guardar)
    setEditableTitle(challengeTitle);
  }, [challengeTitle]);

  const handlePhaseChange = async (phase: ContestPhase) => {
    // Añadir confirmación para la acción destructiva de reiniciar
    if (phase === ContestPhase.SUBMISSION && currentPhase === ContestPhase.REVEALED) {
      if (!window.confirm("¿Estás seguro de que quieres reiniciar el reto? Se borrarán todas las participaciones y votos existentes.")) {
        return;
      }
    }
    setIsLoading(true);
    await onPhaseChange(phase);
    setIsLoading(false);
  };

  const addCriterion = () => {
    if (newCriterionLabel.trim()) {
      const newCriteria = [...criteria, { id: `crit-${Date.now()}`, label: newCriterionLabel.trim() }];
      onCriteriaChange(newCriteria);
      setNewCriterionLabel('');
    }
  };

  const removeCriterion = (id: string) => {
    const newCriteria = criteria.filter(c => c.id !== id);
    onCriteriaChange(newCriteria);
  };

  const handleTitleSave = async () => {
    if (editableTitle.trim()) {
        setIsLoading(true);
        await onTitleChange(editableTitle.trim());
        setIsLoading(false);
        setIsEditingTitle(false);
    }
  }

  const phaseActions: { [key in ContestPhase]: React.ReactNode } = {
    [ContestPhase.SUBMISSION]: (
      <button onClick={() => handlePhaseChange(ContestPhase.VOTING)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
        Iniciar Votaciones
      </button>
    ),
    [ContestPhase.VOTING]: (
      <button onClick={() => handlePhaseChange(ContestPhase.REVEALED)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">
        Revelar Ganador
      </button>
    ),
    [ContestPhase.REVEALED]: (
      <button onClick={() => handlePhaseChange(ContestPhase.SUBMISSION)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">
        Reiniciar Reto
      </button>
    ),
  };

  const phaseBackActions: { [key in ContestPhase]?: React.ReactNode } = {
    [ContestPhase.VOTING]: (
        <button onClick={() => handlePhaseChange(ContestPhase.SUBMISSION)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">
            Volver a Participaciones
        </button>
    ),
    [ContestPhase.REVEALED]: (
        <button onClick={() => handlePhaseChange(ContestPhase.VOTING)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">
            Volver a Votaciones
        </button>
    ),
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-md my-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Panel de Administrador</h2>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-gray-700 rounded-lg mb-6">
        <div>
          <span className="font-semibold">Fase Actual:</span>
          <span className="ml-2 px-3 py-1 text-sm font-bold text-white bg-indigo-500 rounded-full">{currentPhase}</span>
        </div>
        <div className="flex items-center gap-2">
            {isLoading ? <Spinner /> : (
              <>
                {phaseBackActions[currentPhase]}
                {phaseActions[currentPhase]}
              </>
            )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Título del Reto</h3>
          {isEditingTitle ? (
            <div className="flex gap-2">
                <input
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="flex-grow p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
                <button onClick={handleTitleSave} className="bg-green-500 text-white px-4 py-2 rounded-lg">Guardar</button>
                <button onClick={() => { setIsEditingTitle(false); setEditableTitle(challengeTitle); }} className="bg-gray-500 text-white px-4 py-2 rounded-lg">Cancelar</button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
                <p className="text-gray-600 dark:text-gray-300">{challengeTitle}</p>
                <button onClick={() => setIsEditingTitle(true)} className="text-indigo-500 hover:text-indigo-700 text-sm font-semibold">Editar</button>
            </div>
          )}
        </div>

        <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Asuntos a Valorar (1-5 estrellas)</h3>
          <ul className="space-y-2 mb-4">
            {criteria.map(c => (
              <li key={c.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-600 p-2 rounded-md">
                <span>{c.label}</span>
                <button onClick={() => removeCriterion(c.id)} disabled={currentPhase !== ContestPhase.SUBMISSION} className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-bold">
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
          {currentPhase === ContestPhase.SUBMISSION && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCriterionLabel}
                onChange={(e) => setNewCriterionLabel(e.target.value)}
                placeholder="Nuevo criterio"
                className="flex-grow p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
              <button onClick={addCriterion} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">Añadir</button>
            </div>
          )}
          {currentPhase !== ContestPhase.SUBMISSION && <p className="text-sm text-gray-500">Los criterios solo se pueden editar en la fase de SUBMISSION.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
