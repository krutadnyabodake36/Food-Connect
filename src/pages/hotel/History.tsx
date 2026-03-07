import React, { useState } from 'react';
import { generateImpactVideo } from '../../services/geminiService';
import { Video, Loader2, Share2, Star, MessageSquare, Download, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { HotelDonation } from '../../types';
import { downloadCSV, openInGoogleSheets, generateSummary } from '../../lib/exportService';

interface HistoryProps {
    donations: HotelDonation[];
    onRate: (id: string, rating: number, review?: string) => void;
}

const History: React.FC<HistoryProps> = ({ donations, onRate }) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [videos, setVideos] = useState<Record<string, string>>({});
  const [ratingModalId, setRatingModalId] = useState<string | null>(null);
  const [tempRating, setTempRating] = useState(0);
  const [tempReview, setTempReview] = useState('');

  const historyItems = donations.filter(d => d.status === 'completed');

  const handleGenerateVideo = async (id: string, imageUrl: string) => {
    setGeneratingId(id);
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "image.jpg", { type: "image/jpeg" });
        const videoUrl = await generateImpactVideo(file);
        setVideos(prev => ({ ...prev, [id]: videoUrl }));
    } catch (e) { console.error(e); alert("Video generation failed."); }
    finally { setGeneratingId(null); }
  };

  const openRatingModal = (id: string) => { setRatingModalId(id); setTempRating(0); setTempReview(''); };
  const submitRating = () => { if (ratingModalId && tempRating > 0) { onRate(ratingModalId, tempRating, tempReview); setRatingModalId(null); } };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Donation History</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCSV(donations)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => openInGoogleSheets(donations)}
            className="flex items-center gap-2 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-forest-600/20"
          >
            <FileSpreadsheet size={16} />
            Google Sheets
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {donations.length > 0 && (() => {
        const stats = generateSummary(donations);
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3">
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Donations</p>
              <p className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3">
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Weight</p>
              <p className="text-xl font-bold text-forest-600 dark:text-forest-400 mt-0.5">{stats.totalWeight} kg</p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3">
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Completed</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.completed}</p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3">
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Completion Rate</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.completionRate}%</p>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 gap-6">
        {historyItems.length === 0 && (<div className="text-center py-12 text-stone-400 dark:text-stone-500">No completed donations yet.</div>)}
        {historyItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                <div className="md:w-48 h-48 md:h-auto relative bg-stone-100 dark:bg-stone-800">
                   {videos[item.id] ? (<video src={videos[item.id]} controls className="w-full h-full object-cover" />) : (<img src={item.imageUrl || "https://placehold.co/300x200?text=Food"} alt="Food" className="w-full h-full object-cover" />)}
                   {!videos[item.id] && item.imageUrl && (
                       <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group">
                            <button onClick={() => handleGenerateVideo(item.id, item.imageUrl!)} disabled={!!generatingId} className="opacity-0 group-hover:opacity-100 bg-white dark:bg-stone-800 text-forest-800 dark:text-forest-400 px-4 py-2 rounded-full font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-50">
                                {generatingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
                                {generatingId === item.id ? 'Generating...' : 'Create Impact Video'}
                            </button>
                       </div>
                   )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg text-stone-900 dark:text-stone-100">{item.title}</h3>
                            <span className="text-stone-500 dark:text-stone-400 text-sm">{item.timestamp}</span>
                        </div>
                        <p className="text-stone-600 dark:text-stone-400">Weight: {item.weight} kg</p>
                        <div className="mt-4 flex gap-2">
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Completed</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-4 items-center justify-between">
                         {videos[item.id] && (<button className="text-sm flex items-center gap-2 text-forest-700 dark:text-forest-400 font-medium"><Share2 size={16} /> Share on Social</button>)}
                         <div className="ml-auto">
                            {item.rating ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex">{[1,2,3,4,5].map(star => (<Star key={star} size={16} className={star <= item.rating! ? "text-amber-400 fill-amber-400" : "text-stone-300 dark:text-stone-600"} />))}</div>
                                    <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">Rated</span>
                                </div>
                            ) : (
                                <button onClick={() => openRatingModal(item.id)} className="text-sm bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 font-medium"><Star size={14} /> Rate Volunteer</button>
                            )}
                         </div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {ratingModalId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-sm p-6">
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 text-center mb-1">Rate Experience</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-center text-sm mb-6">How was the pickup service?</p>
                  <div className="flex justify-center gap-2 mb-6">
                      {[1,2,3,4,5].map(star => (<button key={star} onClick={() => setTempRating(star)} className="transition-transform hover:scale-110"><Star size={32} className={`${star <= tempRating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 dark:text-stone-700'}`} strokeWidth={1.5} /></button>))}
                  </div>
                  <div className="mb-6 relative">
                      <MessageSquare size={16} className="absolute top-3 left-3 text-stone-400" />
                      <textarea value={tempReview} onChange={(e) => setTempReview(e.target.value)} placeholder="Leave a comment (optional)..." className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-3 pl-9 text-sm focus:outline-none focus:border-forest-500 dark:text-stone-200 resize-none h-24" />
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setRatingModalId(null)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">Cancel</button>
                      <button onClick={submitRating} disabled={tempRating === 0} className="flex-1 py-2.5 bg-forest-600 text-white font-medium rounded-lg hover:bg-forest-700 disabled:opacity-50 transition-colors">Submit</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default History;
