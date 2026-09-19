import React, { useState } from 'react';
import { MOCK_SPEAKERS } from '../../constants/mockData';
import SpeakerCard from '../../components/organizer/SpeakerCard';
import CueCardGenerator from '../../components/ai/CueCardGenerator';
import { Users, Plus, Search } from 'lucide-react';

export const SpeakersPage = () => {
  const [speakers, setSpeakers] = useState(MOCK_SPEAKERS);
  const [selectedSpeaker, setSelectedSpeaker] = useState(MOCK_SPEAKERS[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleStatusToggle = (speakerId) => {
    setSpeakers((prev) =>
      prev.map((s) => {
        if (s.id === speakerId) {
          const nextStatus = s.status === 'ON STAGE' ? 'COMPLETED' : 'ON STAGE';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const filteredSpeakers = speakers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100">Speakers Roster & Decks</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Stage readiness, audio feed assignments, and presentation cues
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20">
          <Plus className="w-4 h-4" />
          <span>Add Keynote Speaker</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide): Speaker Roster Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search speaker by name, company, or presentation topic..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSpeakers.map((spk) => (
              <div
                key={spk.id}
                onClick={() => setSelectedSpeaker(spk)}
                className={`cursor-pointer rounded-2xl transition-all ${
                  selectedSpeaker?.id === spk.id ? 'ring-2 ring-cyan-500' : ''
                }`}
              >
                <SpeakerCard speaker={spk} onStatusToggle={handleStatusToggle} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Cue Card Generator for Selected Speaker */}
        <div>
          <CueCardGenerator speaker={selectedSpeaker} />
        </div>
      </div>
    </div>
  );
};

export default SpeakersPage;
